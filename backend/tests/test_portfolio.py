# Tests the backend for portfolio sync
import pytest
from decimal import Decimal
from datetime import datetime
from backend.models.portfolio import Portfolio, Asset, AssetType, AccountType

@pytest.fixture

# Tests portfolio initialization with sample accounts
def sample_portfolio():
    portfolio = Portfolio("Test Portfolio")
    
    # Add Fidelity Roth IRA
    portfolio.add_account(
        AccountType.FIDELITY_ROTH_IRA,
        "Z12345678",
        Decimal('1000.00'),
        "Fidelity"
    )
    
    # Add Fidelity Cash Management
    portfolio.add_account(
        AccountType.FIDELITY_CASH_MANAGEMENT,
        "Z87654321",
        Decimal('2500.00'),
        "Fidelity"
    )
    
    # Add Webull Individual
    portfolio.add_account(
        AccountType.WEBULL_INDIVIDUAL,
        "12345678",
        Decimal('500.00'),
        "Webull"
    )
    
    # Add Kraken Crypto
    portfolio.add_account(
        AccountType.KRAKEN_CRYPTO,
        "KR123456",
        Decimal('0.00'),
        "Kraken"
    )
    
    return portfolio

# Tests adding assets to the portfolio and checking platform summaries
def test_add_assets(sample_portfolio):
    # Add Roth IRA ETF
    vti = Asset(
        name="Vanguard Total Stock Market ETF",
        symbol="VTI",
        quantity=Decimal('10'),
        price=Decimal('220.50'),
        asset_type=AssetType.ETF,
        platform="Fidelity",
        cost_basis=Decimal('200.00'),
        purchase_date=datetime.now()
    )
    
    # Add Webull Stock
    aapl = Asset(
        name="Apple Inc",
        symbol="AAPL",
        quantity=Decimal('5'),
        price=Decimal('175.00'),
        asset_type=AssetType.STOCK,
        platform="Webull",
        cost_basis=Decimal('150.00'),
        purchase_date=datetime.now()
    )
    
    # Add Crypto
    btc = Asset(
        name="Bitcoin",
        symbol="BTC",
        quantity=Decimal('0.5'),
        price=Decimal('50000.00'),
        asset_type=AssetType.CRYPTO,
        platform="Kraken",
        cost_basis=Decimal('45000.00'),
        purchase_date=datetime.now()
    )
    
    sample_portfolio.add_asset(AccountType.FIDELITY_ROTH_IRA, vti)
    sample_portfolio.add_asset(AccountType.WEBULL_INDIVIDUAL, aapl)
    sample_portfolio.add_asset(AccountType.KRAKEN_CRYPTO, btc)
    
    summary = sample_portfolio.get_platform_summary()
    
    assert summary["fidelity"]["roth_ira"]["total_value"] == Decimal('3205.00')  # 1000 + (10 * 220.50)
    assert summary["webull"]["individual"]["total_value"] == Decimal('1375.00')  # 500 + (5 * 175.00)
    assert summary["kraken"]["crypto"]["total_value"] == Decimal('25000.00')  # 0.5 * 50000.00

# Tests the profit/loss calculation for assets in the portfolio
def test_profit_loss(sample_portfolio):
    btc = Asset(
        name="Bitcoin",
        symbol="BTC",
        quantity=Decimal('0.5'),
        price=Decimal('50000.00'),
        asset_type=AssetType.CRYPTO,
        platform="Kraken",
        cost_basis=Decimal('45000.00'),
        purchase_date=datetime.now()
    )
    
    sample_portfolio.add_asset(AccountType.KRAKEN_CRYPTO, btc)
    pl_summary = sample_portfolio.get_profit_loss_summary()
    
    expected_pl = Decimal('2500.00')  # 0.5 * (50000 - 45000)
    assert pl_summary["kraken"] == expected_pl
    assert pl_summary["total_profit_loss"] == expected_pl