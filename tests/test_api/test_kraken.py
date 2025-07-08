import pytest
from decimal import Decimal
from typing import Dict
from src.backend.api.kraken import KrakenAPI

class KrakenAPITest:
    """
    Tests kraken.py
    """
    @pytest.fixture
    def kraken_api(self):
        return KrakenAPI(api_key="test_key", api_secret="test_secret")

    async def test_get_asset_info(self, kraken_api):
        data = await kraken_api.get_asset_info()
        assert isinstance(data, dict)
        assert "result" in data

    async def test_get_ticker_info(self, kraken_api):
        symbols = ["XBTUSD", "ETHUSD"]
        prices = await kraken_api.get_ticker_info(symbols)
        assert isinstance(prices, dict)
        for symbol in symbols:
            assert symbol in prices
            assert isinstance(prices[symbol], Decimal)
