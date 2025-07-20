const API = {
    BASE_URL: 'http://localhost:8000/api',

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
            // Try live API first
            const response = await fetch(`${this.BASE_URL}/portfolio/summary`);
            if (!response.ok) {
                throw new Error('Failed to fetch summary');
            }
            return await response.json();
        }
        catch (error) {
            console.warn('Live API not available, using mock data:', error);
            // Return mock data for GitHub Pages demo
            return this.MOCK_DATA;
        }
    },

    async refreshPortfolio() {
        try {
            // Try live API first
            const response = await fetch(`${this.BASE_URL}/portfolio/refresh`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to refresh portfolio');
            }
            return await response.json();
        }
        catch (error) {
            console.warn('Live API not available, using mock refresh:', error);
            // Return success for mock refresh
            return { status: 'success', message: 'Portfolio refreshed (mock)' };
        }
    }
};