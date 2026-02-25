from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from datetime import datetime
from ..services.data_service import DataService
from ..models.schemas import SalesAnalytics, ProductPerformance, CustomerAnalytics, FilterRequest

router = APIRouter()
data_service = DataService()

@router.get("/trend", response_model=List[SalesAnalytics])
async def get_sales_trend(
    period: str = Query(default="month", description="Period for trend analysis (month, quarter, year)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    regions: Optional[List[str]] = Query(None, description="Filter by regions"),
    categories: Optional[List[str]] = Query(None, description="Filter by categories"),
    segments: Optional[List[str]] = Query(None, description="Filter by segments")
):
    """Get sales trend over time"""
    try:
        filters = {}
        if start_date:
            filters['start_date'] = start_date
        if end_date:
            filters['end_date'] = end_date
        if regions:
            filters['regions'] = regions
        if categories:
            filters['categories'] = categories
        if segments:
            filters['segments'] = segments
        
        result = await data_service.get_sales_trend(filters, period)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products/top", response_model=List[ProductPerformance])
async def get_top_products(
    limit: int = Query(default=10, description="Number of products to return"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    regions: Optional[List[str]] = Query(None, description="Filter by regions"),
    categories: Optional[List[str]] = Query(None, description="Filter by categories")
):
    """Get top performing products"""
    try:
        filters = {}
        if start_date:
            filters['start_date'] = start_date
        if end_date:
            filters['end_date'] = end_date
        if regions:
            filters['regions'] = regions
        if categories:
            filters['categories'] = categories
        
        result = await data_service.get_top_products(filters, limit)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/categories/breakdown")
async def get_category_breakdown(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    regions: Optional[List[str]] = Query(None, description="Filter by regions")
):
    """Get sales breakdown by category"""
    try:
        import sqlite3
        import pandas as pd
        
        query = "SELECT category, SUM(sales) as total_sales, SUM(profit) as total_profit FROM sales WHERE 1=1"
        params = []
        
        if start_date:
            query += " AND order_date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND order_date <= ?"
            params.append(end_date)
        if regions:
            placeholders = ','.join(['?'] * len(regions))
            query += f" AND region IN ({placeholders})"
            params.extend(regions)
        
        query += " GROUP BY category ORDER BY total_sales DESC"
        
        conn = sqlite3.connect(data_service.db_path)
        df = pd.read_sql_query(query, conn, params=params)
        conn.close()
        
        result = []
        for _, row in df.iterrows():
            result.append({
                "category": row['category'],
                "total_sales": round(row['total_sales'], 2),
                "total_profit": round(row['total_profit'], 2)
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/regions/performance")
async def get_regional_performance(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    categories: Optional[List[str]] = Query(None, description="Filter by categories")
):
    """Get sales performance by region"""
    try:
        import sqlite3
        import pandas as pd
        
        query = """
        SELECT 
            region,
            SUM(sales) as total_sales,
            SUM(profit) as total_profit,
            COUNT(DISTINCT order_id) as order_count,
            COUNT(DISTINCT customer_id) as customer_count
        FROM sales WHERE 1=1
        """
        params = []
        
        if start_date:
            query += " AND order_date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND order_date <= ?"
            params.append(end_date)
        if categories:
            placeholders = ','.join(['?'] * len(categories))
            query += f" AND category IN ({placeholders})"
            params.extend(categories)
        
        query += " GROUP BY region ORDER BY total_sales DESC"
        
        conn = sqlite3.connect(data_service.db_path)
        df = pd.read_sql_query(query, conn, params=params)
        conn.close()
        
        result = []
        for _, row in df.iterrows():
            result.append({
                "region": row['region'],
                "total_sales": round(row['total_sales'], 2),
                "total_profit": round(row['total_profit'], 2),
                "order_count": row['order_count'],
                "customer_count": row['customer_count']
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/customers/top")
async def get_top_customers(
    limit: int = Query(default=10, description="Number of customers to return"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get top customers by sales"""
    try:
        import sqlite3
        import pandas as pd
        
        query = """
        SELECT 
            customer_name,
            customer_id,
            segment,
            SUM(sales) as total_sales,
            SUM(profit) as total_profit,
            COUNT(DISTINCT order_id) as order_count,
            AVG(sales) as avg_order_value
        FROM sales WHERE 1=1
        """
        params = []
        
        if start_date:
            query += " AND order_date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND order_date <= ?"
            params.append(end_date)
        
        query += " GROUP BY customer_id, customer_name, segment ORDER BY total_sales DESC LIMIT ?"
        params.append(limit)
        
        conn = sqlite3.connect(data_service.db_path)
        df = pd.read_sql_query(query, conn, params=params)
        conn.close()
        
        result = []
        for _, row in df.iterrows():
            result.append({
                "customer_name": row['customer_name'],
                "customer_id": row['customer_id'],
                "segment": row['segment'],
                "total_sales": round(row['total_sales'], 2),
                "total_profit": round(row['total_profit'], 2),
                "order_count": row['order_count'],
                "avg_order_value": round(row['avg_order_value'], 2)
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))