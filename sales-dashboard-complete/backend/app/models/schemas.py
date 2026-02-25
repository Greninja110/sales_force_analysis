from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SalesRecord(BaseModel):
    row_id: int
    order_id: str
    order_date: datetime
    ship_date: datetime
    ship_mode: str
    customer_id: str
    customer_name: str
    segment: str
    country: str
    city: str
    state: str
    postal_code: Optional[str] = None
    region: str
    product_id: str
    category: str
    sub_category: str
    product_name: str
    sales: float
    quantity: int
    discount: float
    profit: float

class KPIResponse(BaseModel):
    total_revenue: float
    total_profit: float
    profit_margin: float
    avg_order_value: float
    total_orders: int
    total_customers: int

class SalesAnalytics(BaseModel):
    period: str
    sales: float
    profit: float
    orders: int

class ProductPerformance(BaseModel):
    product_name: str
    category: str
    sub_category: str
    total_sales: float
    total_profit: float
    profit_margin: float
    quantity_sold: int

class CustomerAnalytics(BaseModel):
    customer_name: str
    customer_id: str
    segment: str
    total_sales: float
    total_profit: float
    order_count: int
    avg_order_value: float

class RegionalAnalytics(BaseModel):
    region: str
    state: str
    city: str
    total_sales: float
    total_profit: float
    order_count: int
    customer_count: int

class ForecastRequest(BaseModel):
    periods: int = Field(default=90, description="Number of days to forecast")
    confidence_level: float = Field(default=0.95, description="Confidence level for prediction intervals")

class ForecastResponse(BaseModel):
    dates: List[str]
    predicted_sales: List[float]
    upper_bound: List[float]
    lower_bound: List[float]
    model_accuracy: float

class FilterRequest(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    regions: Optional[List[str]] = None
    categories: Optional[List[str]] = None
    segments: Optional[List[str]] = None
    ship_modes: Optional[List[str]] = None

class ChartData(BaseModel):
    labels: List[str]
    datasets: List[Dict[str, Any]]

class DashboardData(BaseModel):
    kpis: KPIResponse
    sales_trend: ChartData
    category_breakdown: ChartData
    regional_performance: ChartData
    top_products: List[ProductPerformance]
    top_customers: List[CustomerAnalytics]