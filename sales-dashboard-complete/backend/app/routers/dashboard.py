from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..services.data_service import DataService
from ..models.schemas import KPIResponse, DashboardData, ChartData

router = APIRouter()
data_service = DataService()

@router.get("/kpis", response_model=KPIResponse)
async def get_kpis(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    regions: Optional[List[str]] = Query(None, description="Filter by regions"),
    categories: Optional[List[str]] = Query(None, description="Filter by categories"),
    segments: Optional[List[str]] = Query(None, description="Filter by segments")
):
    """Get key performance indicators"""
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
        
        result = await data_service.get_kpis(filters)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/overview")
async def get_dashboard_overview(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    regions: Optional[List[str]] = Query(None, description="Filter by regions"),
    categories: Optional[List[str]] = Query(None, description="Filter by categories")
):
    """Get complete dashboard overview"""
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
        
        # Get KPIs
        kpis = await data_service.get_kpis(filters)
        
        # Get sales trend
        sales_trend = await data_service.get_sales_trend(filters, 'month')
        
        # Get top products
        top_products = await data_service.get_top_products(filters, 5)
        
        # Get category breakdown
        import sqlite3
        import pandas as pd
        
        query = "SELECT category, SUM(sales) as total_sales FROM sales WHERE 1=1"
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
        
        category_data = []
        for _, row in df.iterrows():
            category_data.append({
                "category": row['category'],
                "total_sales": round(row['total_sales'], 2)
            })
        
        # Get regional performance
        region_query = """
        SELECT 
            region,
            SUM(sales) as total_sales
        FROM sales WHERE 1=1
        """
        region_params = []
        
        if start_date:
            region_query += " AND order_date >= ?"
            region_params.append(start_date)
        if end_date:
            region_query += " AND order_date <= ?"
            region_params.append(end_date)
        if categories:
            placeholders = ','.join(['?'] * len(categories))
            region_query += f" AND category IN ({placeholders})"
            region_params.extend(categories)
        
        region_query += " GROUP BY region ORDER BY total_sales DESC"
        
        conn = sqlite3.connect(data_service.db_path)
        region_df = pd.read_sql_query(region_query, conn, params=region_params)
        conn.close()
        
        regional_data = []
        for _, row in region_df.iterrows():
            regional_data.append({
                "region": row['region'],
                "total_sales": round(row['total_sales'], 2)
            })
        
        return {
            "kpis": kpis,
            "sales_trend": [{"period": item.period, "sales": item.sales, "profit": item.profit} for item in sales_trend],
            "category_breakdown": category_data,
            "regional_performance": regional_data,
            "top_products": top_products
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/filters/options")
async def get_filter_options():
    """Get available filter options"""
    try:
        import sqlite3
        import pandas as pd
        
        conn = sqlite3.connect(data_service.db_path)
        
        # Get unique regions
        regions = pd.read_sql_query("SELECT DISTINCT region FROM sales ORDER BY region", conn)['region'].tolist()
        
        # Get unique categories
        categories = pd.read_sql_query("SELECT DISTINCT category FROM sales ORDER BY category", conn)['category'].tolist()
        
        # Get unique segments
        segments = pd.read_sql_query("SELECT DISTINCT segment FROM sales ORDER BY segment", conn)['segment'].tolist()
        
        # Get unique ship modes
        ship_modes = pd.read_sql_query("SELECT DISTINCT ship_mode FROM sales ORDER BY ship_mode", conn)['ship_mode'].tolist()
        
        # Get date range
        date_range = pd.read_sql_query("SELECT MIN(order_date) as min_date, MAX(order_date) as max_date FROM sales", conn)
        
        conn.close()
        
        return {
            "regions": regions,
            "categories": categories,
            "segments": segments,
            "ship_modes": ship_modes,
            "date_range": {
                "min_date": date_range.iloc[0]['min_date'],
                "max_date": date_range.iloc[0]['max_date']
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profit-analysis")
async def get_profit_analysis(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
):
    """Get profit analysis data"""
    try:
        import sqlite3
        import pandas as pd
        
        query = """
        SELECT 
            category,
            sub_category,
            SUM(sales) as total_sales,
            SUM(profit) as total_profit,
            SUM(discount * sales) as total_discount
        FROM sales WHERE 1=1
        """
        params = []
        
        if start_date:
            query += " AND order_date >= ?"
            params.append(start_date)
        if end_date:
            query += " AND order_date <= ?"
            params.append(end_date)
        
        query += " GROUP BY category, sub_category ORDER BY total_profit DESC"
        
        conn = sqlite3.connect(data_service.db_path)
        df = pd.read_sql_query(query, conn, params=params)
        conn.close()
        
        result = []
        for _, row in df.iterrows():
            profit_margin = (row['total_profit'] / row['total_sales'] * 100) if row['total_sales'] > 0 else 0
            result.append({
                "category": row['category'],
                "sub_category": row['sub_category'],
                "total_sales": round(row['total_sales'], 2),
                "total_profit": round(row['total_profit'], 2),
                "profit_margin": round(profit_margin, 2),
                "total_discount": round(row['total_discount'], 2)
            })
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))