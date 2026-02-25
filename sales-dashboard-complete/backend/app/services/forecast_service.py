import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error
from typing import Dict, List, Tuple
from datetime import datetime, timedelta
import logging
from ..models.schemas import ForecastResponse

logger = logging.getLogger(__name__)

class ForecastService:
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_trained = False
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features for the regression model"""
        # Convert date to numeric features
        df['days_since_start'] = (df['order_date'] - df['order_date'].min()).dt.days
        df['day_of_week'] = df['order_date'].dt.dayofweek
        df['month'] = df['order_date'].dt.month
        df['quarter'] = df['order_date'].dt.quarter
        df['year'] = df['order_date'].dt.year
        
        # Create lag features
        df = df.sort_values('order_date')
        df['sales_lag_1'] = df['total_sales'].shift(1)
        df['sales_lag_7'] = df['total_sales'].shift(7)
        df['sales_lag_30'] = df['total_sales'].shift(30)
        
        # Create rolling average features
        df['sales_ma_7'] = df['total_sales'].rolling(window=7).mean()
        df['sales_ma_30'] = df['total_sales'].rolling(window=30).mean()
        
        # Drop rows with NaN values
        df = df.dropna()
        
        # Select features
        feature_columns = [
            'days_since_start', 'day_of_week', 'month', 'quarter', 'year',
            'sales_lag_1', 'sales_lag_7', 'sales_lag_30',
            'sales_ma_7', 'sales_ma_30'
        ]
        
        X = df[feature_columns].values
        y = df['total_sales'].values
        
        return X, y, df
    
    def train_model(self, df: pd.DataFrame) -> Dict:
        """Train the forecasting model"""
        try:
            X, y, processed_df = self.prepare_features(df)
            
            if len(X) < 50:  # Need sufficient data for training
                raise ValueError("Insufficient data for training. Need at least 50 data points.")
            
            # Split data into train and test
            split_idx = int(len(X) * 0.8)
            X_train, X_test = X[:split_idx], X[split_idx:]
            y_train, y_test = y[:split_idx], y[split_idx:]
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model.fit(X_train_scaled, y_train)
            
            # Make predictions on test set
            y_pred = self.model.predict(X_test_scaled)
            
            # Calculate metrics
            mae = mean_absolute_error(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            rmse = np.sqrt(mse)
            
            # Calculate accuracy as 1 - normalized RMSE
            accuracy = max(0, 1 - (rmse / np.mean(y_test)))
            
            self.is_trained = True
            self.last_date = processed_df['order_date'].max()
            self.last_features = processed_df.iloc[-1]
            
            logger.info(f"Model trained successfully. MAE: {mae:.2f}, RMSE: {rmse:.2f}, Accuracy: {accuracy:.2f}")
            
            return {
                'mae': mae,
                'rmse': rmse,
                'accuracy': accuracy,
                'training_samples': len(X_train),
                'test_samples': len(X_test)
            }
            
        except Exception as e:
            logger.error(f"Error training model: {str(e)}")
            raise
    
    def predict_future_sales(self, periods: int = 30, confidence_level: float = 0.95) -> ForecastResponse:
        """Generate future sales predictions"""
        if not self.is_trained:
            raise ValueError("Model must be trained before making predictions")
        
        try:
            # Generate future dates
            future_dates = []
            current_date = self.last_date
            
            for i in range(1, periods + 1):
                future_date = current_date + timedelta(days=i)
                future_dates.append(future_date)
            
            # Prepare features for future dates
            future_features = []
            last_sales = self.last_features['total_sales']
            
            for i, future_date in enumerate(future_dates):
                # Calculate features for future date
                days_since_start = (future_date - self.last_date).days + self.last_features['days_since_start']
                day_of_week = future_date.weekday()
                month = future_date.month
                quarter = (month - 1) // 3 + 1
                year = future_date.year
                
                # Use last known values for lag features (simplified approach)
                sales_lag_1 = last_sales
                sales_lag_7 = last_sales
                sales_lag_30 = last_sales
                sales_ma_7 = last_sales
                sales_ma_30 = last_sales
                
                features = [
                    days_since_start, day_of_week, month, quarter, year,
                    sales_lag_1, sales_lag_7, sales_lag_30,
                    sales_ma_7, sales_ma_30
                ]
                
                future_features.append(features)
            
            # Convert to numpy array and scale
            X_future = np.array(future_features)
            X_future_scaled = self.scaler.transform(X_future)
            
            # Make predictions
            predictions = self.model.predict(X_future_scaled)
            
            # Calculate confidence intervals (simplified approach)
            # In a real scenario, you'd use proper statistical methods
            std_error = np.std(predictions) * 0.1  # Simplified standard error
            z_score = 1.96 if confidence_level == 0.95 else 2.576  # 95% or 99%
            
            margin_of_error = z_score * std_error
            upper_bound = predictions + margin_of_error
            lower_bound = predictions - margin_of_error
            
            # Ensure no negative values
            predictions = np.maximum(predictions, 0)
            lower_bound = np.maximum(lower_bound, 0)
            
            # Calculate model accuracy (simplified)
            model_accuracy = min(0.95, max(0.5, 1 - (std_error / np.mean(predictions))))
            
            return ForecastResponse(
                dates=[date.strftime('%Y-%m-%d') for date in future_dates],
                predicted_sales=[round(pred, 2) for pred in predictions],
                upper_bound=[round(ub, 2) for ub in upper_bound],
                lower_bound=[round(lb, 2) for lb in lower_bound],
                model_accuracy=round(model_accuracy, 3)
            )
            
        except Exception as e:
            logger.error(f"Error making predictions: {str(e)}")
            raise
    
    def get_feature_importance(self) -> Dict[str, float]:
        """Get feature importance from the trained model"""
        if not self.is_trained:
            return {}
        
        feature_names = [
            'days_since_start', 'day_of_week', 'month', 'quarter', 'year',
            'sales_lag_1', 'sales_lag_7', 'sales_lag_30',
            'sales_ma_7', 'sales_ma_30'
        ]
        
        # For linear regression, use absolute coefficients as importance
        importance = np.abs(self.model.coef_)
        
        # Normalize to sum to 1
        importance = importance / importance.sum()
        
        return dict(zip(feature_names, importance))