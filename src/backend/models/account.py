# Holds the type of the account and their associated parameters
from enum import Enum

# Defines the type of accounts that can exist in the portfolio
class AccountType(Enum):
    FIDELITY_ROTH_IRA = "fidelity_roth_ira"
    FIDELITY_CASH_MANAGEMENT = "fidelity_cash_management"
    WEBULL_INDIVIDUAL = "webull_individual"
    KRAKEN_CRYPTO = "kraken_crypto"

# Represents an Account with its type and parameters
class Account:
    def __init__(self):
        pass