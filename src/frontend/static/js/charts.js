const Charts = {
    allocationChart: null,
    brokerChart: null,

    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
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
                        backgroundColor: [
                            '#FF6384',
                            '#36A2EB',
                            '#FFCE56',
                            '#4BC0C0',
                            '#9966FF'
                        ]
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
                this.allocationChart.data.labels = symbols;
                this.allocationChart.data.datasets[0].data = values;
                this.allocationChart.update();
            }
        } else if (this.allocationChart && data.by_broker) {
            // Fallback to broker data if positions not available
            console.log('Using broker data as fallback for allocation chart');
            const brokerData = data.by_broker;
            const brokerNames = Object.keys(brokerData);
            const brokerValues = Object.values(brokerData).map(broker => broker.total_value);
            
            this.allocationChart.data.labels = brokerNames;
            this.allocationChart.data.datasets[0].data = brokerValues;
            this.allocationChart.update();
        }
        
        console.log('Charts update completed');
    }
};