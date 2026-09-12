"""
main.py

Main FastAPI application for SAKSHAM platform.
"""

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()  # load backend/.env before anything else

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import text

from backend.app.db.session import engine, get_db
from backend.app.db import models
from backend.app.routers import location, schemes, insights, assess, auth, ai


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema is created on startup
    models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="SAKSHAM API - Hyper-Local Rural Micro-Enterprise Intelligence Engine",
    description="Backend service for SAKSHAM (SIH Problem Statement #91).",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the Next.js dev server and production origin.
# Extend ALLOWED_ORIGINS in .env for additional environments.

_raw_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,https://frontend-beta-lyart-41.vercel.app",
)
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
for default_origin in [
    "https://frontend-beta-lyart-41.vercel.app",
    "https://saksham-sih2026.vercel.app",
]:
    if default_origin not in _allowed_origins:
        _allowed_origins.append(default_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mount Routers
app.include_router(location.router)
app.include_router(schemes.router)
app.include_router(insights.router)
app.include_router(assess.router)
app.include_router(assess.legacy_router)
app.include_router(auth.router)
app.include_router(auth.legacy_router)
app.include_router(ai.router)


@app.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """System health check verifying database connectivity."""
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"degraded: {str(e)}"

    return {
        "status": "healthy",
        "service": "saksham-backend",
        "version": "1.0.0",
        "database": db_status,
    }


@app.get("/api/v1/categories", tags=["Categories"])
def get_categories(db: Session = Depends(get_db)):
    """Retrieve available business categories."""
    cats = db.query(models.BusinessCategory).all()
    return [
        {
            "id": c.id,
            "name": c.name,
            "icon": c.icon,
            "is_seasonal": c.is_seasonal,
        }
        for c in cats
    ]


@app.get("/", response_class=HTMLResponse, tags=["Developer UI"])
def developer_ui():
    """Interactive visual testing UI to verify backend operations."""
    html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SAKSHAM Backend Console</title>
    <style>
        :root {
            --primary: #1e3a8a;
            --primary-light: #2563eb;
            --bg: #f8fafc;
            --card-bg: #ffffff;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --border: #e2e8f0;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text-main); line-height: 1.5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        header { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; padding: 22px 26px; border-radius: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        header h1 { font-size: 22px; font-weight: 800; }
        header p { color: #bfdbfe; font-size: 13px; margin-top: 3px; }
        .links a { color: white; background: rgba(255,255,255,0.2); text-decoration: none; padding: 6px 12px; border-radius: 5px; font-size: 12px; font-weight: 600; margin-left: 8px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 900px) { .grid-2 { grid-template-columns: 1fr; } }
        .card { background: white; border: 1px solid var(--border); border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .card h2 { font-size: 16px; color: var(--primary); margin-bottom: 14px; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 8px; }
        label { display: block; font-size: 12px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase; }
        input, select { width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: 6px; font-size: 13.5px; margin-bottom: 12px; }
        button { background: var(--primary-light); color: white; border: none; padding: 10px 18px; border-radius: 6px; font-size: 13.5px; font-weight: 700; cursor: pointer; width: 100%; }
        button:hover { background: var(--primary); }
        .score-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 14px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center; }
        .score-num { font-size: 32px; font-weight: 900; color: #16a34a; }
        .metric-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 14px; }
        .metric-item { background: #f8fafc; border: 1px solid var(--border); padding: 10px; border-radius: 6px; }
        .metric-item span { font-size: 11px; color: var(--text-muted); display: block; }
        .metric-item strong { font-size: 15px; color: var(--primary); }
        pre { background: #0f172a; color: #38bdf8; padding: 12px; border-radius: 6px; font-size: 11.5px; max-height: 380px; overflow: auto; white-space: pre-wrap; word-break: break-all; }
        .pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 700; background: #dcfce7; color: #15803d; }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div>
                <h1>🌾 SAKSHAM Backend Developer Console</h1>
                <p>AI-Driven Hyper-Local Business Advisory & Concessional Credit Assistant • SIH #91</p>
            </div>
            <div class="links">
                <a href="/docs" target="_blank">📖 Swagger UI</a>
                <a href="/redoc" target="_blank">📚 ReDoc</a>
                <a href="/health" target="_blank">🩺 Health</a>
            </div>
        </header>

        <div class="grid-2">
            <!-- Assessment Form -->
            <div class="card">
                <h2>🎯 Run Business Feasibility & Financial Structuring</h2>
                <form id="assessForm">
                    <label>Select Target Village (Mathura Pilot):</label>
                    <select id="selVillage">
                        <option value="Kamar">Kamar (Pop: 7,031 • Tehsil: Chhata)</option>
                        <option value="Hulwana">Hulwana (Pop: 3,457 • Tehsil: Chhata)</option>
                        <option value="Kadauna">Kadauna (Pop: 2,887 • Tehsil: Chhata)</option>
                        <option value="Sirthala">Sirthala (Pop: 2,445 • Tehsil: Chhata)</option>
                        <option value="Garhi Barwari">Garhi Barwari (Pop: 1,164 • Tehsil: Chhata)</option>
                    </select>

                    <label>Select Business Category:</label>
                    <select id="selCategory">
                        <option value="Dairy">Dairy (Milk Collection & Chilling)</option>
                        <option value="Retail">Retail (Kirana / General Store)</option>
                        <option value="Textiles">Textiles & Tailoring</option>
                        <option value="Food Processing">Food Processing (Spices / Pulveriser)</option>
                        <option value="Agriculture">Agriculture Inputs</option>
                        <option value="Logistics">Rural Logistics</option>
                    </select>

                    <label>Available Margin Capital (INR):</label>
                    <input type="number" id="inpCapital" value="100000" step="5000">

                    <label>Proposed Idea (Optional):</label>
                    <input type="text" id="inpIdea" value="Dairy milk collection center with bulk cooler">

                    <button type="submit" id="btnSubmit">⚡ Execute Assessment Engine</button>
                </form>

                <div style="margin-top: 16px;">
                    <label>Raw API JSON Response:</label>
                    <pre id="jsonOutput">// Click execute to inspect full JSON payload...</pre>
                </div>
            </div>

            <!-- Output Dashboard -->
            <div class="card">
                <h2>📊 Live Assessment Analysis</h2>
                <div id="resultsView" style="display:none;">
                    <div class="score-box">
                        <div>
                            <div class="pill" id="dispRating">Feasible</div>
                            <div style="font-size: 13px; color: #166534; font-weight:700; margin-top:4px;" id="dispSchemeName">--</div>
                        </div>
                        <div style="text-align:right;">
                            <span style="font-size:11px; color:#166534; font-weight:700;">FIT SCORE</span>
                            <div class="score-num" id="dispFitScore">--</div>
                        </div>
                    </div>

                    <div class="metric-grid">
                        <div class="metric-item">
                            <span>Project Cost (M ÷ 10%)</span>
                            <strong id="dispCost">--</strong>
                        </div>
                        <div class="metric-item">
                            <span>Max Loan (90%)</span>
                            <strong id="dispLoan">--</strong>
                        </div>
                        <div class="metric-item">
                            <span>Monthly EMI</span>
                            <strong id="dispEmi" style="color:#16a34a;">--</strong>
                        </div>
                    </div>

                    <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:10px; margin-bottom:12px; font-size:12.5px;">
                        <strong>Recommendation:</strong>
                        <div id="dispRec" style="margin-top:2px; color:#1e3a8a;">--</div>
                    </div>

                    <div style="font-size:12px; color:var(--text-muted); margin-bottom:6px; font-weight:700;">4-FACTOR BREAKDOWN:</div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; font-size:12px; margin-bottom:12px;">
                        <div style="background:#f8fafc; padding:8px; border:1px solid var(--border); border-radius:4px;">
                            Market Opp (30%): <strong id="dispMarket">--</strong>
                        </div>
                        <div style="background:#f8fafc; padding:8px; border:1px solid var(--border); border-radius:4px;">
                            Competition (25%): <strong id="dispComp">--</strong>
                        </div>
                        <div style="background:#f8fafc; padding:8px; border:1px solid var(--border); border-radius:4px;">
                            Capital Fit (25%): <strong id="dispCap">--</strong>
                        </div>
                        <div style="background:#f8fafc; padding:8px; border:1px solid var(--border); border-radius:4px;">
                            Infrastructure (20%): <strong id="dispInfra">--</strong>
                        </div>
                    </div>
                </div>
                <div id="waitingView" style="color:var(--text-muted); font-size:13px; text-align:center; padding:40px 0;">
                    Fill inputs and run engine to inspect live evaluation.
                </div>
            </div>
        </div>
    </div>

    <script>
        document.getElementById('assessForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSubmit');
            btn.disabled = true;
            btn.textContent = 'Calculating...';

            const payload = {
                location: document.getElementById('selVillage').value,
                category: document.getElementById('selCategory').value,
                capital: parseFloat(document.getElementById('inpCapital').value),
                idea: document.getElementById('inpIdea').value
            };

            try {
                const res = await fetch('/api/v1/assess', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                document.getElementById('jsonOutput').textContent = JSON.stringify(data, null, 2);

                if (res.ok) {
                    document.getElementById('waitingView').style.display = 'none';
                    document.getElementById('resultsView').style.display = 'block';

                    document.getElementById('dispFitScore').textContent = data.fitScore + '/100';
                    document.getElementById('dispRating').textContent = data.rating;
                    document.getElementById('dispSchemeName').textContent = data.scheme.name;
                    document.getElementById('dispCost').textContent = '₹' + data.financial.project_cost.toLocaleString('en-IN');
                    document.getElementById('dispLoan').textContent = '₹' + data.financial.max_loan_amount.toLocaleString('en-IN');
                    document.getElementById('dispEmi').textContent = '₹' + data.financial.monthly_emi.toLocaleString('en-IN') + '/mo';
                    document.getElementById('dispRec').textContent = data.recommendation;

                    document.getElementById('dispMarket').textContent = data.feasibility.breakdown.market_opportunity + '/100';
                    document.getElementById('dispComp').textContent = data.feasibility.breakdown.competition + '/100';
                    document.getElementById('dispCap').textContent = data.feasibility.breakdown.capital_fit + '/100';
                    document.getElementById('dispInfra').textContent = data.feasibility.breakdown.infrastructure + '/100';
                }
            } catch (err) {
                document.getElementById('jsonOutput').textContent = 'Error: ' + err.message;
            } finally {
                btn.disabled = false;
                btn.textContent = '⚡ Execute Assessment Engine';
            }
        });
    </script>
</body>
</html>
"""
    return HTMLResponse(content=html_content)
