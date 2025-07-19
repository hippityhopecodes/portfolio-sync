import pytest
from unittest.mock import Mock, patch
from datetime import datetime
from src.backend.utils.market_data import MarketDataService, MarketDataError

@pytest.fixture
def market_service():
    return MarketDataService()

@pytest.fixture
def mock_yf_ticker():
    """Mock yfinance ticker with sample data"""
    mock_ticker = Mock()
    mock_ticker.info = {
        'regularMarketPrice': 150.0,
        'symbol': 'AAPL'
    }
    return mock_ticker

@patch('src.backend.utils.market_data.yf.Ticker')
def test_get_stock_price(mock_ticker_class, market_service, mock_yf_ticker):
    """Test getting a regular stock price"""
    mock_ticker_class.return_value = mock_yf_ticker
    
    price = market_service.get_price("AAPL")
    assert isinstance(price, float)
    assert price > 0
    assert price == 150.0

@patch('src.backend.utils.market_data.yf.Ticker')
def test_get_crypto_price(mock_ticker_class, market_service, mock_yf_ticker):
    """Test getting a crypto price"""
    mock_yf_ticker.info['regularMarketPrice'] = 45000.0
    mock_ticker_class.return_value = mock_yf_ticker
    
    price = market_service.get_price("BTC-USD")
    assert isinstance(price, float)
    assert price > 0
    assert price == 45000.0

@patch('src.backend.utils.market_data.yf.Ticker')
def test_crypto_symbol_formatting(mock_ticker_class, market_service, mock_yf_ticker):
    """Test crypto symbol gets formatted correctly"""
    mock_yf_ticker.info['regularMarketPrice'] = 45000.0
    mock_ticker_class.return_value = mock_yf_ticker
    
    # Both should return same price
    price1 = market_service.get_price("BTC-USD")
    price2 = market_service.get_price("BTC")
    assert price1 == price2
    assert price1 == 45000.0

@patch('src.backend.utils.market_data.yf.Ticker')
def test_invalid_symbol(mock_ticker_class, market_service):
    """Test handling of invalid symbols"""
    mock_ticker = Mock()
    mock_ticker.info = {'regularMarketPrice': None}
    mock_ticker_class.return_value = mock_ticker
    
    with pytest.raises(MarketDataError):
        market_service.get_price("INVALID_SYMBOL_123")

@patch('src.backend.utils.market_data.yf.Ticker')
def test_multiple_prices(mock_ticker_class, market_service):
    """Test getting multiple prices at once"""
    def mock_ticker_side_effect(symbol):
        mock_ticker = Mock()
        prices = {"AAPL": 150.0, "GOOGL": 2800.0, "BTC-USD": 45000.0}
        mock_ticker.info = {'regularMarketPrice': prices.get(symbol, 100.0)}
        return mock_ticker
    
    mock_ticker_class.side_effect = mock_ticker_side_effect
    
    symbols = ["AAPL", "GOOGL", "BTC-USD"]
    prices = market_service.get_multiple_prices(symbols)
    
    assert len(prices) == 3
    assert all(isinstance(price, float) for price in prices.values())
    assert all(price > 0 for price in prices.values())

@patch('src.backend.utils.market_data.yf.Ticker')
def test_price_caching(mock_ticker_class, market_service, mock_yf_ticker):
    """Test that prices are cached"""
    mock_ticker_class.return_value = mock_yf_ticker
    
    # First call
    price1 = market_service.get_price("AAPL")
    # Second call should return cached value
    price2 = market_service.get_price("AAPL")
    assert price1 == price2
    
    # Should only call the API once due to caching
    assert mock_ticker_class.call_count == 1

@patch('src.backend.utils.market_data.yf.Ticker')
def test_cache_clearing(mock_ticker_class, market_service, mock_yf_ticker):
    """Test cache clearing functionality"""
    mock_ticker_class.return_value = mock_yf_ticker
    
    price1 = market_service.get_price("AAPL")
    market_service.clear_cache()
    price2 = market_service.get_price("AAPL")
    # Prices should be the same (same mock data)
    assert price1 == price2
    # But API should have been called twice due to cache clear
    assert mock_ticker_class.call_count == 2

@patch('src.backend.utils.market_data.yf.Ticker')
def test_rate_limiting(mock_ticker_class, market_service, mock_yf_ticker):
    """Test rate limiting doesn't throw errors"""
    mock_ticker_class.return_value = mock_yf_ticker
    
    symbols = ["AAPL"] * 5  # Make 5 quick requests
    try:
        for symbol in symbols:
            market_service.get_price(symbol)
    except Exception as e:
        pytest.fail(f"Rate limiting failed: {e}")
        
    # Only one API call should be made due to caching
    assert mock_ticker_class.call_count == 1