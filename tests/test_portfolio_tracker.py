import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from src.backend.api.portfolio_tracker import PortfolioTracker, Position, BrokerSheet

@pytest.fixture
def sample_position_data():
    return {
        "broker": BrokerSheet.FIDELITY,
        "account_type": "Roth IRA",
        "symbol": "AAPL",
        "quantity": 10,
        "cost_basis": 150.00
    }

@pytest.fixture
def sample_position_data():
    return {
        "broker": BrokerSheet.FIDELITY,
        "account_type": "Roth IRA",
        "symbol": "AAPL",
        "quantity": 10,
        "cost_basis": 150.00
    }

@pytest.fixture
def mock_sheets_data():
    """Mock data that would come from Google Sheets"""
    return {
        "fidelity": [
            ["Roth IRA", "AAPL", "10", "150.00"],
            ["401K", "GOOGL", "5", "2800.00"]
        ],
        "webull": [
            ["MSFT", "15", "280.00"],
            ["TSLA", "3", "900.00"]
        ],
        "kraken": [
            ["BTC", "0.5", "20000.00"],
            ["ETH", "2", "1500.00"]
        ]
    }

@pytest.fixture
def mock_price_data():
    """Mock price data from market data service"""
    return {
        "AAPL": 160.00,
        "GOOGL": 2900.00,
        "MSFT": 300.00,
        "TSLA": 800.00,
        "BTC": 45000.00,
        "ETH": 3000.00
    }

@pytest.fixture
@patch('src.backend.api.portfolio_tracker.GoogleSheetsClient')
@patch('src.backend.api.portfolio_tracker.MarketDataService')
def tracker(mock_market_service, mock_sheets_client, mock_sheets_data, mock_price_data):
    # Configure mock sheets client
    def mock_read_range(range_name):
        if "Fidelity" in range_name:
            return mock_sheets_data["fidelity"]
        elif "Webull" in range_name:
            return mock_sheets_data["webull"]
        elif "Kraken" in range_name:
            return mock_sheets_data["kraken"]
        return []
    
    mock_sheets_instance = Mock()
    mock_sheets_instance.read_range.side_effect = mock_read_range
    mock_sheets_client.return_value = mock_sheets_instance
    
    # Configure mock market data service
    mock_market_instance = Mock()
    mock_market_instance.get_multiple_prices.return_value = mock_price_data
    mock_market_service.return_value = mock_market_instance
    
    return PortfolioTracker()

def test_position_creation(sample_position_data):
    """Test creating a valid position"""
    position = Position(**sample_position_data)
    assert position.symbol == "AAPL"
    assert position.quantity == 10
    assert position.cost_basis == 150.00

def test_position_validation():
    """Test position validation"""
    # Test negative quantity
    with pytest.raises(ValueError):
        Position(
            broker=BrokerSheet.FIDELITY,
            account_type="Roth IRA",
            symbol="AAPL",
            quantity=-10,
            cost_basis=150.00
        )

    # Test empty symbol
    with pytest.raises(ValueError):
        Position(
            broker=BrokerSheet.FIDELITY,
            account_type="Roth IRA",
            symbol="",
            quantity=10,
            cost_basis=150.00
        )

    # Test missing account type for Fidelity
    with pytest.raises(ValueError):
        Position(
            broker=BrokerSheet.FIDELITY,
            symbol="AAPL",
            quantity=10,
            cost_basis=150.00
        )

def test_position_calculations(sample_position_data):
    """Test position calculations"""
    position = Position(**sample_position_data)
    position.current_value = 160.00

    assert position.market_value == 1600.00  # 10 * 160.00
    assert position.gain_loss == 100.00  # (160 - 150) * 10

def test_portfolio_loading(tracker):
    """Test portfolio loading"""
    assert len(tracker.positions) > 0
    
    # Check if positions are properly categorized
    fidelity_positions = [p for p in tracker.positions if p.broker == BrokerSheet.FIDELITY]
    webull_positions = [p for p in tracker.positions if p.broker == BrokerSheet.WEBULL]
    kraken_positions = [p for p in tracker.positions if p.broker == BrokerSheet.KRAKEN]
    
    assert len(fidelity_positions) == 2  # AAPL and GOOGL from mock data
    assert len(webull_positions) == 2    # MSFT and TSLA from mock data
    assert len(kraken_positions) == 2    # BTC and ETH from mock data

def test_portfolio_summary(tracker):
    """Test portfolio summary calculation"""
    tracker.update_prices()
    
    summary = tracker.get_summary()
    assert "total_value" in summary
    assert "total_cost" in summary
    assert "total_gain_loss" in summary
    assert "by_broker" in summary
    assert "last_updated" in summary
    
    # Test that values are calculated correctly with mock data
    assert summary["total_value"] > 0
    assert summary["total_cost"] > 0

    # Test broker breakdown
    broker_summary = summary["by_broker"]
    assert "Fidelity" in broker_summary
    assert "Webull" in broker_summary
    assert "Kraken" in broker_summary
    
    # Verify each broker has the expected structure
    for broker_name, broker_data in broker_summary.items():
        assert "total_cost" in broker_data
        assert "total_value" in broker_data
        assert "gain_loss" in broker_data

def test_price_updates(tracker):
    """Test price updating functionality"""
    tracker.update_prices()
    
    # Check if all positions have current values (from mock data)
    assert all(position.current_value is not None for position in tracker.positions)
    assert all(position.last_updated is not None for position in tracker.positions)
    
    # Verify specific price values from mock data
    aapl_position = next((p for p in tracker.positions if p.symbol == "AAPL"), None)
    assert aapl_position is not None
    assert aapl_position.current_value == 160.00

@pytest.mark.parametrize("broker,expected_positions", [
    (BrokerSheet.FIDELITY, 2),  # AAPL and GOOGL from mock data
    (BrokerSheet.WEBULL, 2),    # MSFT and TSLA from mock data  
    (BrokerSheet.KRAKEN, 2),    # BTC and ETH from mock data
])
def test_broker_data_structure(tracker, broker, expected_positions):
    """Test data structure for each broker"""
    positions = [p for p in tracker.positions if p.broker == broker]
    assert len(positions) == expected_positions
    
    for position in positions:
        assert position.symbol is not None
        assert position.quantity > 0
        assert position.cost_basis > 0
        if broker == BrokerSheet.FIDELITY:
            assert position.account_type is not None

def test_portfolio_refresh(tracker):
    """Test portfolio refresh functionality"""
    initial_positions = len(tracker.positions)
    assert initial_positions == 6  # 2 + 2 + 2 from mock data
    
    tracker.load_positions()  # Refresh - should reload the same mock data
    assert len(tracker.positions) == initial_positions
    
    # Update prices and check timestamps
    if tracker.positions:
        position = tracker.positions[0]
        original_update_time = position.last_updated
        tracker.update_prices()
        assert position.last_updated >= original_update_time  # Should be updated or same

def test_position_market_calculations(tracker):
    """Test market value and gain/loss calculations with real data"""
    tracker.update_prices()
    
    # Find AAPL position and verify calculations
    aapl_position = next((p for p in tracker.positions if p.symbol == "AAPL"), None)
    assert aapl_position is not None
    
    # From mock data: 10 shares at $150 cost, current price $160
    expected_market_value = 10 * 160.00  # 1600.00
    expected_gain_loss = expected_market_value - (10 * 150.00)  # 100.00
    
    assert aapl_position.market_value == expected_market_value
    assert aapl_position.gain_loss == expected_gain_loss

def test_empty_sheet_handling(mock_sheets_data):
    """Test handling of empty sheets"""
    with patch('src.backend.api.portfolio_tracker.GoogleSheetsClient') as mock_sheets_client, \
         patch('src.backend.api.portfolio_tracker.MarketDataService') as mock_market_service:
        
        # Configure mock to return empty data
        mock_sheets_instance = Mock()
        mock_sheets_instance.read_range.return_value = []
        mock_sheets_client.return_value = mock_sheets_instance
        
        mock_market_instance = Mock()
        mock_market_service.return_value = mock_market_instance
        
        tracker = PortfolioTracker()
        assert len(tracker.positions) == 0

def test_invalid_sheet_data_handling():
    """Test handling of invalid/incomplete sheet data"""
    with patch('src.backend.api.portfolio_tracker.GoogleSheetsClient') as mock_sheets_client, \
         patch('src.backend.api.portfolio_tracker.MarketDataService') as mock_market_service:
        
        # Configure mock to return incomplete data
        def mock_read_range(range_name):
            if "Fidelity" in range_name:
                return [
                    ["Roth IRA", "AAPL", "10", "150.00"],  # Valid row
                    ["401K", "GOOGL"],  # Incomplete row - should be skipped
                    ["IRA"]  # Very incomplete row - should be skipped
                ]
            return []
        
        mock_sheets_instance = Mock()
        mock_sheets_instance.read_range.side_effect = mock_read_range
        mock_sheets_client.return_value = mock_sheets_instance
        
        mock_market_instance = Mock()
        mock_market_service.return_value = mock_market_instance
        
        tracker = PortfolioTracker()
        # Should only have 1 valid position (AAPL), invalid rows should be skipped
        assert len(tracker.positions) == 1
        assert tracker.positions[0].symbol == "AAPL"