const API = {
    // Automatically detect environment
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://127.0.0.1:8000/api'  // Local development
        : 'https://investment-portfolio-sync.vercel.app/api',

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
        last_updated: new Date().toISOString()
    },

    async getSummary() {
        try {
            // Try live API first (for when backend is running)
            const response = await fetch(`${this.BASE_URL}/portfolio/summary`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Using live API data');
            return data;
        }
        catch (error) {
            console.warn('Live API not available, using mock data:', error.message);
            // Return mock data for GitHub Pages demo
            return this.MOCK_DATA;
        }
    },

    async refreshPortfolio() {
        try {
            // Try live API first (for when backend is running)
            const response = await fetch(`${this.BASE_URL}/portfolio/refresh`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            console.log('Portfolio refreshed via live API');
            return data;
        }
        catch (error) {
            console.warn('Live API not available for refresh:', error.message);
            // Return success for mock refresh
            return { status: 'success', message: 'Portfolio refreshed (mock)' };
        }
    }
};