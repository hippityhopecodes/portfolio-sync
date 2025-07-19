# Tracks all of the portfolio data
from enum import Enum
from dataclasses import dataclass
from typing import Optional, List, Dict
from datetime import datetime
from ..utils.google_auth import GoogleSheetsClient
from ..config import settings
from ..utils.market_data import MarketDataService

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
        self.load_positions()

    def load_positions(self):
        self.positions = []
        self._load_fidelity()
        self._load_webull()
        self._load_kraken()

    def _load_fidelity(self):
        data = self.sheets_client.read_range(settings.fidelity_range)
        for row in data:
            if len(row) >= 4:
                self.positions.append(Position(
                    broker=BrokerSheet.FIDELITY,
                    account_type=row[0],
                    symbol=row[1],
                    quantity=float(row[2]),
                    cost_basis=float(row[3])
                ))

    def _load_webull(self):
        data = self.sheets_client.read_range(settings.webull_range)
        for row in data:
            if len(row) >= 3:
                self.positions.append(Position(
                    broker=BrokerSheet.WEBULL,
                    symbol=row[0],
                    quantity=float(row[1]),
                    cost_basis=float(row[2])
                ))

    def _load_kraken(self):
        data = self.sheets_client.read_range(settings.kraken_range)
        for row in data:
            if len(row) >= 3:
                self.positions.append(Position(
                    broker=BrokerSheet.KRAKEN,
                    symbol=row[0],
                    quantity=float(row[1]),
                    cost_basis=float(row[2])
                ))

    def update_prices(self):
        """Update current prices for all positions"""
        symbols = [p.symbol for p in self.positions]
        prices = self.market_data.get_multiple_prices(symbols)
        
        for position in self.positions:
            position.current_value = prices.get(position.symbol)
            position.last_updated = datetime.now()

    def get_summary(self) -> Dict:
        """Get portfolio summary"""
        return {
            "total_value": sum(p.market_value or 0 for p in self.positions),
            "total_cost": sum(p.quantity * p.cost_basis for p in self.positions),
            "total_gain_loss": sum(p.gain_loss or 0 for p in self.positions),
            "by_broker": self._get_broker_summary(),
            "last_updated": datetime.now().isoformat()
        }

    def _get_broker_summary(self) -> Dict:
        summary = {broker.value: {"total_cost": 0, "total_value": 0, "gain_loss": 0} 
                  for broker in BrokerSheet}
        
        for position in self.positions:
            broker_data = summary[position.broker.value]
            broker_data["total_cost"] += position.quantity * position.cost_basis
            if position.market_value:
                broker_data["total_value"] += position.market_value
                broker_data["gain_loss"] += position.gain_loss or 0
        
        return summary