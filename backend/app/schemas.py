from datetime import datetime
from typing import Optional

from pydantic import BaseModel


# ============================================================
# TRANSACTION REQUEST
# ============================================================

class TransactionRequest(BaseModel):

    transaction_id: str

    user_id: int

    amount: float

    avg_user_amount: float

    amount_ratio: float

    transactions_last_10min: int

    new_device: int

    new_location: int

    international: int

    merchant_risk: int

    account_age_days: int

    device_age_days: int

    distance_from_home: float

    failed_attempts_10min: int

    hour: int

    day_of_week: int

    is_weekend: int

    unusual_hour: int


# ============================================================
# CREATE INVESTIGATION
# ============================================================

class InvestigationCreate(BaseModel):

    transaction_id: str

    alert_id: Optional[str] = None

    assigned_to: Optional[str] = None

    investigator_notes: Optional[str] = None


# ============================================================
# UPDATE INVESTIGATION
# ============================================================

class InvestigationUpdate(BaseModel):

    status: Optional[str] = None

    assigned_to: Optional[str] = None

    investigator_notes: Optional[str] = None

    decision: Optional[str] = None


# ============================================================
# INVESTIGATION RESPONSE
# ============================================================

class InvestigationResponse(BaseModel):

    id: int

    investigation_id: str

    transaction_id: str

    alert_id: Optional[str] = None

    status: str

    assigned_to: Optional[str] = None

    investigator_notes: Optional[str] = None

    decision: Optional[str] = None

    created_at: datetime

    updated_at: datetime

    resolved_at: Optional[datetime] = None