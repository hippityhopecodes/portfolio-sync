import pytest
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
def tracker():
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
    tracker.load_positions()
    assert len(tracker.positions) > 0
    
    # Check if positions are properly categorized
    fidelity_positions = [p for p in tracker.positions if p.broker == BrokerSheet.FIDELITY]
    webull_positions = [p for p in tracker.positions if p.broker == BrokerSheet.WEBULL]
    kraken_positions = [p for p in tracker.positions if p.broker == BrokerSheet.KRAKEN]
    
    assert len(fidelity_positions) > 0
    # Other lengths depend on your actual data

def test_portfolio_summary(tracker):
    """Test portfolio summary calculation"""
    tracker.load_positions()
    tracker.update_prices()
    
    summary = tracker.get_summary()
    assert "total_value" in summary
    assert "total_cost" in summary
    assert "total_gain_loss" in summary
    assert "by_broker" in summary
    assert "last_updated" in summary

    # Test broker breakdown
    broker_summary = summary["by_broker"]
    assert "Fidelity" in broker_summary
    assert "Webull" in broker_summary
    assert "Kraken" in broker_summary

def test_price_updates(tracker):
    """Test price updating functionality"""
    tracker.load_positions()
    tracker.update_prices()
    
    # Check if all positions have current values
    assert all(position.current_value is not None for position in tracker.positions)
    assert all(position.last_updated is not None for position in tracker.positions)

@pytest.mark.parametrize("broker,expected_cols", [
    (BrokerSheet.FIDELITY, 4),  # Account, Symbol, Quantity, Cost Basis
    (BrokerSheet.WEBULL, 3),    # Symbol, Quantity, Cost Basis
    (BrokerSheet.KRAKEN, 3),    # Symbol, Quantity, Cost Basis
])
def test_broker_data_structure(tracker, broker, expected_cols):
    """Test data structure for each broker"""
    positions = [p for p in tracker.positions if p.broker == broker]
    for position in positions:
        assert position.symbol is not None
        assert position.quantity > 0
        assert position.cost_basis > 0
        if broker == BrokerSheet.FIDELITY:
            assert position.account_type is not None

def test_portfolio_refresh(tracker):
    """Test portfolio refresh functionality"""
    initial_positions = len(tracker.positions)
    tracker.load_positions()  # Refresh
    assert len(tracker.positions) > 0
    
    # Update a price and check
    if tracker.positions:
        position = tracker.positions[0]
        original_update_time = position.last_updated
        tracker.update_prices()
        assert position.last_updated > original_update_time