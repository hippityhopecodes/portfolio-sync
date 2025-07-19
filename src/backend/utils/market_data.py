import yfinance as yf
from functools import lru_cache
from typing import List, Dict
from datetime import datetime
import time
from ..config import settings

class MarketDataError(Exception):
    pass

class MarketDataService:
    def __init__(self):
        self._last_request_time = 0

    def _rate_limit(self):
        pass

    @lru_cache(maxsize=100)
    def get_price(self, symbol: str) -> float:
        pass

    def _format_symbol(self , symbol: str) -> str:
        pass

    def _is_crypto(self, symbol: str) -> bool:
        pass

    def get_multiple_prices(self, symbols: List[str]) -> Dict[str, float]:
        pass

    def clear_cache(self):
        self.get_price.cache_clear()