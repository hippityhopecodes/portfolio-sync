import pytest
from datetime import datetime
from src.backend.utils.market_data import MarketDataService, MarketDataError

@pytest.fixture
def market_service():
    return MarketDataService()

def test_get_stock_price(market_service):
    """Test getting a regular stock price"""
    price = market_service.get_price("AAPL")
    assert isinstance(price, float)
    assert price > 0

def test_get_crypto_price(market_service):
    """Test getting a crypto price"""
    price = market_service.get_price("BTC-USD")
    assert isinstance(price, float)
    assert price > 0

def test_crypto_symbol_formatting(market_service):
    """Test crypto symbol gets formatted correctly"""
    # Both should return same price
    price1 = market_service.get_price("BTC-USD")
    price2 = market_service.get_price("BTC")
    assert price1 == price2

def test_invalid_symbol(market_service):
    """Test handling of invalid symbols"""
    with pytest.raises(MarketDataError):
        market_service.get_price("INVALID_SYMBOL_123")

def test_multiple_prices(market_service):
    """Test getting multiple prices at once"""
    symbols = ["AAPL", "GOOGL", "BTC-USD"]
    prices = market_service.get_multiple_prices(symbols)
    
    assert len(prices) == 3
    assert all(isinstance(price, float) for price in prices.values())
    assert all(price > 0 for price in prices.values())

def test_price_caching(market_service):
    """Test that prices are cached"""
    # First call
    price1 = market_service.get_price("AAPL")
    # Second call should return cached value
    price2 = market_service.get_price("AAPL")
    assert price1 == price2

def test_cache_clearing(market_service):
    """Test cache clearing functionality"""
    price1 = market_service.get_price("AAPL")
    market_service.clear_cache()
    price2 = market_service.get_price("AAPL")
    # Prices might be same if fetched very quickly, but cache was cleared
    assert market_service.get_price.cache_info().currsize == 1

def test_rate_limiting(market_service):
    """Test rate limiting doesn't throw errors"""
    symbols = ["AAPL"] * 5  # Make 5 quick requests
    try:
        for symbol in symbols:
            market_service.get_price(symbol)
    except Exception as e:
        pytest.fail(f"Rate limiting failed: {e}")