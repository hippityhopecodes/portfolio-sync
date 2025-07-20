/**
 * Portfolio Sync Main Application
 * 
 * Handles UI initialization, data fetching, DOM updates, and user interactions.
 * Coordinates between the API module and Charts module to display portfolio data.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // Initialize charts if Charts is available
    if (typeof Charts !== 'undefined' && Charts.initializeCharts) {
        try {
            Charts.initializeCharts();
            console.log('Charts initialized successfully');
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
        console.log('updateUI called with data:', data);
        
        try {
            // Simple direct updates without complex selectors
            const totalValueCard = document.getElementById('totalValue');
            const totalCostCard = document.getElementById('totalCost');
            const totalGainCard = document.getElementById('totalGain');
            
            console.log('Found cards:', { totalValueCard, totalCostCard, totalGainCard });
            
            if (totalValueCard) {
                const valueElement = totalValueCard.querySelector('.value');
                if (valueElement) {
                    valueElement.textContent = formatCurrency(data.total_value);
                    console.log('Updated total value to:', formatCurrency(data.total_value));
                }
            }
            
            if (totalCostCard) {
                const valueElement = totalCostCard.querySelector('.value');
                if (valueElement) {
                    valueElement.textContent = formatCurrency(data.total_cost);
                    console.log('Updated total cost to:', formatCurrency(data.total_cost));
                }
            }
            
            if (totalGainCard) {
                const valueElement = totalGainCard.querySelector('.value');
                const changeElement = totalGainCard.querySelector('.change');
                if (valueElement) {
                    valueElement.textContent = formatCurrency(data.total_gain_loss);
                    console.log('Updated total gain to:', formatCurrency(data.total_gain_loss));
                }
                if (changeElement) {
                    const gainLossPercent = (data.total_gain_loss / data.total_cost * 100);
                    changeElement.textContent = formatPercentage(gainLossPercent);
                    changeElement.className = `change ${gainLossPercent >= 0 ? 'positive' : 'negative'}`;
                    console.log('Updated gain percentage to:', formatPercentage(gainLossPercent));
                }
            }

            // Update broker breakdown
            const brokerContainer = document.getElementById('brokerBreakdown');
            console.log('Broker container found:', brokerContainer);
            
            if (brokerContainer && data.by_broker) {
                brokerContainer.innerHTML = ''; // Clear existing content
                
                Object.entries(data.by_broker).forEach(([broker, info]) => {
                    const gainsLossPercent = (info.gain_loss / info.total_cost * 100);
                    const brokerCard = document.createElement('div');
                    brokerCard.className = 'card';
                    brokerCard.innerHTML = `
                        <h3>${broker}</h3>
                        <p class="value">${formatCurrency(info.total_value)}</p>
                        <p class="change ${gainsLossPercent >= 0 ? 'positive' : 'negative'}">
                            ${formatCurrency(info.gain_loss)} (${formatPercentage(gainsLossPercent)})
                        </p>
                    `;
                    brokerContainer.appendChild(brokerCard);
                });
                console.log('Added broker cards:', Object.keys(data.by_broker));
            }

            // Update last updated time
            const lastUpdatedElement = document.getElementById('lastUpdated');
            if (lastUpdatedElement) {
                lastUpdatedElement.textContent = new Date().toLocaleString();
                console.log('Updated last updated time');
            }
            
            console.log('UI update completed successfully');
            
            // Update charts if Charts module is available
            if (typeof Charts !== 'undefined' && Charts.updateCharts) {
                try {
                    Charts.updateCharts(data);
                    console.log('Charts updated successfully');
                } catch (error) {
                    console.error('Failed to update charts:', error);
                }
            } else {
                console.warn('Charts module not available for updates');
            }
            
        } catch (error) {
            console.error('Error in updateUI:', error);
            throw error;
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
    console.log('Starting initial data fetch...');
    refreshData();

    // Add a test function to global scope for debugging
    window.testUpdate = () => {
        console.log('Manual test triggered');
        refreshData();
    };

    // Auto refresh every 5 minutes
    setInterval(refreshData, 5 * 60 * 1000);
});