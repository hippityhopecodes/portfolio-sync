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
        this.allocationChart = new Chart(
            document.getElementById('allocationChart'),
            {
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
            }
        );

        this.brokerChart = new Chart(
            document.getElementById('brokerChart'),
            {
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
                                callback: value => this.formatCurrency(value)
                            }
                        }
                    }
                }
            }
        );
    },

    updateCharts(data) {
        // Update broker distribution chart
        const brokerData = data.by_broker;
        this.brokerChart.data.labels = Object.keys(brokerData);
        this.brokerChart.data.datasets[0].data = Object.values(brokerData)
            .map(broker => broker.total_value);
        this.brokerChart.update();

        // Update allocation chart (if you have position-level data)
        if (data.positions) {
            const positions = data.positions;
            this.allocationChart.data.labels = positions.map(p => p.symbol);
            this.allocationChart.data.datasets[0].data = positions.map(p => p.market_value);
            this.allocationChart.update();
        }
    }
};