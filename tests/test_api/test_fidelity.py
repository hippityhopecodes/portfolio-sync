import pytest
from decimal import Decimal
from typing import Dict, List
from src.backend.api.fidelity import FidelityAPI

class FidelityAPITest:
    """
    Tests fidelity.py
    """
    @pytest.fixture
    def fidelity_api(self):
        from src.backend.api.fidelity import FidelityAPI
        return FidelityAPI(username="test_user", password="test_pass")

    async def test_get_roth_ira_data(self, fidelity_api):
        data = await fidelity_api.get_roth_ira_data()
        assert isinstance(data, dict)
        assert "roth_ira" in data

    async def test_get_cash_management_data(self, fidelity_api):
        data = await fidelity_api.get_cash_management_data()
        assert isinstance(data, dict)
        assert "cash_management" in data

    async def test_get_current_prices(self, fidelity_api):
        symbols = ["AAPL", "GOOGL"]
        prices = await fidelity_api.get_current_prices(symbols)
        assert isinstance(prices, dict)
        for symbol in symbols:
            assert symbol in prices
            assert isinstance(prices[symbol], Decimal)