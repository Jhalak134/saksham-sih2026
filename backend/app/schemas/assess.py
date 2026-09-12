from pydantic import BaseModel
from typing import List

class ReportSummary(BaseModel):
    id: str
    category: str
    location: str
    date: str
    fitScore: float
    estimatedProfit: float
    status: str

    class Config:
        from_attributes = True

class MyReportsResponse(BaseModel):
    reports: List[ReportSummary]
