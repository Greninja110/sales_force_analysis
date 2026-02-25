from fastapi import APIRouter, HTTPException, Query, Path
from ..services.data_service import DataService
from ..services.forecast_service import ForecastService
from ..models.schemas import ForecastResponse, ForecastRequest

router = APIRouter()
data_service = DataService()
forecast_service = ForecastService()

@router.post("/train")
async def train_forecast_model():
    """Train the forecasting model"""
    try:
        # Get time series data
        df = await data_service.get_data_for_forecasting()
        
        if df.empty:
            raise HTTPException(status_code=400, detail="No data available for training")
        
        # Train the model
        training_results = forecast_service.train_model(df)
        
        return {
            "message": "Model trained successfully",
            "training_results": training_results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict", response_model=ForecastResponse)
async def predict_sales(request: ForecastRequest):
    """Generate sales forecast"""
    try:
        # Train model if not already trained
        if not forecast_service.is_trained:
            df = await data_service.get_data_for_forecasting()
            if df.empty:
                raise HTTPException(status_code=400, detail="No data available for forecasting")
            forecast_service.train_model(df)
        
        # Make predictions
        forecast = forecast_service.predict_future_sales(
            periods=request.periods,
            confidence_level=request.confidence_level
        )
        
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/predict/{days}")
async def predict_sales_simple(
    days: int = Path(description="Number of days to predict"),
    confidence: float = Query(default=0.95, description="Confidence level (0.90, 0.95, 0.99)")
):
    """Simple sales prediction endpoint"""
    try:
        # Validate inputs
        if days <= 0 or days > 365:
            raise HTTPException(status_code=400, detail="Days must be between 1 and 365")
        
        if confidence not in [0.90, 0.95, 0.99]:
            raise HTTPException(status_code=400, detail="Confidence level must be 0.90, 0.95, or 0.99")
        
        # Train model if not already trained
        if not forecast_service.is_trained:
            df = await data_service.get_data_for_forecasting()
            if df.empty:
                raise HTTPException(status_code=400, detail="No data available for forecasting")
            forecast_service.train_model(df)
        
        # Make predictions
        forecast = forecast_service.predict_future_sales(
            periods=days,
            confidence_level=confidence
        )
        
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/model/status")
async def get_model_status():
    """Get forecasting model status"""
    try:
        if not forecast_service.is_trained:
            return {
                "trained": False,
                "message": "Model not trained yet"
            }
        
        # Get feature importance
        feature_importance = forecast_service.get_feature_importance()
        
        return {
            "trained": True,
            "last_training_date": forecast_service.last_date.isoformat() if hasattr(forecast_service, 'last_date') else None,
            "feature_importance": feature_importance,
            "message": "Model is trained and ready for predictions"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/seasonality")
async def get_seasonality_analysis():
    """Get seasonality analysis"""
    try:
        import sqlite3
        import pandas as pd
        
        conn = sqlite3.connect(data_service.db_path)
        
        # Monthly seasonality
        monthly_query = """
        SELECT 
            strftime('%m', order_date) as month,
            AVG(sales) as avg_sales,
            COUNT(*) as order_count
        FROM sales 
        GROUP BY strftime('%m', order_date)
        ORDER BY month
        """
        
        monthly_df = pd.read_sql_query(monthly_query, conn)
        
        # Weekly seasonality
        weekly_query = """
        SELECT 
            strftime('%w', order_date) as day_of_week,
            AVG(sales) as avg_sales,
            COUNT(*) as order_count
        FROM sales 
        GROUP BY strftime('%w', order_date)
        ORDER BY day_of_week
        """
        
        weekly_df = pd.read_sql_query(weekly_query, conn)
        conn.close()
        
        # Convert day of week numbers to names
        day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        weekly_df['day_name'] = weekly_df['day_of_week'].apply(lambda x: day_names[int(x)])
        
        # Convert month numbers to names
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        monthly_df['month_name'] = monthly_df['month'].apply(lambda x: month_names[int(x) - 1])
        
        return {
            "monthly_seasonality": [
                {
                    "month": row['month_name'],
                    "avg_sales": round(row['avg_sales'], 2),
                    "order_count": row['order_count']
                }
                for _, row in monthly_df.iterrows()
            ],
            "weekly_seasonality": [
                {
                    "day": row['day_name'],
                    "avg_sales": round(row['avg_sales'], 2),
                    "order_count": row['order_count']
                }
                for _, row in weekly_df.iterrows()
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))