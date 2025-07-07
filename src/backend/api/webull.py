from decimal import Decimal
from typing import Dict, List

class WebullAPI:
    """
    WebullAPI provides methods to interact with Webull's financial data
    and services. It includes methods to retrieve current stock prices.
    """

    def __init__(self, email: str, password: str):
        """
        Constructor for WebullAPI
        :param email: Email for Webull account
        :param password: Password for Webull account
        :type email: str
        :type password: str
        """
        pass

    async def get_account_data(self) -> Dict:
        """
        Retrieves account data for the authenticated user
        :return: Dictionary containing account data
        :rtype: Dict
        """
        pass

    async def get_current_prices(self, symbols: List[str]) -> Dict[str, Decimal]:
        """
        Retrieves current stock prices for a list of symbols
        :param symbols: List of stock symbols to retrieve prices for
        :return: Dictionary mapping stock symbols to their current prices
        :rtype: Dict[str, Decimal]
        """
        pass
