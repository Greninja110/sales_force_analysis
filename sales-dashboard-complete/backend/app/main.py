from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
from .routers import sales, dashboard, forecasting
from .services.data_service import DataService
from .utils.logger import setup_logger

# Setup logging
logger = setup_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting Sales Dashboard Analyzer v1.0.0")
    
    # Initialize data service and load data
    data_service = DataService()
    await data_service.initialize_database()
    
    logger.info("Database initialized successfully")
    yield
    
    # Shutdown
    logger.info("Shutting down Sales Dashboard Analyzer")

app = FastAPI(
    title="Sales Dashboard Analyzer",
    description="A comprehensive sales analytics platform with AI/ML predictions",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sales.router, prefix="/api/sales", tags=["sales"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(forecasting.router, prefix="/api/forecasting", tags=["forecasting"])

@app.get("/")
async def root():
    return {"message": "Sales Dashboard Analyzer API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "sales-dashboard-analyzer"}