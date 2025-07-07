# Holds the type of assets and their associated parameters
from enum import Enum

# Represents different types of assets in the accounts
class AssetType(Enum):
    STOCK = "stock"
    ETF = "etf"
    MUTUAL_FUND = "mutual_fund" 
    CRYPTO = "crypto"
    CASH = "cash"

# Represents an Asset with its type and parameters
class Asset:
    def __init__(self):
        pass