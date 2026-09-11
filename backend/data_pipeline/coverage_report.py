"""
coverage_report.py

Queries the live database and prints a markdown data coverage report.
Used to make the data layer visible during demos and judge presentations.

Run from repo root:
    python -m backend.data_pipeline.coverage_report

Output goes to stdout (pipe to a file if you want to save it):
    python -m backend.data_pipeline.coverage_report > docs/data_coverage_report.md
"""

from dotenv import load_dotenv
load_dotenv()  # searches from CWD upward — run from repo root

from datetime import date
from sqlalchemy import func
from backend.app.db.session import SessionLocal
from backend.app.db.models import (
    State, District, Block, Village, Business, BusinessCategory, Scheme
)


def run(session) -> str:
    lines = []
    today = date.today().strftime("%d %B %Y")

    # ── Header ────────────────────────────────────────────────────────────────
    lines += [
        "# SAKSHAM — Data Coverage Report",
        f"_Generated: {today}_",
        "",
        "> This report summarises the real data backing the SAKSHAM platform.",
        "> All figures come directly from the live PostgreSQL database.",
        "",
    ]

    # ── Geographic coverage ───────────────────────────────────────────────────
    n_states    = session.query(State).count()
    n_districts = session.query(District).count()
    n_blocks    = session.query(Block).count()
    n_villages  = session.query(Village).count()

    lines += [
        "## Geographic Coverage",
        "",
        f"| Level      | Count |",
        f"|------------|-------|",
        f"| States     | {n_states} |",
        f"| Districts  | {n_districts} |",
        f"| Blocks     | {n_blocks} |",
        f"| Villages   | {n_villages} |",
        "",
    ]

    # ── Village data quality ───────────────────────────────────────────────────
    inhabited  = session.query(Village).filter(Village.population > 0).count()
    uninhabited = n_villages - inhabited

    high   = session.query(Village).filter(Village.data_confidence == "High").count()
    medium = session.query(Village).filter(Village.data_confidence == "Medium").count()
    low    = session.query(Village).filter(Village.data_confidence == "Low").count()
    unset  = n_villages - high - medium - low

    lines += [
        "## Village Data Quality",
        "",
        f"| Status            | Villages | % of total |",
        f"|-------------------|----------|------------|",
        f"| Inhabited (pop>0) | {inhabited} | {100*inhabited//n_villages}% |",
        f"| Uninhabited       | {uninhabited} | {100*uninhabited//n_villages}% |",
        "",
        "### Confidence Levels",
        "",
        f"| Level    | Villages | % of total | Meaning |",
        f"|----------|----------|------------|---------|",
        f"| 🟢 High   | {high} | {100*high//n_villages}% | Census data + OSM coverage |",
        f"| 🟡 Medium | {medium} | {100*medium//n_villages}% | One signal missing |",
        f"| 🔴 Low    | {low} | {100*low//n_villages}% | No population or OSM data |",
    ]
    if unset:
        lines.append(f"| ⚪ Not set | {unset} | {100*unset//n_villages}% | Run compute_confidence.py |")
    lines.append("")

    # ── Business / OSM coverage ───────────────────────────────────────────────
    n_businesses = session.query(Business).count()

    # Businesses per block
    block_biz = (
        session.query(Block.name, func.count(Business.id).label("biz_count"))
        .join(Village, Village.block_id == Block.id)
        .join(Business, Business.village_id == Village.id)
        .group_by(Block.name)
        .order_by(func.count(Business.id).desc())
        .all()
    )

    lines += [
        "## Business / Competitor Data (OpenStreetMap)",
        "",
        f"- **Total mapped businesses:** {n_businesses}",
        f"- **Source:** OpenStreetMap (collected via Overpass API)",
        f"- **Coverage note:** OSM data is denser in Mathura city / Vrindavan",
        f"  (religious tourism areas) than in rural villages — consistent with",
        f"  known rural mapping gaps. Villages in sparse blocks are flagged 🟡/🔴.",
        "",
        "### Businesses by Block",
        "",
        "| Block | Mapped Businesses |",
        "|-------|-------------------|",
    ]
    mapped_blocks = {b for b, _ in block_biz}  # b is already Block.name (str)
    for block_name, count in block_biz:
        lines.append(f"| {block_name} | {count} |")
    # Blocks with zero businesses
    all_blocks = session.query(Block).all()
    for b in all_blocks:
        if b.name not in mapped_blocks:
            lines.append(f"| {b.name} | 0 \u26a0\ufe0f sparse coverage |")
    lines.append("")

    # ── Business categories ────────────────────────────────────────────────────
    cat_counts = (
        session.query(BusinessCategory.name, func.count(Business.id).label("n"))
        .join(Business, Business.category_id == BusinessCategory.id, isouter=True)
        .group_by(BusinessCategory.name)
        .order_by(func.count(Business.id).desc())
        .all()
    )

    lines += [
        "## Business Categories",
        "",
        "| Category | Mapped Businesses |",
        "|----------|-------------------|",
    ]
    for cat_name, count in cat_counts:
        lines.append(f"| {cat_name} | {count or 0} |")
    lines.append("")

    # ── Schemes ───────────────────────────────────────────────────────────────
    schemes = session.query(Scheme).all()
    lines += [
        "## Financing Schemes in Database",
        "",
        "| Scheme | Max Project Cost | Max Loan | Interest | Tenure |",
        "|--------|-----------------|----------|----------|--------|",
    ]
    for s in schemes:
        lines.append(
            f"| {s.name} | ₹{s.max_project_cost:,.0f} | "
            f"₹{s.max_loan_amount:,.0f} | {s.interest_rate}% p.a. | "
            f"{s.tenure_months} months |"
        )
    lines.append("")

    # ── Market price data ─────────────────────────────────────────────────────
    lines += [
        "## Market Price Data",
        "",
        "- **Source:** Agmarknet via data.gov.in API",
        "- **Coverage:** Mathura district (Mathura APMC, Kosikalan APMC)",
        "- **Commodities:** Tomato, Green Chilli, Paddy (Common), Onion, Potato, Wheat",
        "- **Limitation:** Single-day snapshot (point-in-time, not historical).",
        "  All price records are marked `is_snapshot=True` in the cleaned CSV.",
        "  Re-running `clean_market_prices.py` fetches a fresh day's prices.",
        "",
    ]

    # ── Census data ───────────────────────────────────────────────────────────
    total_pop = session.query(func.sum(Village.population)).scalar() or 0
    total_hh  = session.query(func.sum(Village.household_count)).scalar() or 0
    avg_lit   = session.query(func.avg(Village.literacy_rate)).filter(
        Village.literacy_rate.isnot(None)
    ).scalar()

    lines += [
        "## Census Data Summary (Mathura District, 2011)",
        "",
        f"| Metric | Value |",
        f"|--------|-------|",
        f"| Total population (all villages) | {total_pop:,} |",
        f"| Total households | {total_hh:,} |",
        f"| Average literacy rate (inhabited villages) | {avg_lit:.1%} |",
        f"| Data year | 2011 |",
        f"| Data source | Census of India 2011 |",
        "",
    ]

    # ── Footer ────────────────────────────────────────────────────────────────
    lines += [
        "---",
        "",
        "_All data is sourced from official government datasets (Census 2011,_",
        "_Agmarknet) and OpenStreetMap. No data was invented or estimated._",
        "_Confidence levels reflect actual data availability, not assumptions._",
    ]

    return "\n".join(lines)


def main():
    import sys
    session = SessionLocal()
    try:
        report = run(session)
    finally:
        session.close()

    # Normalize to ASCII-safe: replace all non-ASCII chars that cause cp1252 issues
    report = (
        report
        .replace("🟢", "[High]")
        .replace("🟡", "[Medium]")
        .replace("🔴", "[Low]")
        .replace("⚠️", "[!]")
        .replace("₹", "Rs.")
        .replace("\u20b9", "Rs.")   # rupee sign (belt + suspenders)
    )

    out_path = sys.argv[1] if len(sys.argv) > 1 else "docs/data_coverage_report.md"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"Report written to {out_path}")


if __name__ == "__main__":
    main()
