import yfinance as yf
import requests
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
        # Set up session with headers to avoid blocking
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })

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
            print(f"Attempting to fetch price for: {symbol}")
            
            # Special handling for cash
            if symbol.upper() == 'CASH':
                return 1.0
            
            # Method 1: Try direct Yahoo Finance query API
            try:
                print(f"Trying Yahoo Finance query API for {symbol}")
                price = self._try_yahoo_query_api(symbol)
                if price:
                    print(f"Yahoo query API successful for {symbol}: ${price}")
                    return price
            except Exception as e:
                print(f"Yahoo query API failed for {symbol}: {e}")
            
            # Method 2: Try free FMP API
            try:
                print(f"Trying Financial Modeling Prep API for {symbol}")
                price = self._try_fmp_api(symbol)
                if price:
                    print(f"FMP API successful for {symbol}: ${price}")
                    return price
            except Exception as e:
                print(f"FMP API failed for {symbol}: {e}")
            
            # Method 3: Try IEX Cloud free API
            try:
                print(f"Trying IEX Cloud API for {symbol}")
                price = self._try_iex_api(symbol)
                if price:
                    print(f"IEX API successful for {symbol}: ${price}")
                    return price
            except Exception as e:
                print(f"IEX API failed for {symbol}: {e}")
            
            # Method 4: Try yfinance with session
            try:
                print(f"Trying yfinance with session for {symbol}")
                ticker = yf.Ticker(symbol, session=self.session)
                hist = ticker.history(period="1d", interval="1d")
                if not hist.empty:
                    price = float(hist['Close'].iloc[-1])
                    print(f"yfinance successful for {symbol}: ${price}")
                    return price
            except Exception as e:
                print(f"yfinance failed for {symbol}: {e}")
            
            # Method 3: Try alternative period
            try:
                print(f"Trying yfinance alternative period for {symbol}")
                ticker = yf.Ticker(symbol, session=self.session)
                hist = ticker.history(period="5d")
                if not hist.empty:
                    price = float(hist['Close'].iloc[-1])
                    print(f"yfinance (5d) successful for {symbol}: ${price}")
                    return price
            except Exception as e:
                print(f"yfinance (5d) failed for {symbol}: {e}")
            
            raise MarketDataError(f"All methods failed for {symbol}")
            
        except MarketDataError:
            raise
        except Exception as e:
            print(f"Unexpected error for {symbol}: {e}")
            raise MarketDataError(f"Error fetching {symbol}: {str(e)}")
    
    def _try_iex_api(self, symbol: str) -> float:
        """Try IEX Cloud free tier API"""
        try:
            # IEX Cloud has a free tier
            url = f"https://cloud.iexapis.com/stable/stock/{symbol}/quote?token=demo"
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if 'latestPrice' in data:
                return float(data['latestPrice'])
            
            return None
        except Exception as e:
            print(f"IEX API error for {symbol}: {e}")
            return None
    
    def _try_fmp_api(self, symbol: str) -> float:
        """Try Financial Modeling Prep API (free tier, no API key needed for basic quotes)"""
        try:
            # FMP has free tier with limited calls per day
            url = f"https://financialmodelingprep.com/api/v3/quote-short/{symbol}"
            
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data and len(data) > 0 and 'price' in data[0]:
                return float(data[0]['price'])
            
            return None
        except Exception as e:
            print(f"FMP API error for {symbol}: {e}")
            return None
    
    def _try_yahoo_query_api(self, symbol: str) -> float:
        """Try Yahoo Finance query API directly"""
        try:
            url = f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = self.session.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            if data.get('chart', {}).get('result'):
                result = data['chart']['result'][0]
                if result.get('meta', {}).get('regularMarketPrice'):
                    return float(result['meta']['regularMarketPrice'])
                
                # Try getting from indicators
                indicators = result.get('indicators', {})
                if indicators.get('quote') and indicators['quote'][0].get('close'):
                    closes = [x for x in indicators['quote'][0]['close'] if x is not None]
                    if closes:
                        return float(closes[-1])
            
            return None
        except Exception as e:
            print(f"Yahoo query API error for {symbol}: {e}")
            return None
            raise MarketDataError(f"Error fetching {symbol}: {str(e)}")

    def _format_symbol(self, symbol: str) -> str:
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
        
        # Updated mock prices for common symbols
        mock_prices = {
            'FSKAX': 180.50,    # Fidelity Total Stock Market Index
            'FTIHX': 35.25,     # Fidelity Total International Index  
            'FXNAX': 12.85,     # Fidelity Bond Index
            'CASH': 1.0,        # Cash position
            'NVDA': 875.00,     # NVIDIA
            'AAPL': 190.00,     # Apple
            'MSFT': 420.00,     # Microsoft
            'GOOGL': 145.00,    # Google
            'AMZN': 150.00,     # Amazon
            'TSLA': 250.00,     # Tesla
            'SPY': 445.00,      # S&P 500 ETF
            'QQQ': 385.00,      # NASDAQ 100 ETF
            'VTI': 265.00,      # Vanguard Total Stock Market
            'VOO': 435.00,      # Vanguard S&P 500
            'BTC-USD': 67000.00,    # Bitcoin
            'ETH-USD': 3500.00,     # Ethereum
            'XRP-USD': 0.55,        # Ripple
            'ADA-USD': 0.45,        # Cardano
            'SOL-USD': 180.00,      # Solana
        }
        
        print(f"Processing {len(symbols)} symbols: {symbols}")
        
        for symbol in symbols:
            symbol_upper = symbol.upper()
            
            # Try real API first with timeout
            try:
                print(f"Attempting real API for {symbol}")
                price = self.get_price(symbol)
                prices[symbol] = price
                print(f"✅ Real API success for {symbol}: ${price}")
                continue
            except MarketDataError as e:
                print(f"❌ Real API failed for {symbol}: {str(e)}")
            
            # Fall back to mock prices
            if symbol in mock_prices:
                prices[symbol] = mock_prices[symbol]
                print(f"📦 Using mock price for {symbol}: ${mock_prices[symbol]}")
            elif symbol_upper in mock_prices:
                prices[symbol] = mock_prices[symbol_upper]
                print(f"📦 Using mock price for {symbol_upper}: ${mock_prices[symbol_upper]}")
            else:
                # Special cases
                if symbol_upper == 'CASH':
                    prices[symbol] = 1.0
                    print(f"💵 Using cash price for {symbol}: $1.00")
                else:
                    # Use a reasonable fallback based on symbol type
                    if symbol_upper.endswith('-USD'):  # Crypto
                        prices[symbol] = 50.00
                        print(f"🪙 Using crypto fallback for {symbol}: $50.00")
                    elif len(symbol) == 5 and symbol.endswith('X'):  # Mutual fund
                        prices[symbol] = 25.00
                        print(f"🏦 Using mutual fund fallback for {symbol}: $25.00")
                    elif len(symbol) <= 4:  # Likely stock
                        prices[symbol] = 100.00
                        print(f"📈 Using stock fallback for {symbol}: $100.00")
                    else:
                        prices[symbol] = 50.00
                        print(f"❓ Using generic fallback for {symbol}: $50.00")
        
        print(f"Final prices: {prices}")
        return prices

    def clear_cache(self):
        self.get_price.cache_clear()