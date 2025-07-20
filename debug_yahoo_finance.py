#!/usr/bin/env python3
"""
Test script to debug Yahoo Finance API issues
"""
import yfinance as yf
import sys
import time
from datetime import datetime

def test_symbol(symbol):
    """Test fetching data for a single symbol"""
    print(f"\n=== Testing {symbol} ===")
    
    try:
        ticker = yf.Ticker(symbol)
        print(f"Created ticker object for {symbol}")
        
        # Test 1: History method
        print("Testing history method...")
        try:
            hist = ticker.history(period="5d")
            if not hist.empty:
                latest_price = hist['Close'].iloc[-1]
                print(f"✅ History method: ${latest_price:.2f}")
                return latest_price
            else:
                print("❌ History method: Empty data")
        except Exception as e:
            print(f"❌ History method failed: {e}")
        
        # Test 2: Fast info method
        print("Testing fast_info method...")
        try:
            fast_info = ticker.fast_info
            price = fast_info.get('last_price')
            if price:
                print(f"✅ Fast_info method: ${price:.2f}")
                return price
            else:
                print("❌ Fast_info method: No price data")
        except Exception as e:
            print(f"❌ Fast_info method failed: {e}")
        
        # Test 3: Info method
        print("Testing info method...")
        try:
            info = ticker.info
            price = info.get('regularMarketPrice') or info.get('currentPrice') or info.get('previousClose')
            if price:
                print(f"✅ Info method: ${price:.2f}")
                return price
            else:
                print("❌ Info method: No price data")
        except Exception as e:
            print(f"❌ Info method failed: {e}")
        
        print(f"❌ All methods failed for {symbol}")
        return None
        
    except Exception as e:
        print(f"❌ Failed to create ticker for {symbol}: {e}")
        return None

def main():
    """Test common symbols"""
    test_symbols = [
        'NVDA',     # Popular stock
        'SPY',      # ETF
        'BTC-USD',  # Crypto
        'FSKAX',    # Mutual fund
        'FTIHX',    # International fund
    ]
    
    print("Yahoo Finance API Debug Test")
    print("=" * 40)
    print(f"Current time: {datetime.now()}")
    print(f"yfinance version: {yf.__version__}")
    
    results = {}
    for symbol in test_symbols:
        results[symbol] = test_symbol(symbol)
        time.sleep(1)  # Rate limiting
    
    print("\n" + "=" * 40)
    print("SUMMARY:")
    for symbol, price in results.items():
        status = f"${price:.2f}" if price else "FAILED"
        print(f"{symbol}: {status}")

if __name__ == "__main__":
    main()
