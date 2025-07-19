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
        current_time = time.time()
        time_since_last_request = current_time - self._last_request_time
        if time_since_last_request < settings.rate_limit_delay:
            time.sleep(settings.rate_limit_delay - time_since_last_request)
        self._last_request_time = time.time()

    @lru_cache(maxsize=100)
    def get_price(self, symbol: str) -> float:
        self._rate_limit()
        try:
            symbol = self._format_symbol(symbol)
            ticker = yf.Ticker(symbol)
            
            # Try multiple approaches to get price
            price = None
            
            # First try: regular market price from info
            try:
                info = ticker.info
                price = info.get('regularMarketPrice') or info.get('currentPrice')
            except:
                pass
            
            # Second try: fast_info (faster but may have less data)
            if price is None:
                try:
                    fast_info = ticker.fast_info
                    price = fast_info.get('last_price')
                except:
                    pass
            
            # Third try: history (most reliable but slower)
            if price is None:
                try:
                    hist = ticker.history(period="1d")
                    if not hist.empty:
                        price = hist['Close'].iloc[-1]
                except:
                    pass
            
            if price is None:
                raise MarketDataError(f"No price data available for {symbol}")
            
            return float(price)
        except MarketDataError:
            raise
        except Exception as e:
            if "429" in str(e):
                # Rate limited - wait longer and try once more
                time.sleep(5)
                try:
                    ticker = yf.Ticker(symbol)
                    hist = ticker.history(period="1d")
                    if not hist.empty:
                        return float(hist['Close'].iloc[-1])
                except:
                    pass
            raise MarketDataError(f"Error fetching {symbol}: {str(e)}")

    def _format_symbol(self , symbol: str) -> str:
        """Format symbol for API request"""
        if self._is_crypto(symbol) and not symbol.endswith('-USD'):
            return f"{symbol}-USD"
        return symbol

    def _is_crypto(self, symbol: str) -> bool:
        """Check if the symbol is a cryptocurrency"""
        # Common crypto symbols
        crypto_symbols = ['BTC', 'ETH', 'LTC', 'XRP', 'ADA', 'DOT', 'DOGE', 'SOL', 'MATIC']
        # Check if it's a known crypto symbol or already ends with -USD
        return symbol in crypto_symbols or symbol.endswith('-USD') or symbol.endswith('USDT')

    def get_multiple_prices(self, symbols: List[str]) -> Dict[str, float]:
        prices = {}
        for symbol in symbols:
            try:
                prices[symbol] = self.get_price(symbol)
            except MarketDataError:
                prices[symbol] = 0.0
        return prices

    def clear_cache(self):
        self.get_price.cache_clear()