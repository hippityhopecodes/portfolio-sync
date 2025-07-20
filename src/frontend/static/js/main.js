document.addEventListener('DOMContentLoaded', () => {
    // Initialize charts
    Charts.initializeCharts();

    // Initialize theme
    const isDarkTheme = localStorage.getItem('dark-theme') === 'true';
    document.body.classList.toggle('dark-theme', isDarkTheme);

    // Formatting functions for currency & percentages
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(value);
    };
    const formatPercentage = (value) => {
        return new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
        }).format(value / 100);
    };

    // Update UI with portfolio data
    const updateUI = (data) => {
        // Update summary cards
        document.querySelector('#total-value').textContent = formatCurrency(data.total_value);
        document.querySelector('#total-cost').textContent = formatCurrency(data.total_cost);
        document.querySelector('#total-gain').textContent = formatCurrency(data.total_gain);

        // Update broker breakdown
        const brokerContainer = document.getElementById('broker-breakdown');
        brokerContainer.innerHTML = ''; // Clear existing content

        Object.entries(data.by_broker).forEach(([broker, info]) => {
            const gainsLossPercent = (info.gain_loss / info.total_cost * 100);
            brokerContainer.innerHTML += `
                <div class="card">
                    <h3>${broker}</h3>
                    <p class="value">${formatCurrency(info.total_value)}</p>
                    <p class="change ${gainsLossPercent >= 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(info.gain_loss)} (${formatPercentage(gainsLossPercent)})
                    </p>
                </div>
            `;
        });

        // Update charts
        Charts.updateCharts(data);

        // Update last updated time
        document.getElementById('last-updated').textContent = new Date().toLocaleString();
    };

    // Fetch and update portfolio data
    const refreshData = async () => {
        try {
            const data = await API.getSummary();
            updateUI(data);
        }
        catch (error) {
            console.error('Failed to fetch data:', error);
            alert('Failed to update portfolio data');
        }
    };

    // Event listeners
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        try {
            await API.refreshPortfolio();
            await refreshData();
        }
        catch (error) {
            console.error('Failed to refresh portfolio:', error);
            alert('Failed to refresh portfolio');
        }
    });

    document.getElementById('themeSwitch').addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('dark-theme', isDark);
    });

    // Initial data fetch
    refreshData();

    // Auto refresh every 5 minutes
    setInterval(refreshData, 5 * 60 * 1000);
});