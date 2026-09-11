import pytest
from backend.app.engines.financial_engine import (
    calculate_reducing_balance_emi,
    structure_finances,
)


def test_reducing_balance_emi_math():
    """Verify reducing-balance EMI calculation with moratorium."""
    # Loan = ₹9,00,000, 8.0% interest, 84 months total, 6 months moratorium (78 repayment months)
    res = calculate_reducing_balance_emi(
        principal=900000.0,
        annual_rate=8.0,
        tenure_months=84,
        moratorium_months=6,
    )
    assert res["principal"] == 900000.0
    assert res["repayment_months"] == 78
    assert res["monthly_emi"] > 0.0
    assert res["total_repayment"] > 900000.0
    assert res["total_interest"] > 0.0


def test_financial_structuring_term_loan():
    """
    Verify core SIH #91 formula:
    Available Margin: ₹1,00,000
    Project Cost = ₹1,00,000 / 10% = ₹10,00,000
    Max Loan = 90% = ₹9,00,000
    Scheme = Term Loan Scheme (8.0% interest, 84 mo tenure, 6 mo moratorium)
    """
    fin = structure_finances(available_margin=100000.0, category_name="Dairy")
    assert fin["available_margin"] == 100000.0
    assert fin["project_cost"] == 1000000.0
    assert fin["max_loan_amount"] == 900000.0
    assert fin["scheme_name"] == "Term Loan Scheme"
    assert fin["interest_rate"] == 8.0
    assert fin["tenure_months"] == 84
    assert fin["moratorium_months"] == 6
    assert fin["monthly_emi"] > 0.0


def test_financial_structuring_micro_finance():
    """
    Verify Micro Finance threshold:
    Available Margin: ₹14,000
    Project Cost = ₹1,40,000 (<= ₹1.40L)
    Max Loan = 90% = ₹1,26,000 (capped at ₹1,25,000)
    Scheme = Micro Finance Scheme (6.5% interest, 36 mo tenure, 3 mo moratorium)
    """
    fin = structure_finances(available_margin=14000.0, category_name="Retail")
    assert fin["project_cost"] == 140000.0
    assert fin["max_loan_amount"] == 125000.0  # Capped by scheme limit
    assert fin["scheme_name"] == "Micro Finance Scheme"
    assert fin["interest_rate"] == 6.5
    assert fin["tenure_months"] == 36
    assert fin["moratorium_months"] == 3
