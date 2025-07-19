# Tracks all of the portfolio data
from enum import Enum
from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime
from ..utils.google_auth import GoogleSheetsClient
from ..config import settings

# Enum values for different broker sheets within the Google Sheet
class BrokerSheet(Enum):
    FIDELITY = "Fidelity"
    WEBULL = "Webull"
    KRAKEN = "Kraken"

@dataclass
class Position:
    broker: BrokerSheet
    symbol: str
    quantity: float
    cost_basis: float
    account_type: Optional[str] = None
    current_value: Optional[float] = None
    last_updated: Optional[datetime] = None

    def __post_init__(self):
        self._validate()
        self.last_updated = datetime.now()
    
    def _validate(self):
        if self.quantity <= 0:
            raise ValueError("Quantity must be positive")
        if self.cost_basis < 0:
            raise ValueError("Cost basis must be non-negative")
        if not self.symbol:
            raise ValueError("Symbol cannot be empty")
        if self.broker == BrokerSheet.FIDELITY and not self.account_type:
            raise ValueError("Account type is required for Fidelity broker")
        
@property
def market_value(self) -> Optional[float]:
    if self.current_value is not None:
        return self.quantity * self.current_value
    return None

@property
def gain_loss(self) -> Optional[float]:
    if self.market_value is not None:
        return self.market_value - (self.quantity * self.cost_basis)
    return None


class PortfolioTracker:
    def __init__(self):
        self.sheets_client = GoogleSheetsClient()
        self.market_data = MarketDataService()
        self.positions: List[Position] = []