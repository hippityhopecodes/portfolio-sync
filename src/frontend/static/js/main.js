document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...'); // Debug log
    
    // Initialize charts if Charts is available
    if (typeof Charts !== 'undefined' && Charts.initializeCharts) {
        try {
            Charts.initializeCharts();
            console.log('Charts initialized successfully'); // Debug log
        } catch (error) {
            console.warn('Failed to initialize charts:', error);
        }
    } else {
        console.warn('Charts module not available');
    }

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
        console.log('Received data:', data); // Debug log
        
        try {
            // Update summary cards - fixed IDs to match HTML
            const totalValueElement = document.querySelector('#totalValue .value');
            const totalCostElement = document.querySelector('#totalCost .value');
            const totalGainElement = document.querySelector('#totalGain .value');
            
            console.log('Elements found:', { totalValueElement, totalCostElement, totalGainElement }); // Debug log
            
            if (totalValueElement) totalValueElement.textContent = formatCurrency(data.total_value);
            if (totalCostElement) totalCostElement.textContent = formatCurrency(data.total_cost);
            if (totalGainElement) totalGainElement.textContent = formatCurrency(data.total_gain_loss);
            
            // Update gain/loss percentage
            const gainLossPercent = (data.total_gain_loss / data.total_cost * 100);
            const gainElement = document.querySelector('#totalGain .change');
            if (gainElement) {
                gainElement.textContent = formatPercentage(gainLossPercent);
                gainElement.className = `change ${gainLossPercent >= 0 ? 'positive' : 'negative'}`;
            }

            // Update broker breakdown - fixed ID to match HTML
            const brokerContainer = document.getElementById('brokerBreakdown');
            console.log('Broker container found:', brokerContainer); // Debug log
            
            if (brokerContainer) {
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
            }

            // Update charts
            if (typeof Charts !== 'undefined' && Charts.updateCharts) {
                Charts.updateCharts(data);
            }

            // Update last updated time - fixed ID to match HTML
            const lastUpdatedElement = document.getElementById('lastUpdated');
            if (lastUpdatedElement) {
                lastUpdatedElement.textContent = new Date().toLocaleString();
            }
            
            console.log('UI update completed successfully'); // Debug log
            
        } catch (error) {
            console.error('Error updating UI:', error);
            throw error; // Re-throw to be caught by the outer catch
        }
    };

    // Fetch and update portfolio data
    const refreshData = async () => {
        try {
            console.log('Fetching portfolio data...'); // Debug log
            const data = await API.getSummary();
            console.log('Data fetched successfully:', data); // Debug log
            updateUI(data);
        }
        catch (error) {
            console.error('Failed to fetch data:', error);
            // Show more specific error message
            alert(`Failed to update portfolio data: ${error.message}`);
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