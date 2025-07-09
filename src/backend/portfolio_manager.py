from decimal import Decimal
from typing import Dict
from datetime import datetime
from .api.webull import WebullAPI
from .api.fidelity import FidelityAPI
from .api.kraken import KrakenAPI

class PortfolioManager:
    """
    Manages the user's portfolio across different brokerage accounts.
    """
    def __init__(self, fidelity_creds: Dict[str, str], webull_creds: Dict[str, str], kraken_creds: Dict[str, str]):
        """
        Initializes the PortfolioManager with credentials for each brokerage API.
        :param fidelity_creds: Credentials for Fidelity API.
        :param webull_creds: Credentials for Webull API.
        :param kraken_creds: Credentials for Kraken API.
        """
        self.fidelity_api = FidelityAPI(**fidelity_creds)
        self.webull_api = WebullAPI(**webull_creds)
        self.kraken_api = KrakenAPI(**kraken_creds)

    async def get_total_portfolio(self) -> Dict:
        """
        Fetches and combines all account data
        """
        fidelity_roth = await self.fidelity_api.get_roth_ira_data()
        fidelity_cash = await self.fidelity_api.get_cash_management_data()
        webull_data = await self.webull_api.get_account_data()
        kraken_data = await self.kraken_api.get_account_data()

        return {
            'total value': self._calculate_total_value(fidelity_roth, fidelity_cash, webull_data, kraken_data),
            'accounts': {
                'fidelity_roth': fidelity_roth,
                'fidelity_cash': fidelity_cash,
                'webull': webull_data,
                'kraken': kraken_data
            },
            'last_updated': datetime.now()
        }

    async def update_prices(self):
        """
        Update all current prices
        """
        pass

    def _calculate_total_value(self, *accounts) -> Decimal:
        """
        Calculates the total value of all accounts.
        :param accounts: List of account data dictionaries.
        :return: Total value as a Decimal.
        """
        pass
