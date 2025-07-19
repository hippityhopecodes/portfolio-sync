import pytest
from src.backend.config import Settings

@pytest.fixture
def test_settings():
    """Override settings for testing"""
    return Settings(
        sheet_id="test_sheet_id",
        sheet_name="TestPortfolio",
        fidelity_range="Fidelity!A2:D",
        webull_range="Webull!A2:C",
        kraken_range="Kraken!A2:C"
    )

@pytest.fixture(autouse=True)
def mock_sheets_client(monkeypatch):
    """Mock Google Sheets client for testing"""
    def mock_read_range(range_name):
        # Return test data based on range
        if "Fidelity" in range_name:
            return [
                ["Roth IRA", "AAPL", "10", "150.00"],
                ["401K", "GOOGL", "5", "2800.00"]
            ]
        elif "Webull" in range_name:
            return [
                ["MSFT", "15", "280.00"],
                ["TSLA", "3", "900.00"]
            ]
        elif "Kraken" in range_name:
            return [
                ["BTC", "0.5", "20000.00"],
                ["ETH", "2", "1500.00"]
            ]
        return []

    monkeypatch.setattr("src.backend.utils.google_auth.GoogleSheetsClient.read_range", 
                       mock_read_range)