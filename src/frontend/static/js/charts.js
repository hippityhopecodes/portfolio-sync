/**
 * Portfolio Sync Charts Module
 * 
 * Handles Chart.js initialization and updates for portfolio visualization.
 * Creates responsive allocation and broker breakdown charts with real-time data.
 */

const Charts = {
    allocationChart: null,
    brokerChart: null,

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    },

    // Generate distinct colors for portfolio assets
    getColorPalette(count) {
        const colors = [
            '#FF6384',  // Red/Pink - FSKAX
            '#36A2EB',  // Blue - FTIHX  
            '#FFCE56',  // Yellow - NVDA
            '#4BC0C0',  // Teal - BTC
            '#9966FF',  // Purple - ETH
            '#FF9F40',  // Orange - XRP
            '#FF6384',  // Red variant
            '#C9CBCF',  // Gray
            '#4BC0C0',  // Teal variant
            '#FF8C94',  // Light red
            '#A8E6CF', // Light green
            '#FFD93D', // Bright yellow
            '#6BCF7F', // Green
            '#FF6B6B', // Coral
            '#4ECDC4', // Turquoise
            '#45B7D1', // Sky blue
            '#96CEB4', // Mint
            '#FECA57', // Gold
            '#48CAE4', // Light blue
            '#F38BA8'  // Pink
        ];
        
        // If we need more colors than predefined, generate them
        while (colors.length < count) {
            const hue = (colors.length * 137.508) % 360; // Golden angle approximation
            colors.push(`hsl(${hue}, 70%, 60%)`);
        }
        
        return colors.slice(0, count);
    },

    initializeCharts() {
        console.log('Initializing charts...');
        
        try {
            // Check if Chart.js is loaded
            if (typeof Chart === 'undefined') {
                console.error('Chart.js library not loaded');
                return;
            }
            
            // Check if canvas elements exist
            const allocationCanvas = document.getElementById('allocationChart');
            const brokerCanvas = document.getElementById('brokerChart');
            
            if (!allocationCanvas) {
                console.error('allocationChart canvas not found');
                return;
            }
            
            if (!brokerCanvas) {
                console.error('brokerChart canvas not found');
                return;
            }
            
            console.log('Creating allocation chart...');
            this.allocationChart = new Chart(allocationCanvas, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [] // Will be set dynamically in updateCharts
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
            console.log('Allocation chart created successfully');

            console.log('Creating broker chart...');
            this.brokerChart = new Chart(brokerCanvas, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Portfolio Value',
                        data: [],
                        backgroundColor: '#36A2EB'
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: (value) => this.formatCurrency(value)
                            }
                        }
                    }
                }
            });
            console.log('Broker chart created successfully');
            console.log('Charts initialization completed');
            
        } catch (error) {
            console.error('Error initializing charts:', error);
        }
    },

    updateCharts(data) {
        console.log('Updating charts with data:', data);
        
        // Update broker distribution chart
        if (this.brokerChart && data.by_broker) {
            const brokerData = data.by_broker;
            const brokerNames = Object.keys(brokerData);
            const brokerValues = Object.values(brokerData).map(broker => broker.total_value);
            
            console.log('Updating broker chart:', brokerNames, brokerValues);
            
            this.brokerChart.data.labels = brokerNames;
            this.brokerChart.data.datasets[0].data = brokerValues;
            this.brokerChart.update();
        }

        // Update allocation chart using individual positions
        if (this.allocationChart && data.positions && data.positions.length > 0) {
            const positions = data.positions;
            
            // Filter out positions with zero or very small values
            const significantPositions = positions.filter(p => (p.current_value || p.market_value) > 1);
            
            const symbols = significantPositions.map(p => p.symbol);
            const values = significantPositions.map(p => p.current_value || p.market_value || 0);
            
            console.log('Updating allocation chart:', symbols, values);
            
            if (symbols.length > 0) {
                // Generate distinct colors for each position
                const colors = this.getColorPalette(symbols.length);
                
                this.allocationChart.data.labels = symbols;
                this.allocationChart.data.datasets[0].data = values;
                this.allocationChart.data.datasets[0].backgroundColor = colors;
                this.allocationChart.update();
            }
        } else if (this.allocationChart && data.by_broker) {
            // Fallback to broker data if positions not available
            console.log('Using broker data as fallback for allocation chart');
            const brokerData = data.by_broker;
            const brokerNames = Object.keys(brokerData);
            const brokerValues = Object.values(brokerData).map(broker => broker.total_value);
            
            // Generate colors for broker chart too
            const colors = this.getColorPalette(brokerNames.length);
            
            this.allocationChart.data.labels = brokerNames;
            this.allocationChart.data.datasets[0].data = brokerValues;
            this.allocationChart.data.datasets[0].backgroundColor = colors;
            this.allocationChart.update();
        }
        
        console.log('Charts update completed');
    }
};