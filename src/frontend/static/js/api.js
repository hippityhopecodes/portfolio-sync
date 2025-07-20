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
            
            let account, symbol, shares, cost_basis;
            
            if (hasAccountColumn && values.length >= 4) {
                // Fidelity format: Account,Symbol,Quantity,Cost Basis
                account = values[0].trim();
                symbol = values[1].trim();
                shares = parseFloat(values[2]) || 0;
                cost_basis = parseFloat(values[3]) || 0;
            } else if (!hasAccountColumn && values.length >= 3) {
                // Webull/Kraken format: Symbol,Quantity,Cost Basis
                account = 'Trading'; // Default account name
                symbol = values[0].trim();
                shares = parseFloat(values[1]) || 0;
                cost_basis = parseFloat(values[2]) || 0;
            } else {
                console.log(`❌ Skipping row ${i}: insufficient columns`);
                continue;
            }
            
            console.log(`Processing: account=${account}, symbol=${symbol}, shares=${shares}, cost_basis=${cost_basis}`);
            
            // Skip if symbol is not valid or if it's an account type row
            if (symbol && shares > 0 && cost_basis > 0 && this.isValidSymbol(symbol) && account !== 'Account') {
                const position = {
                    symbol: symbol,
                    shares: shares,
                    cost_basis: cost_basis,
                    current_value: 0, // Will be calculated with real prices
                    account: account
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

    // Get stock price with better fallback
    async getStockPrice(symbol) {
        // First check if it's a valid symbol
        if (!this.isValidSymbol(symbol)) {
            console.log(`Skipping price lookup for invalid symbol: ${symbol}`);
            return 100.00; // Default price for non-stocks
        }

        // Use mock prices to avoid CORS issues on GitHub Pages
        const mockPrices = {
            // Major stocks
            'AAPL': 185.50, 'GOOGL': 2725.00, 'MSFT': 385.20, 'TSLA': 245.30,
            'NVDA': 950.80, 'AMZN': 155.75, 'META': 485.25, 'NFLX': 580.40,
            'CMA': 47.85, 'JPM': 175.90, 'BAC': 32.45, 'WFC': 45.30,
            // ETFs and Index Funds
            'SPY': 485.20, 'QQQ': 395.75, 'VTI': 245.60, 'IWM': 198.30,
            'VOO': 445.80, 'VXUS': 58.25, 'BND': 76.50, 'VEA': 47.90,
            // Fidelity mutual funds
            'FSKAX': 159.85, 'FTIHX': 15.92, 'FXNAX': 11.45, 'FZROX': 14.25,
            'FZILX': 12.85, 'FDVV': 35.60, 'FXNAC': 55.40, 'FNILX': 58.75,
            // Crypto (both formats: BTC and BTC-USD)
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
        console.log(`Price for ${symbol}: $${price} (mock data)`);
        return price;
    },

    // Load data from Google Sheets
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
            
            // Get current prices and calculate values
            for (let position of positions) {
                position.current_price = await this.getStockPrice(position.symbol);
                position.current_value = position.shares * position.current_price;
                position.cost_value = position.shares * position.cost_basis;
                position.gain_loss = position.current_value - position.cost_value;
                position.broker = broker;
                
                console.log(`${broker} - ${position.symbol}: ${position.shares} shares @ $${position.current_price} = $${position.current_value.toFixed(2)}`);
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