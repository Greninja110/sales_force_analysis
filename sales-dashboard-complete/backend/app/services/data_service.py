import pandas as pd
import sqlite3
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from ..models.schemas import SalesRecord, KPIResponse, SalesAnalytics, ProductPerformance, CustomerAnalytics, RegionalAnalytics
from ..utils.logger import setup_logger
import asyncio
import os

logger = setup_logger()

class DataService:
    def __init__(self):
        self.db_path = "data/sales_database.db"
        self.csv_path = "data/superstore.csv"
        
    async def initialize_database(self):
        """Initialize database and load data if not exists"""
        try:
            # Create data directory if it doesn't exist
            os.makedirs("data", exist_ok=True)
            
            # Check if database exists and has data
            if os.path.exists(self.db_path):
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                cursor.execute("SELECT COUNT(*) FROM sales WHERE 1=1")
                count = cursor.fetchone()[0]
                conn.close()
                
                if count > 0:
                    logger.info(f"Database already contains {count} records. Skipping initialization.")
                    return
            
            # Load and process data
            await self._load_sample_data()
            logger.info("Database initialized with sample data")
            
        except Exception as e:
            logger.error(f"Error initializing database: {str(e)}")
            raise
    
    async def _load_sample_data(self):
        """Load sample data if CSV doesn't exist"""
        if not os.path.exists(self.csv_path):
            logger.info("Creating sample dataset...")
            await self._create_sample_dataset()
        
        # Load data from CSV
        df = pd.read_csv(self.csv_path)
        
        # Clean and process data
        df = await self._clean_data(df)
        
        # Save to database
        await self._save_to_database(df)
    
    async def _create_sample_dataset(self):
        """Create a sample dataset that matches the Superstore schema"""
        np.random.seed(42)
        
        # Sample data parameters
        n_records = 5000
        
        # Define categories and their subcategories
        categories = {
            'Technology': ['Phones', 'Computers', 'Tablets', 'Accessories'],
            'Furniture': ['Chairs', 'Tables', 'Bookcases', 'Furnishings'],
            'Office Supplies': ['Storage', 'Art', 'Binders', 'Paper', 'Appliances']
        }
        
        # Generate sample data
        data = []
        for i in range(n_records):
            # Generate dates
            start_date = datetime(2020, 1, 1)
            end_date = datetime(2023, 12, 31)
            order_date = start_date + timedelta(days=np.random.randint(0, (end_date - start_date).days))
            ship_date = order_date + timedelta(days=np.random.randint(1, 7))
            
            # Generate customer info
            customer_id = f"CG-{np.random.randint(10000, 99999)}"
            customer_name = f"Customer {np.random.randint(1, 1000)}"
            
            # Generate location
            regions = ['East', 'West', 'Central', 'South']
            region = np.random.choice(regions)
            states = ['California', 'Texas', 'New York', 'Florida', 'Illinois']
            state = np.random.choice(states)
            cities = ['Los Angeles', 'Houston', 'New York', 'Miami', 'Chicago']
            city = np.random.choice(cities)
            
            # Generate product info
            category = np.random.choice(list(categories.keys()))
            sub_category = np.random.choice(categories[category])
            product_name = f"{sub_category} Product {np.random.randint(1, 100)}"
            
            # Generate sales metrics
            quantity = np.random.randint(1, 10)
            unit_price = np.random.uniform(10, 500)
            discount = np.random.uniform(0, 0.5)
            sales = quantity * unit_price * (1 - discount)
            profit = sales * np.random.uniform(0.1, 0.4)
            
            record = {
                'Row ID': i + 1,
                'Order ID': f"US-{order_date.strftime('%Y')}-{np.random.randint(1000000, 9999999)}",
                'Order Date': order_date.strftime('%Y-%m-%d'),
                'Ship Date': ship_date.strftime('%Y-%m-%d'),
                'Ship Mode': np.random.choice(['Standard Class', 'Second Class', 'First Class', 'Same Day']),
                'Customer ID': customer_id,
                'Customer Name': customer_name,
                'Segment': np.random.choice(['Consumer', 'Corporate', 'Home Office']),
                'Country': 'United States',
                'City': city,
                'State': state,
                'Postal Code': str(np.random.randint(10000, 99999)),
                'Region': region,
                'Product ID': f"TEC-{np.random.randint(10000, 99999)}",
                'Category': category,
                'Sub-Category': sub_category,
                'Product Name': product_name,
                'Sales': round(sales, 2),
                'Quantity': quantity,
                'Discount': round(discount, 2),
                'Profit': round(profit, 2)
            }
            data.append(record)
        
        # Create DataFrame and save to CSV
        df = pd.DataFrame(data)
        df.to_csv(self.csv_path, index=False)
        logger.info(f"Created sample dataset with {len(df)} records")
    
    async def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean and validate data"""
        # Check if columns are already lowercase with underscores
        if 'order_date' in df.columns:
            # Data is already in the correct format
            pass
        else:
            # Convert column names to lowercase with underscores
            df.columns = df.columns.str.lower().str.replace(' ', '_').str.replace('-', '_')
        
        # Convert date columns with flexible parsing
        df['order_date'] = pd.to_datetime(df['order_date'], format='mixed', dayfirst=True)
        if 'ship_date' in df.columns:
            df['ship_date'] = pd.to_datetime(df['ship_date'], format='mixed', dayfirst=True)
        
        # Handle missing values
        if 'postal_code' in df.columns:
            df['postal_code'] = df['postal_code'].fillna('00000')
        
        # Add missing columns with default values if they don't exist
        if 'quantity' not in df.columns:
            df['quantity'] = 1
        if 'discount' not in df.columns:
            df['discount'] = 0.0
        if 'profit' not in df.columns:
            # Calculate profit as 20% of sales if not provided
            df['profit'] = df['sales'] * 0.2
        
        # Validate numeric columns
        numeric_columns = ['sales', 'quantity', 'discount', 'profit']
        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Remove duplicates
        df = df.drop_duplicates()
        
        logger.info(f"Cleaned data: {len(df)} records")
        return df
    
    async def _save_to_database(self, df: pd.DataFrame):
        """Save DataFrame to SQLite database"""
        conn = sqlite3.connect(self.db_path)
        
        # Create table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS sales (
            row_id INTEGER PRIMARY KEY,
            order_id TEXT,
            order_date TEXT,
            ship_date TEXT,
            ship_mode TEXT,
            customer_id TEXT,
            customer_name TEXT,
            segment TEXT,
            country TEXT,
            city TEXT,
            state TEXT,
            postal_code TEXT,
            region TEXT,
            product_id TEXT,
            category TEXT,
            sub_category TEXT,
            product_name TEXT,
            sales REAL,
            quantity INTEGER,
            discount REAL,
            profit REAL
        )
        """
        
        conn.execute(create_table_sql)
        
        # Insert data
        df.to_sql('sales', conn, if_exists='replace', index=False)
        conn.commit()
        conn.close()
        
        logger.info(f"Saved {len(df)} records to database")
    
    async def get_kpis(self, filters: Optional[Dict] = None) -> KPIResponse:
        """Get key performance indicators"""
        query = "SELECT * FROM sales WHERE 1=1"
        params = []
        
        if filters:
            query, params = self._apply_filters(query, params, filters)
        
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query(query, conn, params=params)
        conn.close()
        
        if df.empty:
            return KPIResponse(
                total_revenue=0,
                total_profit=0,
                profit_margin=0,
                avg_order_value=0,
                total_orders=0,
                total_customers=0
            )
        
        total_revenue = df['sales'].sum()
        total_profit = df['profit'].sum()
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        avg_order_value = df.groupby('order_id')['sales'].sum().mean()
        total_orders = df['order_id'].nunique()
        total_customers = df['customer_id'].nunique()
        
        return KPIResponse(
            total_revenue=round(total_revenue, 2),
            total_profit=round(total_profit, 2),
            profit_margin=round(profit_margin, 2),
            avg_order_value=round(avg_order_value, 2),
            total_orders=total_orders,
            total_customers=total_customers
        )
    
    async def get_sales_trend(self, filters: Optional[Dict] = None, period: str = 'month') -> List[SalesAnalytics]:
        """Get sales trend over time"""
        query = "SELECT * FROM sales WHERE 1=1"
        params = []
        
        if filters:
            query, params = self._apply_filters(query, params, filters)
        
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query(query, conn, params=params)
        conn.close()
        
        if df.empty:
            return []
        
        df['order_date'] = pd.to_datetime(df['order_date'])
        
        # Group by period
        if period == 'month':
            df['period'] = df['order_date'].dt.to_period('M')
        elif period == 'quarter':
            df['period'] = df['order_date'].dt.to_period('Q')
        else:
            df['period'] = df['order_date'].dt.to_period('Y')
        
        trend_data = df.groupby('period').agg({
            'sales': 'sum',
            'profit': 'sum',
            'order_id': 'nunique'
        }).reset_index()
        
        result = []
        for _, row in trend_data.iterrows():
            result.append(SalesAnalytics(
                period=str(row['period']),
                sales=round(row['sales'], 2),
                profit=round(row['profit'], 2),
                orders=row['order_id']
            ))
        
        return result
    
    async def get_top_products(self, filters: Optional[Dict] = None, limit: int = 10) -> List[ProductPerformance]:
        """Get top performing products"""
        query = "SELECT * FROM sales WHERE 1=1"
        params = []
        
        if filters:
            query, params = self._apply_filters(query, params, filters)
        
        conn = sqlite3.connect(self.db_path)
        df = pd.read_sql_query(query, conn, params=params)
        conn.close()
        
        if df.empty:
            return []
        
        product_data = df.groupby(['product_name', 'category', 'sub_category']).agg({
            'sales': 'sum',
            'profit': 'sum',
            'quantity': 'sum'
        }).reset_index()
        
        product_data['profit_margin'] = (product_data['profit'] / product_data['sales'] * 100).fillna(0)
        product_data = product_data.sort_values('sales', ascending=False).head(limit)
        
        result = []
        for _, row in product_data.iterrows():
            result.append(ProductPerformance(
                product_name=row['product_name'],
                category=row['category'],
                sub_category=row['sub_category'],
                total_sales=round(row['sales'], 2),
                total_profit=round(row['profit'], 2),
                profit_margin=round(row['profit_margin'], 2),
                quantity_sold=row['quantity']
            ))
        
        return result
    
    def _apply_filters(self, query: str, params: List, filters: Dict) -> tuple:
        """Apply filters to SQL query"""
        if filters.get('start_date'):
            query += " AND order_date >= ?"
            params.append(filters['start_date'])
        
        if filters.get('end_date'):
            query += " AND order_date <= ?"
            params.append(filters['end_date'])
        
        if filters.get('regions'):
            placeholders = ','.join(['?'] * len(filters['regions']))
            query += f" AND region IN ({placeholders})"
            params.extend(filters['regions'])
        
        if filters.get('categories'):
            placeholders = ','.join(['?'] * len(filters['categories']))
            query += f" AND category IN ({placeholders})"
            params.extend(filters['categories'])
        
        if filters.get('segments'):
            placeholders = ','.join(['?'] * len(filters['segments']))
            query += f" AND segment IN ({placeholders})"
            params.extend(filters['segments'])
        
        return query, params
    
    async def get_data_for_forecasting(self) -> pd.DataFrame:
        """Get time series data for forecasting"""
        conn = sqlite3.connect(self.db_path)
        query = """
        SELECT 
            order_date,
            SUM(sales) as total_sales
        FROM sales 
        GROUP BY order_date 
        ORDER BY order_date
        """
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        df['order_date'] = pd.to_datetime(df['order_date'])
        return df