# Sales Force Analysis — Sales Dashboard Analyzer

A full-stack, AI-powered sales analytics platform that transforms raw retail sales data (Superstore dataset) into rich, interactive business intelligence. It ships a Python FastAPI backend with a SQLite data store, a scikit-learn regression forecasting engine, and a React + Tailwind CSS frontend — all orchestrated with Docker Compose. The dashboard gives business users six dedicated views: a summary dashboard, sales trend analysis, product performance, customer segmentation, regional breakdown, and ML-powered sales forecasting with confidence intervals. Everything runs locally with a single `docker-compose up --build` command, and every chart responds in real time to the shared filter panel.

---

## Languages & Tech Stack

| Layer | Technology |
|---|---|
| **Backend language** | Python 3.12 |
| **API framework** | FastAPI 0.104 + Uvicorn |
| **Data processing** | Pandas 2.1, NumPy 1.26 |
| **Machine learning** | scikit-learn 1.3 (Linear Regression, StandardScaler) |
| **Database** | SQLite (via Python `sqlite3`) |
| **Schema validation** | Pydantic v2 |
| **Frontend language** | JavaScript (React 18) |
| **Styling** | Tailwind CSS 3.3 |
| **Charts** | Recharts 2.10 |
| **HTTP client** | Axios 1.6 |
| **Routing** | React Router DOM 6.20 |
| **Icons** | Lucide React |
| **Containerization** | Docker + Docker Compose |

---

## Detailed Description

### Project Purpose

Sales Force Analysis is a self-contained business intelligence tool designed for sales teams and analysts who need to move from raw CSV exports to interactive insights without standing up a data warehouse. The entire application — backend API, SQLite database, and React frontend — runs in two Docker containers on a developer's laptop. It targets the classic Superstore Sales Dataset but is built to accept any CSV that follows the same schema (Order ID, Order Date, Ship Date, Ship Mode, Customer ID/Name, Segment, Region, Category, Sub-Category, Product Name, Sales, Quantity, Discount, Profit).

---

### Complete Data & Application Flow

#### 1. Startup & Data Ingestion

When the backend container starts, FastAPI's `lifespan` hook fires `DataService.initialize_database()`. This method checks whether `data/sales_database.db` already exists and has at least one row. If it does, startup is instant (the heavy load is skipped). If it doesn't, the service reads `data/superstore.csv` into a Pandas DataFrame, runs `_clean_data()` (normalises column names to snake_case, parses dates with mixed-format tolerance, fills missing postal codes, coerces numeric columns, drops duplicates), then persists the result into a SQLite `sales` table via `df.to_sql()`. If the CSV itself is missing, a synthetic 5,000-record dataset spanning 2020–2023 is procedurally generated with realistic categories, regions, ship modes, and financial metrics.

All application events (startup, DB init, query errors, model training) are written to a daily rotating log file at `backend/logs/app_YYYYMMDD.log` and also streamed to stdout.

#### 2. API Layer

The backend exposes three FastAPI routers, all prefixed under `/api/`:

**`/api/dashboard/`**
- `GET /kpis` — Returns six headline KPIs (total revenue, total profit, profit margin %, average order value, total orders, total customers) computed on the filtered dataset.
- `GET /overview` — Aggregates KPIs, monthly sales trend, category breakdown, regional breakdown, and top-5 products in a single response — used by the main dashboard to minimise round-trips.
- `GET /filters/options` — Returns the distinct values available for regions, categories, segments, ship modes, and the overall date range; powers the FilterPanel dropdowns.
- `GET /profit-analysis` — Returns profit and discount figures broken down by category and sub-category.

**`/api/sales/`**
- `GET /trend` — Sales, profit, and order count grouped by month / quarter / year.
- `GET /products/top` — Top N products ranked by total sales, with profit margin and quantity sold.
- `GET /categories/breakdown` — Aggregate sales and profit by product category.
- `GET /regions/performance` — Sales, profit, order count, and customer count per region.
- `GET /customers/top` — Top N customers ranked by total sales, with segment, order count, and average order value.

**`/api/forecasting/`**
- `POST /train` — Pulls daily aggregated sales from SQLite, engineers 10 features (days since start, day-of-week, month, quarter, year, 1/7/30-day lags, 7/30-day rolling means), splits 80/20, fits a `LinearRegression` with `StandardScaler`, and returns MAE, RMSE, and a normalised accuracy score.
- `POST /predict` — Accepts `periods` (days) and `confidence_level` (0.90/0.95/0.99), generates future feature vectors, runs inference, and returns predicted sales with upper/lower confidence bands.
- `GET /predict/{days}` — Simplified GET version of the same endpoint; confidence level passed as a query parameter.
- `GET /model/status` — Returns whether the model is trained, the last training date, and per-feature coefficient importances.
- `GET /seasonality` — Returns average daily sales grouped by month name and day-of-week name for seasonal pattern display.

Every endpoint accepts the same optional filter parameters (`start_date`, `end_date`, `regions`, `categories`, `segments`) which are injected into parameterised SQL `WHERE` clauses to prevent SQL injection.

#### 3. Frontend Architecture

The React application mounts a persistent `MainLayout` (sidebar navigation + top navbar) and renders one of six page components depending on the current route:

**Dashboard (`/`)** — The entry point. `FilterPanel` fires a request to `GET /filters/options` on mount and renders collapsible checkboxes for region, category, and segment with date-range pickers. Once filters are confirmed, the page fires three parallel requests (`Promise.all`) for KPIs, overview, and monthly trend. Results populate six `StatCard` tiles (Revenue, Profit, Profit Margin, Avg Order Value, Total Orders, Total Customers), a `SalesChart` (Recharts `LineChart`), a `CategoryBreakdown` (Recharts `PieChart`/`BarChart`), a `RegionalChart` (Recharts `BarChart`), and a ranked top-5 products list.

**Sales Analysis (`/sales-analysis`)** — Adds a period selector (Monthly / Quarterly / Yearly) that re-queries `GET /api/sales/trend` on change. Displays four KPI cards and a trend chart, plus a summary data table showing period, sales, profit, orders, and derived average order value.

**Product Analysis (`/product-analysis`)** — Fires parallel requests for top-20 products, category breakdown, and profit analysis. Displays summary cards (total products, sales, profit, avg margin), a category pie chart, a profitability list ranked by sub-category margin, and a full sortable products table with columns for category, sales, profit, margin %, and quantity.

**Customer Analysis (`/customer-analysis`)** — Loads top-50 customers and KPIs. Derives segment breakdown and order-frequency distribution client-side from the customer list. Renders a `PieChart` for segment distribution (Consumer / Corporate / Home Office), a `BarChart` for order-frequency buckets (1 / 2–3 / 4–5 / 6–10 / 10+ orders), and a ranked table with segment badges colour-coded by type.

**Regional Analysis (`/regional-analysis`)** — Loads regional performance and KPIs. Displays four summary cards, a "best performing region" highlight card, a `RegionalChart` bar chart, a detailed table (sales, profit, orders, customers, avg order value, sales per customer), a horizontal market-share progress bar for each region, and a 2×2 performance highlights grid (highest sales, most profitable, most orders, most customers).

**Forecasting (`/forecasting`)** — On load fetches model status and seasonality. Shows a model status indicator (green/yellow dot). If the model is untrained, a "Train Model" button triggers `POST /api/forecasting/train`. Once trained, exposes a forecast generator with configurable days (1–365) and confidence level (90%/95%/99%), which calls `GET /api/forecasting/predict/{days}`. Results are shown as four summary cards (forecast period, predicted total, avg daily, model accuracy) and an `AreaChart` with shaded confidence bands. Below this, two `LineChart` panels show monthly and weekly seasonality patterns.

#### 4. Filtering System

`FilterPanel` is a shared component used on all five analytics pages. It fetches available options once from `/api/dashboard/filters/options`, then maintains local state (start date, end date, multi-select regions, categories, segments). Each change immediately calls the parent page's `onFiltersChange` callback, which re-triggers all data fetches. Active filter count is shown as a badge; a "Clear" button resets everything. All filter values are serialised as URL query parameters using `URLSearchParams` inside `api.js`.

---

### Key Design Decisions

- **SQLite over Postgres/MySQL**: Zero external dependencies — the DB file lives in the Docker volume and survives restarts. The trade-off is single-writer concurrency, acceptable for a dashboard workload.
- **Pandas in the API path**: All aggregations (trend grouping, top-N ranking, KPI sums) are done with Pandas after loading from SQLite rather than in pure SQL. This made feature development faster but limits scalability to datasets that fit in memory.
- **Linear Regression forecasting**: Deliberately simple — interpretable coefficients, no stochastic training, instant predictions. Feature importance is derived from absolute normalised coefficients.
- **No global state manager**: The frontend uses React `useState` + `useEffect` per page. The `FilterPanel` is stateful itself and communicates upward via callback props. This keeps each page self-contained at the cost of some repeated logic.
- **Hot reload in Docker**: Both containers mount their source directories as volumes (`./backend:/app`, `./frontend:/app`) and run with `--reload` / `react-scripts start`, so code changes apply without rebuilding the image.

---

### API Reference Summary

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/dashboard/kpis` | Revenue, profit, margin, orders, customers |
| GET | `/api/dashboard/overview` | All dashboard data in one call |
| GET | `/api/dashboard/filters/options` | Available filter values |
| GET | `/api/dashboard/profit-analysis` | Profit/discount by sub-category |
| GET | `/api/sales/trend` | Sales trend (month/quarter/year) |
| GET | `/api/sales/products/top` | Top N products by sales |
| GET | `/api/sales/categories/breakdown` | Sales/profit by category |
| GET | `/api/sales/regions/performance` | Sales/profit/orders/customers by region |
| GET | `/api/sales/customers/top` | Top N customers by sales |
| POST | `/api/forecasting/train` | Train the ML model |
| POST | `/api/forecasting/predict` | Generate forecast (JSON body) |
| GET | `/api/forecasting/predict/{days}` | Generate forecast (path + query params) |
| GET | `/api/forecasting/model/status` | Model status + feature importance |
| GET | `/api/forecasting/seasonality` | Monthly and weekly seasonality |
| GET | `/health` | Backend health check |
| GET | `/docs` | Interactive Swagger UI |

---

### Getting Started

**Prerequisites:** Docker + Docker Compose, or Node.js 18+ and Python 3.12+ for local development.

```bash
# Clone and start with Docker (recommended)
cd sales-dashboard-complete
docker-compose up --build

# Frontend → http://localhost:3000
# Backend API → http://localhost:8000
# Swagger docs → http://localhost:8000/docs
```

**Local development (without Docker):**

```bash
# Backend
cd sales-dashboard-complete/backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend (new terminal)
cd sales-dashboard-complete/frontend
npm install
npm start
```

**Environment variables:**

| Variable | Service | Purpose |
|---|---|---|
| `REACT_APP_API_URL` | Frontend | Backend base URL (default: `http://localhost:8000`) |
| `CORS_ORIGINS_STR` | Backend | Comma-separated allowed origins |

---

### Future Expansion Roadmap

#### Near-Term Enhancements

**1. Advanced ML Forecasting**
Replace the current linear regression with more powerful time-series models: Facebook Prophet for automatic seasonality decomposition, ARIMA/SARIMA for statistical rigor, or XGBoost with proper walk-forward validation. Add model persistence (pickle/joblib) so trained models survive server restarts without retraining. Implement hyperparameter tuning with cross-validation and display validation metrics (MAPE, WAPE) alongside the existing accuracy score.

**2. RFM Customer Segmentation**
Implement full Recency-Frequency-Monetary analysis to automatically classify customers into segments (Champions, Loyal, At-Risk, Lost). Add a dedicated RFM scatter plot and cohort retention heatmap to the Customer Analysis page.

**3. Real-Time Data Pipeline**
Replace the static CSV ingestion with a live data feed via a message queue (Kafka or RabbitMQ). This would allow the dashboard to update as new orders arrive, enabling real-time KPI tiles with WebSocket push updates to the frontend rather than polling.

**4. Export & Reporting**
Add PDF/Excel report generation from any page. Users should be able to schedule automated weekly/monthly email reports summarising KPIs with the current filter selection applied.

**5. Drill-Down Navigation**
Make chart elements clickable — clicking a region on the regional chart should navigate to a pre-filtered product or customer view scoped to that region. This requires passing filter state through React Router `state` or URL parameters.

#### Medium-Term Expansions

**6. Multi-Tenant & Authentication**
Add JWT-based authentication with role-based access control (admin, analyst, viewer). Each tenant/team would see only their own dataset. PostgreSQL would replace SQLite to support concurrent writes and row-level security.

**7. Anomaly Detection**
Use Isolation Forest or Z-score detection to automatically flag unusual sales spikes, unexpected profit drops, or outlier orders. Surface anomalies as highlighted data points on the trend charts and a dedicated alerts panel.

**8. Inventory & Supply Chain Module**
Extend the data model to include inventory levels and reorder points. Add a new page tracking stock-out risk by product, correlating low inventory with high-demand forecasts to recommend reorder quantities.

**9. Geographic Map Visualisation**
Integrate a mapping library (Leaflet.js or react-simple-maps) to plot sales density on a real US map rather than the current bar chart, with state-level granularity and clickable drill-down to city-level data.

**10. A/B Testing Framework for Discounts**
Track the impact of discount rates on profit margin over time. Add a statistical significance calculator to determine whether a given discount level meaningfully changes conversion or average order value.

#### Long-Term Architecture Evolution

**11. Microservices Decomposition**
Split the monolithic FastAPI app into separate services: a Data Ingestion Service, an Analytics Query Service, and an ML Inference Service. Each would scale independently, with the inference service potentially running on GPU infrastructure for heavier models.

**12. Data Lake Integration**
Replace SQLite with a columnar store (DuckDB for embedded or Apache Iceberg for distributed) to handle datasets with tens of millions of rows efficiently. Push aggregation workloads into the database engine rather than Pandas.

**13. LLM-Powered Natural Language Querying**
Add a chat interface where analysts can ask questions in plain English ("What were the top 5 products in the West region last quarter?"). An LLM (Claude API) would translate the question into a structured API call or SQL query, execute it, and return a natural language summary alongside the chart.

**14. Mobile Application**
Build a React Native companion app that surfaces the core KPI dashboard and push notifications for anomalies and forecast alerts, giving field sales teams access to insights on mobile.

---

### Project Structure

```
new_sales_force/
└── sales-dashboard-complete/
    ├── docker-compose.yml
    ├── backend/
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   ├── data/
    │   │   ├── superstore.csv          # Source dataset
    │   │   └── sales_database.db       # Generated SQLite DB
    │   ├── logs/                       # Daily rotating log files
    │   └── app/
    │       ├── main.py                 # FastAPI app, CORS, lifespan hook
    │       ├── models/schemas.py       # Pydantic request/response models
    │       ├── routers/
    │       │   ├── dashboard.py        # KPI, overview, filter, profit endpoints
    │       │   ├── sales.py            # Trend, products, categories, regions, customers
    │       │   └── forecasting.py      # Train, predict, status, seasonality
    │       ├── services/
    │       │   ├── data_service.py     # SQLite queries, Pandas transforms, DB init
    │       │   └── forecast_service.py # Feature engineering, model train/predict
    │       └── utils/logger.py         # Daily file + console logger
    └── frontend/
        ├── Dockerfile
        ├── package.json
        ├── tailwind.config.js
        └── src/
            ├── App.js                  # Router with 6 routes, MainLayout wrapper
            ├── services/api.js         # Axios client, dashboardAPI/salesAPI/forecastingAPI
            ├── pages/
            │   ├── Dashboard.jsx
            │   ├── SalesAnalysis.jsx
            │   ├── ProductAnalysis.jsx
            │   ├── CustomerAnalysis.jsx
            │   ├── RegionalAnalysis.jsx
            │   └── Forecasting.jsx
            └── components/
                ├── layout/             # MainLayout, Navbar, Sidebar
                ├── dashboard/          # FilterPanel, StatCard
                ├── charts/             # SalesChart, CategoryBreakdown, RegionalChart
                └── common/             # Card, LoadingSpinner, ErrorDisplay
```

---

### License

MIT License — see the LICENSE file for details.
