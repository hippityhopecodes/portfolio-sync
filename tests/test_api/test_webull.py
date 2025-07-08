import pytest
from decimal import Decimal
from typing import Dict, List
from src.backend.api.webull import WebullAPI

class WebullAPITest:
    """
    Tests webull.py
    """

    @pytest.fixture
    def webull_api(self):
        return WebullAPI(email="test_email", password="test_pass")

    async def test_get_account_data(self, webull_api):
        data = await webull_api.get_account_data()
        assert isinstance(data, dict)
        assert "account" in data

    async def test_get_current_prices(self, webull_api):
        symbols = ["AAPL", "GOOGL"]
        prices = await webull_api.get_current_prices(symbols)
        assert isinstance(prices, dict)
        for symbol in symbols:
            assert symbol in prices
            assert isinstance(prices[symbol], Decimal)