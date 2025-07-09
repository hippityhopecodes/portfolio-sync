import pytest
from src.backend.portfolio_manager import PortfolioManager
from src.backend.api.webull import WebullAPI
from src.backend.api.fidelity import FidelityAPI
from src.backend.api.kraken import KrakenAPI

class PortfolioManagerTest:
    """ Tests portfolio_manager.py """

    @pytest.fixture
    def portfolio_manager(self):
        fidelity_creds = {"api_key": "fidelity_api_key"}
        webull_creds = {"api_key": "webull_api_key"}
        kraken_creds = {"api_key": "kraken_api_key"}
        return PortfolioManager(fidelity_creds, webull_creds, kraken_creds)

    def test_initialization(self, portfolio_manager):
        assert isinstance(portfolio_manager.fidelity_api, FidelityAPI)
        assert isinstance(portfolio_manager.webull_api, WebullAPI)
        assert isinstance(portfolio_manager.kraken_api, KrakenAPI)

    def test_get_total_portfolio(self, portfolio_manager):
        # Mock the API calls to return dummy data
        portfolio_manager.fidelity_api.get_roth_ira_data = lambda: {"value": 10000}
        portfolio_manager.fidelity_api.get_cash_management_data = lambda: {"value": 5000}
        portfolio_manager.webull_api.get_account_data = lambda: {"value": 15000}
        portfolio_manager.kraken_api.get_account_data = lambda: {"value": 20000}

        total_portfolio = portfolio_manager.get_total_portfolio()
        assert total_portfolio['total value'] == 50000
        assert 'accounts' in total_portfolio
        assert 'last_updated' in total_portfolio

    def test_calculate_total_value(self, portfolio_manager):
        accounts = [
            {"value": 10000},
            {"value": 5000},
            {"value": 15000},
            {"value": 20000}
        ]
        total_value = portfolio_manager._calculate_total_value(*accounts)
        assert total_value == 50000

    def test_update_prices(self, portfolio_manager):
        pass