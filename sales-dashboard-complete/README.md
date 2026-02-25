# Sales Dashboard Analyzer

A comprehensive full-stack analytics platform that transforms raw sales data into actionable business insights with AI/ML-powered predictions.

## Features

### Dashboard Capabilities
- Interactive KPI displays and performance metrics
- Multi-dimensional analysis (regions, products, time periods)
- Real-time data filtering with date ranges
- Dynamic visualizations (charts, treemaps, maps)

### Analytics & Insights
- Sales trend analysis (monthly, quarterly, yearly)
- Product performance and profitability analysis
- Customer segmentation and behavior analysis
- Regional performance comparison
- Predictive sales forecasting with confidence intervals

### AI/ML Integration
- Simple regression-based forecasting models
- Seasonality detection and trend analysis
- Statistical accuracy measurements
- Feature importance analysis

## Technology Stack

### Backend
- **Framework**: Python FastAPI for high-performance APIs
- **Database**: SQLite with optimized queries
- **ML**: Scikit-learn for predictive modeling
- **Data Processing**: Pandas, NumPy for data manipulation

### Frontend
- **Framework**: React with modern hooks
- **Styling**: Tailwind CSS for responsive design
- **Visualizations**: Recharts for interactive charts
- **State Management**: React hooks and context

### DevOps
- **Containerization**: Docker multi-container architecture
- **Development**: Hot-reload for both frontend and backend
- **Configuration**: Environment-based settings

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.12+ (for local development)

### Using Docker (Recommended)

1. **Clone and navigate to the project:**
   ```bash
   cd sales-dashboard-complete
   ```

2. **Build and run the application:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Local Development

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## API Endpoints

### Dashboard
- `GET /api/dashboard/kpis` - Key performance indicators
- `GET /api/dashboard/overview` - Complete dashboard data
- `GET /api/dashboard/filters/options` - Available filter options

### Sales Analytics
- `GET /api/sales/trend` - Sales trend over time
- `GET /api/sales/products/top` - Top performing products
- `GET /api/sales/categories/breakdown` - Sales by category
- `GET /api/sales/regions/performance` - Regional performance
- `GET /api/sales/customers/top` - Top customers

### Forecasting
- `POST /api/forecasting/train` - Train the forecasting model
- `POST /api/forecasting/predict` - Generate sales predictions
- `GET /api/forecasting/seasonality` - Seasonality analysis
- `GET /api/forecasting/model/status` - Model training status

## Data Model

The application uses the Superstore Sales Dataset with the following key fields:

- **Order Information**: Order ID, Date, Ship Date, Ship Mode
- **Customer Details**: Customer ID, Name, Segment, Location
- **Product Information**: Product ID, Name, Category, Sub-Category
- **Financial Metrics**: Sales, Quantity, Discount, Profit

## Key Performance Indicators

### Sales Summary
- Total Revenue
- Total Profit
- Profit Margin (%)
- Average Order Value
- Total Orders
- Total Customers

### Analytics Features
- **Temporal Analysis**: Monthly/Quarterly/Yearly trends
- **Product Performance**: Top products, category breakdown
- **Customer Analysis**: Segmentation, RFM analysis
- **Regional Insights**: Geographic performance
- **Forecasting**: 30/60/90-day predictions

## Architecture

```
sales-dashboard-complete/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI application
│   │   ├── models/           # Pydantic schemas
│   │   ├── routers/          # API endpoints
│   │   ├── services/         # Business logic
│   │   └── utils/            # Utilities
│   ├── data/                 # Database and datasets
│   ├── logs/                 # Application logs
│   └── requirements.txt      # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API clients
│   │   └── utils/            # Utilities
│   ├── public/               # Static assets
│   └── package.json          # Node dependencies
└── docker-compose.yml        # Container orchestration
```

## Development

### Adding New Features

1. **Backend**: Add new endpoints in `routers/`, implement logic in `services/`
2. **Frontend**: Create components in `components/`, add pages in `pages/`
3. **Database**: Modify queries in `services/data_service.py`

### Environment Variables

#### Backend
- `CORS_ORIGINS_STR`: Allowed CORS origins

#### Frontend
- `REACT_APP_API_URL`: Backend API URL

## Business Value

- **Data-Driven Decisions**: Transform raw data into actionable insights
- **Predictive Planning**: Anticipate future sales trends
- **Performance Monitoring**: Track KPIs across multiple dimensions
- **Accessibility**: User-friendly interface for all stakeholders
- **Scalability**: Architecture supports growing data volumes

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the application logs in the `logs/` directory