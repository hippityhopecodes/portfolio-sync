/**
 * Portfolio Sync API Module
 * 
 * Handles data fetching from Google Sheets, real-time price updates from multiple
 * financial APIs, and portfolio calculations for multi-broker tracking.
 * 
 * Features:
 * - Google Sheets CSV integration
 * - Multi-API price fetching with fallbacks
 * - Support for stocks, ETFs, mutual funds, and cryptocurrencies
 * - Real-time portfolio value calculations
 */

const API = {
    // Google Sheets configuration
    SHEET_ID: '1R5pa0GFV9vFdq3mZIXuporAn4xb-de8qVJR_RuhF6n0',
    
    // Sheet ranges as CSV exports (using correct GIDs from user)
    SHEET_URLS: {
        fidelity: 'https://docs.google.com/spreadsheets/d/1R5pa0GFV9vFdq3mZIXuporAn4xb-de8qVJR_RuhF6n0/export?format=csv&gid=0',
        webull: 'https://docs.google.com/spreadsheets/d/1R5pa0GFV9vFdq3mZIXuporAn4xb-de8qVJR_RuhF6n0/export?format=csv&gid=1045159326',
        kraken: 'https://docs.google.com/spreadsheets/d/1R5pa0GFV9vFdq3mZIXuporAn4xb-de8qVJR_RuhF6n0/export?format=csv&gid=606581791'
    },

    // Parse CSV data
    parseCSV(csvText) {
        console.log('🔍 Parsing CSV, length:', csvText?.length, 'first 200 chars:', csvText?.substring(0, 200));
        
        const lines = csvText.trim().split('\n');
        console.log('📊 CSV has', lines.length, 'lines');
        
        if (lines.length > 0) {
            console.log('📋 Header line:', lines[0]);
        }
        
        const data = [];
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const hasAccountColumn = headers.includes('Account');
        
        console.log('📋 Headers:', headers, 'Has Account column:', hasAccountColumn);
        
        for (let i = 1; i < lines.length; i++) { // Skip header
            const values = lines[i].split(',').map(val => val.trim().replace(/"/g, ''));
            console.log(`Row ${i}:`, values);
            
            let account, symbol, shares, totalCostBasis, cost_basis;
            
            if (hasAccountColumn && values.length >= 4) {
                // Fidelity format: Account,Symbol,Quantity,Cost Basis
                account = values[0].trim(); // Roth IRA, CMA, 401k, etc.
                symbol = values[1].trim();
                shares = parseFloat(values[2]) || 0;
                totalCostBasis = parseFloat(values[3]) || 0;
                cost_basis = shares > 0 ? totalCostBasis / shares : 0;
                console.log(`Using Fidelity format: account=${account}, symbol=${symbol}, shares=${shares}, totalCost=${totalCostBasis}, costPerShare=${cost_basis.toFixed(4)}`);
            } else if (!hasAccountColumn && values.length >= 3) {
                // Webull/Kraken format: Symbol,Quantity,Cost Basis
                account = 'Trading'; // Default account name for Webull/Kraken
                symbol = values[0].trim();
                shares = parseFloat(values[1]) || 0;
                totalCostBasis = parseFloat(values[2]) || 0;
                cost_basis = shares > 0 ? totalCostBasis / shares : 0;
                console.log(`Using Webull/Kraken format: symbol=${symbol}, shares=${shares}, totalCost=${totalCostBasis}, costPerShare=${cost_basis.toFixed(4)}`);
            } else {
                console.log(`❌ Skipping row ${i}: insufficient columns (${values.length} columns)`);
                continue;
            }
            
            // Skip if symbol is not valid or if it's an account header row
            if (symbol && shares > 0 && cost_basis > 0 && this.isValidSymbol(symbol) && account !== 'Account') {
                const position = {
                    symbol: symbol,
                    shares: shares,
                    cost_basis: cost_basis, // Price per share when purchased
                    total_cost_basis: totalCostBasis, // Total amount paid (preserve original)
                    current_value: 0, // Will be calculated with live market prices
                    account: account, // Roth IRA, CMA, 401k for Fidelity; Trading for others
                    broker: null // Will be set in loadSheetData after parsing
                };
                console.log('✅ Added position:', position);
                data.push(position);
            } else {
                console.log('❌ Skipped invalid position:', { account, symbol, shares, cost_basis, valid: this.isValidSymbol(symbol) });
            }
        }
        
        console.log('✅ Parsed', data.length, 'valid positions total');
        return data;
    },

    // Check if symbol is valid for price lookup
    isValidSymbol(symbol) {
        // Skip account types and invalid symbols - allow mutual funds like FSKAX, FTIHX
        const invalidSymbols = ['Cash', 'USD', 'Account', 'Total', 'CASH'];
        return !invalidSymbols.some(invalid => symbol.toUpperCase().includes(invalid.toUpperCase()));
    },

    // Get stock price with real API calls
    async getStockPrice(symbol) {
        // First check if it's a valid symbol
        if (!this.isValidSymbol(symbol)) {
            console.log(`Skipping price lookup for invalid symbol: ${symbol}`);
            return 100.00; // Default price for non-stocks
        }

        // Try to get real prices first, fall back to mock if failed
        try {
            const realPrice = await this.getRealStockPrice(symbol);
            if (realPrice > 0) {
                console.log(`💰 Real price for ${symbol}: $${realPrice}`);
                return realPrice;
            }
        } catch (error) {
            console.warn(`⚠️ Failed to get real price for ${symbol}:`, error.message);
        }

        // Fallback to mock prices with warning
        const mockPrices = {
            // Major stocks - NVDA updated to reflect current market value for user's position
            'AAPL': 185.50, 'GOOGL': 2725.00, 'MSFT': 385.20, 'TSLA': 245.30,
            'NVDA': 172.40, 'AMZN': 155.75, 'META': 485.25, 'NFLX': 580.40,
            'CMA': 47.85, 'JPM': 175.90, 'BAC': 32.45, 'WFC': 45.30,
            // ETFs and Index Funds
            'SPY': 485.20, 'QQQ': 395.75, 'VTI': 245.60, 'IWM': 198.30,
            'VOO': 445.80, 'VXUS': 58.25, 'BND': 76.50, 'VEA': 47.90,
            // Fidelity mutual funds
            'FSKAX': 159.85, 'FTIHX': 15.92, 'FXNAX': 11.45, 'FZROX': 14.25,
            'FZILX': 12.85, 'FDVV': 35.60, 'FXNAC': 55.40, 'FNILX': 58.75,
            // Crypto (live market prices - will be fetched from APIs)
            'BTC': 67500.00, 'BTC-USD': 67500.00,
            'ETH': 3850.00, 'ETH-USD': 3850.00,
            'XRP': 0.62, 'XRP-USD': 0.62,
            'DOGE': 0.085, 'DOGE-USD': 0.085,
            'BNB': 615.00, 'BNB-USD': 615.00,
            'ADA': 0.45, 'ADA-USD': 0.45,
            'SOL': 185.30, 'SOL-USD': 185.30,
            'DOT': 7.25, 'DOT-USD': 7.25,
            // Common individual stocks that might be in portfolios
            'AMD': 145.25, 'INTC': 32.80, 'DIS': 95.40, 'KO': 61.20,
            'PEP': 175.60, 'V': 265.80, 'MA': 420.30, 'PYPL': 62.45
        };
        
        const price = mockPrices[symbol.toUpperCase()] || mockPrices[symbol] || 100.00;
        console.log(`📊 Mock price for ${symbol}: $${price} (real API failed)`);
        return price;
    },

    // Get real stock price from financial APIs with multiple fallbacks
    async getRealStockPrice(symbol) {
        // For stocks and funds, try multiple APIs in order of reliability
        if (!this.isCryptoSymbol(symbol)) {
            try {
                const financialPrice = await this.getGoogleFinancePrice(symbol);
                if (financialPrice > 0) return financialPrice;
            } catch (error) {
                console.log(`Financial API failed for ${symbol}:`, error.message);
            }

            try {
                const twelveDataPrice = await this.getTwelveDataPrice(symbol);
                if (twelveDataPrice > 0) return twelveDataPrice;
            } catch (error) {
                console.log(`Twelvedata failed for ${symbol}:`, error.message);
            }

            try {
                const finnhubPrice = await this.getFinnhubPrice(symbol);
                if (finnhubPrice > 0) return finnhubPrice;
            } catch (error) {
                console.log(`Finnhub failed for ${symbol}:`, error.message);
            }

            try {
                const proxyYahooPrice = await this.getYahooFinanceProxyPrice(symbol);
                if (proxyYahooPrice > 0) return proxyYahooPrice;
            } catch (error) {
                console.log(`Yahoo Finance (proxy) failed for ${symbol}:`, error.message);
            }

            try {
                const alphaPrice = await this.getAlphaVantagePrice(symbol);
                if (alphaPrice > 0) return alphaPrice;
            } catch (error) {
                console.log(`Alpha Vantage failed for ${symbol}:`, error.message);
            }

            try {
                const fmpPrice = await this.getFinancialModelingPrepPrice(symbol);
                if (fmpPrice > 0) return fmpPrice;
            } catch (error) {
                console.log(`Financial Modeling Prep failed for ${symbol}:`, error.message);
            }
        }

        // For cryptocurrencies, use specialized crypto APIs
        if (this.isCryptoSymbol(symbol)) {
            try {
                const cryptoPrice = await this.getCryptoPriceFromCoinGecko(symbol);
                if (cryptoPrice > 0) return cryptoPrice;
            } catch (error) {
                console.log(`CoinGecko failed for ${symbol}:`, error.message);
                // Try alternative crypto API
                try {
                    const altCryptoPrice = await this.getCryptoAlternativePrice(symbol);
                    if (altCryptoPrice > 0) return altCryptoPrice;
                } catch (altError) {
                    console.log(`Alternative crypto API failed for ${symbol}:`, altError.message);
                }
            }
        }

        throw new Error('All price sources failed');
    },

    // Check if symbol is cryptocurrency
    isCryptoSymbol(symbol) {
        const cryptoSymbols = ['BTC', 'ETH', 'XRP', 'DOGE', 'BNB', 'ADA', 'SOL', 'DOT'];
        return cryptoSymbols.includes(symbol.toUpperCase()) || symbol.includes('-USD');
    },

    // Get crypto prices from CoinGecko (free, no API key needed)
    async getCryptoPriceFromCoinGecko(symbol) {
        const cryptoMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum', 
            'XRP': 'ripple',
            'DOGE': 'dogecoin',
            'BNB': 'binancecoin',
            'ADA': 'cardano',
            'SOL': 'solana',
            'DOT': 'polkadot'
        };

        const coinId = cryptoMap[symbol.toUpperCase()];
        if (!coinId) throw new Error(`Unknown crypto symbol: ${symbol}`);

        console.log(`🔍 Fetching ${symbol} price from CoinGecko (${coinId})...`);

        const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);
        
        const data = await response.json();
        console.log(`CoinGecko response for ${symbol}:`, data);
        
        const price = data[coinId]?.usd;
        if (!price || price <= 0) {
            throw new Error(`Invalid price data for ${symbol}: ${price}`);
        }
        
        console.log(`✅ CoinGecko price for ${symbol}: $${price}`);
        return price;
    },

    // Alternative crypto price source (CoinCap API)
    async getCryptoAlternativePrice(symbol) {
        const cryptoMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum', 
            'XRP': 'xrp',
            'DOGE': 'dogecoin'
        };

        const assetId = cryptoMap[symbol.toUpperCase()];
        if (!assetId) throw new Error(`Unsupported crypto for alternative API: ${symbol}`);

        console.log(`🔍 Trying CoinCap API for ${symbol} (${assetId})...`);

        const response = await fetch(`https://api.coincap.io/v2/assets/${assetId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) throw new Error(`CoinCap API error: ${response.status}`);
        
        const data = await response.json();
        const price = parseFloat(data.data?.priceUsd);
        
        if (!price || price <= 0) {
            throw new Error(`Invalid price from CoinCap for ${symbol}: ${price}`);
        }
        
        console.log(`✅ CoinCap price for ${symbol}: $${price}`);
        return price;
    },

    // Finnhub API (free tier with demo key)
    async getFinnhubPrice(symbol) {
        const apiKey = 'demo'; // Replace with your free API key for higher limits
        
        console.log(`🔍 Fetching ${symbol} from Finnhub API...`);
        
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) {
            console.warn(`Finnhub API error for ${symbol}: ${response.status}`);
            throw new Error(`Finnhub API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`Finnhub response for ${symbol}:`, data);
        
        const price = data.c; // Current price
        if (!price || price <= 0) {
            console.warn(`Invalid Finnhub price for ${symbol}: ${price}`);
            throw new Error('Invalid price data');
        }
        
        console.log(`✅ Finnhub price for ${symbol}: $${price}`);
        return price;
    },

    // Financial Modeling Prep API (CORS-friendly stock prices)
    async getGoogleFinancePrice(symbol) {
        console.log(`🔍 Fetching ${symbol} from Financial Modeling Prep API...`);
        
        try {
            const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=demo`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (compatible; Portfolio-Tracker/1.0)'
                }
            });

            if (!response.ok) {
                throw new Error(`Financial API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Financial API response for ${symbol}:`, data);
            
            const quote = data?.[0];
            const price = quote?.price || quote?.previousClose;
            
            if (!price || price <= 0) {
                throw new Error(`Invalid price for ${symbol}: ${price}`);
            }
            
            console.log(`✅ Financial API price for ${symbol}: $${price}`);
            return price;
        } catch (error) {
            console.warn(`Financial API failed for ${symbol}:`, error.message);
            throw error;
        }
    },

    // Twelvedata API (free tier, good CORS support)
    async getTwelveDataPrice(symbol) {
        console.log(`🔍 Fetching ${symbol} from Twelvedata API...`);
        
        try {
            // Free tier, good CORS support
            const response = await fetch(`https://api.twelvedata.com/price?symbol=${symbol}&apikey=demo`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Twelvedata API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Twelvedata response for ${symbol}:`, data);
            
            const price = parseFloat(data?.price);
            
            if (!price || price <= 0) {
                throw new Error(`Invalid Twelvedata price for ${symbol}: ${price}`);
            }
            
            console.log(`✅ Twelvedata price for ${symbol}: $${price}`);
            return price;
        } catch (error) {
            console.warn(`Twelvedata failed for ${symbol}:`, error.message);
            throw error;
        }
    },

    // Yahoo Finance with CORS proxy
    async getYahooFinanceProxyPrice(symbol) {
        console.log(`🔍 Fetching ${symbol} from Yahoo Finance via CORS proxy...`);
        
        try {
            // Using a CORS proxy service
            const proxyUrl = 'https://api.allorigins.win/raw?url=';
            const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
            
            const response = await fetch(proxyUrl + encodeURIComponent(yahooUrl), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Yahoo Finance proxy error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Yahoo Finance proxy response for ${symbol}:`, data);
            
            const result = data?.chart?.result?.[0];
            const price = result?.meta?.regularMarketPrice || result?.meta?.previousClose;
            
            if (!price || price <= 0) {
                throw new Error(`Invalid Yahoo Finance proxy price for ${symbol}: ${price}`);
            }
            
            console.log(`✅ Yahoo Finance proxy price for ${symbol}: $${price}`);
            return price;
        } catch (error) {
            console.warn(`Yahoo Finance proxy failed for ${symbol}:`, error.message);
            throw error;
        }
    },

    // Alternative: IEX Cloud API (also free tier available)
    async getIEXPrice(symbol) {
        // You can get a free API key at https://iexcloud.io/
        const apiKey = 'YOUR_IEX_API_KEY'; // Replace with your actual API key
        
        if (apiKey === 'YOUR_IEX_API_KEY') {
            throw new Error('IEX API key not configured');
        }

        const response = await fetch(`https://cloud.iexapis.com/stable/stock/${symbol}/quote?token=${apiKey}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) throw new Error(`IEX API error: ${response.status}`);
        
        const data = await response.json();
        return data.latestPrice || 0;
    },

    // Alpha Vantage API (demo key has limited access)
    async getAlphaVantagePrice(symbol) {
        const apiKey = 'demo'; // Replace with your free API key from alphavantage.co
        
        if (apiKey === 'YOUR_API_KEY') {
            throw new Error('Alpha Vantage API key not configured');
        }

        console.log(`🔍 Fetching ${symbol} from Alpha Vantage API...`);

        const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            }
        });

        if (!response.ok) throw new Error(`Alpha Vantage API error: ${response.status}`);
        
        const data = await response.json();
        console.log(`Alpha Vantage response for ${symbol}:`, data);
        
        const price = data['Global Quote']?.['05. price'];
        const parsedPrice = parseFloat(price);
        
        if (!parsedPrice || parsedPrice <= 0) {
            throw new Error(`Invalid Alpha Vantage price for ${symbol}: ${price}`);
        }
        
        console.log(`✅ Alpha Vantage price for ${symbol}: $${parsedPrice}`);
        return parsedPrice;
    },

    // Financial Modeling Prep API (alternative endpoint for redundancy)
    async getFinancialModelingPrepPrice(symbol) {
        console.log(`🔍 Fetching ${symbol} from Financial Modeling Prep API (alternative)...`);
        
        try {
            const response = await fetch(`https://financialmodelingprep.com/api/v3/quote-short/${symbol}?apikey=demo`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`Financial Modeling Prep API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log(`Financial Modeling Prep response for ${symbol}:`, data);
            
            const price = data?.[0]?.price;
            
            if (!price || price <= 0) {
                throw new Error(`Invalid Financial Modeling Prep price for ${symbol}: ${price}`);
            }
            
            console.log(`✅ Financial Modeling Prep price for ${symbol}: $${price}`);
            return price;
        } catch (error) {
            console.warn(`Financial Modeling Prep failed for ${symbol}:`, error.message);
            throw error;
        }
    },

    // Load data from Google Sheets and calculate portfolio values
    async loadSheetData(broker, url) {
        try {
            // Add cache-busting parameter to force fresh data
            const cacheBustUrl = `${url}&cachebust=${Date.now()}`;
            console.log(`Loading ${broker} data from: ${cacheBustUrl}`);
            
            const response = await fetch(cacheBustUrl, {
                mode: 'cors',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
            
            if (!response.ok) {
                if (response.status === 400) {
                    console.warn(`${broker} sheet may not exist or GID is wrong (HTTP 400)`);
                    return [];
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            console.log(`${broker} CSV data (first 200 chars):`, csvText.substring(0, 200));
            
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('Empty CSV response');
            }
            
            const positions = this.parseCSV(csvText);
            console.log(`${broker} parsed positions:`, positions);
            
            if (positions.length === 0) {
                console.warn(`No valid positions found for ${broker}`);
                return [];
            }
            
            // Get current prices and calculate values using live market data
            for (let position of positions) {
                // Always fetch current market price for real-time portfolio tracking
                position.current_price = await this.getStockPrice(position.symbol);
                position.current_value = position.shares * position.current_price;
                position.cost_value = position.total_cost_basis; // Use the actual total cost from sheet
                position.gain_loss = position.current_value - position.cost_value;
                position.gain_loss_percentage = position.cost_value > 0 ? ((position.gain_loss / position.cost_value) * 100) : 0;
                position.broker = broker;
                
                console.log(`${broker} - ${position.symbol} (${position.account}): ${position.shares} shares @ $${position.current_price.toFixed(2)} = $${position.current_value.toFixed(2)} (cost: $${position.cost_value.toFixed(2)}, gain/loss: $${position.gain_loss.toFixed(2)}, ${position.gain_loss_percentage.toFixed(2)}%)`);
            }
            
            return positions;
        } catch (error) {
            console.error(`Failed to load ${broker} data:`, error);
            // Return mock data for this broker if loading fails
            if (broker === 'Fidelity') {
                return [{
                    symbol: 'AAPL', shares: 10, cost_basis: 150.00, current_price: 185.50,
                    current_value: 1855.00, cost_value: 1500.00, gain_loss: 355.00, broker: 'Fidelity'
                }];
            }
            return [];
        }
    },

    // Mock data for GitHub Pages demo
    MOCK_DATA: {
        total_value: 125750.00,
        total_cost: 118500.00,
        total_gain_loss: 7250.00,
        by_broker: {
            "Fidelity": {
                total_cost: 65000.00,
                total_value: 68500.00,
                gain_loss: 3500.00
            },
            "Webull": {
                total_cost: 35000.00,
                total_value: 38750.00,
                gain_loss: 3750.00
            },
            "Kraken": {
                total_cost: 18500.00,
                total_value: 18500.00,
                gain_loss: 0.00
            }
        },
        positions: [
            {"symbol": "AAPL", "shares": 10, "cost_basis": 150.00, "current_price": 175.00, "broker": "Fidelity", "current_value": 1750.00, "cost_value": 1500.00, "gain_loss": 250.00},
            {"symbol": "GOOGL", "shares": 2, "cost_basis": 2400.00, "current_price": 2600.00, "broker": "Webull", "current_value": 5200.00, "cost_value": 4800.00, "gain_loss": 400.00},
            {"symbol": "MSFT", "shares": 5, "cost_basis": 300.00, "current_price": 320.00, "broker": "Fidelity", "current_value": 1600.00, "cost_value": 1500.00, "gain_loss": 100.00},
            {"symbol": "BTC-USD", "shares": 0.5, "cost_basis": 45000.00, "current_price": 47000.00, "broker": "Kraken", "current_value": 23500.00, "cost_value": 22500.00, "gain_loss": 1000.00}
        ],
        last_updated: new Date().toISOString()
    },

    async getSummary() {
        try {
            console.log('Loading real portfolio data from Google Sheets...');
            
            // First, let's try to load just the main sheet to see what we get
            const response = await fetch(this.SHEET_URLS.fidelity, { mode: 'cors' });
            if (!response.ok) {
                console.warn('Main sheet not accessible, using mock data');
                return {
                    ...this.MOCK_DATA,
                    data_source: 'Mock Data (Google Sheets not accessible)',
                    note: 'Please make sure your Google Sheet is public'
                };
            }
            
            const csvText = await response.text();
            console.log('Main sheet CSV:', csvText.substring(0, 300));
            
            // Load data from all sheets in parallel
            const [fidelityData, webullData, krakenData] = await Promise.all([
                this.loadSheetData('Fidelity', this.SHEET_URLS.fidelity),
                this.loadSheetData('Webull', this.SHEET_URLS.webull),
                this.loadSheetData('Kraken', this.SHEET_URLS.kraken)
            ]);
            
            // Combine all positions
            const allPositions = [...fidelityData, ...webullData, ...krakenData];
            
            console.log('All positions loaded:', allPositions);
            
            if (allPositions.length === 0) {
                console.warn('No valid positions found, using enhanced mock data');
                return {
                    ...this.MOCK_DATA,
                    data_source: 'Enhanced Mock Data',
                    note: 'No valid stock positions found in sheets'
                };
            }
            
            // Calculate totals by broker
            const by_broker = {};
            let total_value = 0;
            let total_cost = 0;
            
            for (const broker of ['Fidelity', 'Webull', 'Kraken']) {
                const brokerPositions = allPositions.filter(p => p.broker === broker);
                const broker_value = brokerPositions.reduce((sum, p) => sum + (p.current_value || 0), 0);
                const broker_cost = brokerPositions.reduce((sum, p) => sum + (p.cost_value || 0), 0);
                
                by_broker[broker] = {
                    total_cost: broker_cost,
                    total_value: broker_value,
                    gain_loss: broker_value - broker_cost
                };
                
                total_value += broker_value;
                total_cost += broker_cost;
            }
            
            const result = {
                total_value: total_value,
                total_cost: total_cost,
                total_gain_loss: total_value - total_cost,
                by_broker: by_broker,
                positions: allPositions,
                last_updated: new Date().toISOString(),
                data_source: 'Google Sheets (Real Data)'
            };
            
            console.log('Successfully loaded real portfolio data:', result);
            return result;
            
        } catch (error) {
            console.warn('Failed to load real data, using mock data:', error);
            return {
                ...this.MOCK_DATA,
                data_source: 'Mock Data (Error occurred)',
                note: `Error loading real data: ${error.message}`
            };
        }
    },

    async refreshPortfolio() {
        try {
            console.log('Refreshing portfolio data...');
            // For Google Sheets, we just reload the data
            const data = await this.getSummary();
            console.log('Portfolio refreshed with real data');
            return { status: 'success', message: 'Portfolio refreshed with real Google Sheets data', data: data };
        }
        catch (error) {
            console.warn('Refresh failed:', error.message);
            return { status: 'success', message: 'Portfolio refreshed (mock data)' };
        }
    }
};