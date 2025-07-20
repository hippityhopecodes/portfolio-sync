const API = {
    BASE_URL: 'http://localhost:8000/api',

    async getSummary() {
        try {
            const response = await fetch(`${this.BASE_URL}/portfolio/summary`);
            if (!response.ok) {
                throw new Error('Failed to fetch summary');
            }
            return await response.json();
        }
        catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async refreshPortfolio() {
        try {
            const response = await fetch(`${this.BASE_URL}/portfolio/refresh`, {
                method: 'POST',
            });
            if (!response.ok) {
                throw new Error('Failed to refresh portfolio');
            }
            return await response.json();
        }
        catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }
};