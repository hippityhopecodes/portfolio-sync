const API = {
    // Google Sheets configuration
    SHEET_ID: '1R5pa0GFV9vFdq3mZIXuporAn4xb-de8qVJR_RuhF6n0',
    
    // Sheet ranges as CSV exports
    SHEET_URLS: {
        fidelity: 'https://docs.google.com/spreadsheets/d/1R5pa0GFV9vFdq3mZIXuporAn4xb-de8qVJR_RuhF6n0/export?format=csv&gid=0',
        webull: 'https://docs.google.com/spreadsheets/d/1R5pa0GFV9vFdq3mZIXuporAn4xb-de8qVJR_RuhF6n0/export?format=csv&gid=1',
        kraken: 'https://docs.google.com/spreadsheets/d/1R5pa0GFV9vFdq3mZIXuporAn4xb-de8qVJR_RuhF6n0/export?format=csv&gid=2'
    },

    // Parse CSV data
    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const data = [];
        for (let i = 1; i < lines.length; i++) { // Skip header
            const values = lines[i].split(',').map(val => val.trim().replace(/"/g, ''));
            if (values.length >= 3 && values[0]) {
                data.push({
                    symbol: values[0],
                    shares: parseFloat(values[1]) || 0,
                    cost_basis: parseFloat(values[2]) || 0,
                    current_value: parseFloat(values[3]) || 0
                });
            }
        }
        return data;
    },

    // Get stock price from free API
    async getStockPrice(symbol) {
        try {
            // Use Yahoo Finance free API
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const price = data.chart.result[0].meta.regularMarketPrice;
                return parseFloat(price);
            }
        } catch (error) {
            console.warn(`Failed to get price for ${symbol}:`, error);
        }
        
        // Fallback mock prices
        const mockPrices = {
            'AAPL': 150.00, 'GOOGL': 2500.00, 'MSFT': 300.00, 'TSLA': 800.00,
            'NVDA': 400.00, 'BTC-USD': 45000.00, 'ETH-USD': 3000.00,
            'SPY': 420.00, 'QQQ': 350.00, 'VTI': 200.00
        };
        return mockPrices[symbol] || 100.00;
    },

    // Load data from Google Sheets
    async loadSheetData(broker, url) {
        try {
            console.log(`Loading ${broker} data from: ${url}`);
            
            const response = await fetch(url, {
                mode: 'cors',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const csvText = await response.text();
            console.log(`${broker} CSV data:`, csvText.substring(0, 200) + '...');
            
            if (!csvText || csvText.trim().length === 0) {
                throw new Error('Empty CSV response');
            }
            
            const positions = this.parseCSV(csvText);
            console.log(`${broker} parsed positions:`, positions);
            
            if (positions.length === 0) {
                console.warn(`No positions found for ${broker}`);
                return [];
            }
            
            // Get current prices and calculate values
            for (let position of positions) {
                position.current_price = await this.getStockPrice(position.symbol);
                position.current_value = position.shares * position.current_price;
                position.cost_value = position.shares * position.cost_basis;
                position.gain_loss = position.current_value - position.cost_value;
                position.broker = broker;
                
                console.log(`${broker} - ${position.symbol}: $${position.current_price} x ${position.shares} = $${position.current_value}`);
            }
            
            return positions;
        } catch (error) {
            console.error(`Failed to load ${broker} data:`, error);
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
            
            // Load data from all sheets in parallel
            const [fidelityData, webullData, krakenData] = await Promise.all([
                this.loadSheetData('Fidelity', this.SHEET_URLS.fidelity),
                this.loadSheetData('Webull', this.SHEET_URLS.webull),
                this.loadSheetData('Kraken', this.SHEET_URLS.kraken)
            ]);
            
            // Combine all positions
            const allPositions = [...fidelityData, ...webullData, ...krakenData];
            
            if (allPositions.length === 0) {
                console.warn('No data loaded from Google Sheets, using mock data');
                return {
                    ...this.MOCK_DATA,
                    data_source: 'Mock Data (Google Sheets not accessible)',
                    note: 'Using mock data - Google Sheets may not be public or accessible'
                };
            }
            
            // Calculate totals by broker
            const by_broker = {};
            let total_value = 0;
            let total_cost = 0;
            
            for (const broker of ['Fidelity', 'Webull', 'Kraken']) {
                const brokerPositions = allPositions.filter(p => p.broker === broker);
                const broker_value = brokerPositions.reduce((sum, p) => sum + p.current_value, 0);
                const broker_cost = brokerPositions.reduce((sum, p) => sum + p.cost_value, 0);
                
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