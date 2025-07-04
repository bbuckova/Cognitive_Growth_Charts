/**
 * Chart Management Module
 * Handles chart creation, interaction, and cross-chart highlighting
 */

class ChartManager {
    constructor() {
        this.highlightedSubject = null;
        this.charts = new Map();
        this.chartConfig = {
            chart1: { title: 'Age vs Performance', containerId: 'chart1' },
            chart2: { title: 'Education vs Performance', containerId: 'chart2' },
            chart3: { title: 'Model Residuals', containerId: 'chart3' },
            chart4: { title: 'Predicted vs Actual', containerId: 'chart4' }
        };
    }

    /**
     * Create the charts grid HTML
     */
    createChartsGrid() {
        const grid = document.createElement('div');
        grid.className = 'charts-grid';
        grid.innerHTML = `
            <div class="chart-container">
                <div class="chart-title">Age vs Performance</div>
                <div id="chart1" class="chart"></div>
            </div>
            <div class="chart-container">
                <div class="chart-title">Education vs Performance</div>
                <div id="chart2" class="chart"></div>
            </div>
            <div class="chart-container">
                <div class="chart-title">Model Residuals</div>
                <div id="chart3" class="chart"></div>
            </div>
            <div class="chart-container">
                <div class="chart-title">Predicted vs Actual</div>
                <div id="chart4" class="chart"></div>
            </div>
        `;
        return grid;
    }

    /**
     * Load and display charts for a measure
     * @param {string} measureName - Name of the measure
     */
    async loadCharts(measureName) {
        try {
            const data = await dataManager.loadMeasure(measureName);
            
            // Create all four charts
            Object.keys(this.chartConfig).forEach(chartKey => {
                const chartData = data[chartKey];
                const config = this.chartConfig[chartKey];
                
                if (chartData && config) {
                    this.createChart(config.containerId, chartData, config.title);
                }
            });

            // Store reference for exports
            this.charts.set(measureName, data);
            
        } catch (error) {
            console.error('Error loading charts:', error);
            this.showError('Failed to load chart data');
        }
    }

    /**
     * Create individual chart
     * @param {string} containerId - ID of the container element
     * @param {Object} data - Chart data
     * @param {string} title - Chart title
     */
    createChart(containerId, data, title) {
        const trace = {
            x: data.x,
            y: data.y,
            mode: 'markers',
            type: 'scatter',
            name: data.name || title,
            marker: {
                size: 8,
                color: '#4f46e5',
                line: {
                    color: '#ffffff',
                    width: 1
                }
            },
            subjects: data.subjects,
            hovertemplate: '<b>Subject: %{customdata}</b><br>' +
                          'X: %{x}<br>' +
                          'Y: %{y}<br>' +
                          '<extra></extra>',
            customdata: data.subjects
        };

        const layout = {
            margin: { l: 50, r: 40, t: 20, b: 50 },
            showlegend: false,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: {
                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                size: 12
            },
            xaxis: {
                gridcolor: 'rgba(0,0,0,0.1)',
                zeroline: false,
                title: this.getXAxisTitle(containerId)
            },
            yaxis: {
                gridcolor: 'rgba(0,0,0,0.1)',
                zeroline: false,
                title: this.getYAxisTitle(containerId)
            }
        };

        const config = {
            responsive: true,
            displayModeBar: false
        };

        Plotly.newPlot(containerId, [trace], layout, config);
        
        // Add hover events for cross-chart highlighting
        this.addHoverEvents(containerId);
    }

    /**
     * Add hover events to a chart for cross-highlighting
     * @param {string} containerId - ID of the container element
     */
    addHoverEvents(containerId) {
        const plotElement = document.getElementById(containerId);
        
        plotElement.on('plotly_hover', (eventData) => {
            const pointIndex = eventData.points[0].pointIndex;
            const subject = eventData.points[0].customdata;
            this.highlightSubjectInAllCharts(subject);
        });
        
        plotElement.on('plotly_unhover', () => {
            this.clearHighlights();
        });
    }

    /**
     * Highlight a subject across all charts
     * @param {string} subject - Subject ID to highlight
     */
    highlightSubjectInAllCharts(subject) {
        console.log('Highlighting subject:', subject);
        this.highlightedSubject = subject;
        
        const chartIds = ['chart1', 'chart2', 'chart3', 'chart4'];
        chartIds.forEach(chartId => {
            const element = document.getElementById(chartId);
            if (element && element.data && element.data[0]) {
                const subjectIndex = element.data[0].subjects.indexOf(subject);
                if (subjectIndex !== -1) {
                    const colors = element.data[0].subjects.map(s => 
                        s === subject ? '#ef4444' : '#4f46e5'
                    );
                    const sizes = element.data[0].subjects.map(s => 
                        s === subject ? 12 : 8
                    );
                    
                    const update = {
                        'marker.color': [colors],
                        'marker.size': [sizes]
                    };
                    
                    Plotly.restyle(chartId, update, 0);
                }
            }
        });
    }

    /**
     * Clear all highlights
     */
    clearHighlights() {
        if (!this.highlightedSubject) return;
        
        const chartIds = ['chart1', 'chart2', 'chart3', 'chart4'];
        chartIds.forEach(chartId => {
            const element = document.getElementById(chartId);
            if (element && element.data && element.data[0]) {
                const colors = new Array(element.data[0].x.length).fill('#4f46e5');
                const sizes = new Array(element.data[0].x.length).fill(8);
                
                const update = {
                    'marker.color': [colors],
                    'marker.size': [sizes]
                };
                Plotly.restyle(chartId, update, 0);
            }
        });
        
        this.highlightedSubject = null;
    }

    /**
     * Get appropriate X-axis title for chart
     * @param {string} containerId - Chart container ID
     * @returns {string} X-axis title
     */
    getXAxisTitle(containerId) {
        const titles = {
            'chart1': 'Age (years)',
            'chart2': 'Education (years)',
            'chart3': 'Subject Index',
            'chart4': 'Predicted Score'
        };
        return titles[containerId] || 'X Value';
    }

    /**
     * Get appropriate Y-axis title for chart
     * @param {string} containerId - Chart container ID
     * @returns {string} Y-axis title
     */
    getYAxisTitle(containerId) {
        const titles = {
            'chart1': 'Performance Score',
            'chart2': 'Performance Score',
            'chart3': 'Residuals',
            'chart4': 'Actual Score'
        };
        return titles[containerId] || 'Y Value';
    }

    /**
     * Export all charts as images
     */
    static exportImages() {
        const currentMeasure = dataManager.getCurrentMeasure();
        if (!currentMeasure) {
            alert('Please select a measure first.');
            return;
        }
        
        const chartIds = ['chart1', 'chart2', 'chart3', 'chart4'];
        chartIds.forEach((chartId, index) => {
            const element = document.getElementById(chartId);
            if (element && element.data) {
                setTimeout(() => {
                    Plotly.downloadImage(chartId, {
                        format: 'png',
                        width: 800,
                        height: 600,
                        filename: `${currentMeasure}_${chartId}`
                    });
                }, index * 500); // Stagger downloads
            }
        });
    }

    /**
     * Reset all charts to original view
     */
    static resetView() {
        const currentMeasure = dataManager.getCurrentMeasure();
        if (currentMeasure) {
            chartManager.clearHighlights();
            chartManager.loadCharts(currentMeasure);
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${message}
            </div>
        `;
    }

    /**
     * Show loading state
     */
    showLoading() {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <span style="margin-left: 10px;">Loading charts...</span>
            </div>
        `;
    }

    /**
     * Update chart titles for specific measure
     * @param {string} measureName - Name of the measure
     */
    updateChartTitles(measureName) {
        const measureTitles = {
            working_memory: {
                chart1: 'Age vs Working Memory',
                chart2: 'Education vs Working Memory',
                chart3: 'Working Memory Residuals',
                chart4: 'Predicted vs Actual WM'
            },
            attention: {
                chart1: 'Age vs Attention Score',
                chart2: 'Education vs Attention',
                chart3: 'Attention Residuals',
                chart4: 'Predicted vs Actual Attention'
            },
            executive_function: {
                chart1: 'Age vs Executive Function',
                chart2: 'Education vs Executive Function',
                chart3: 'Executive Function Residuals',
                chart4: 'Predicted vs Actual EF'
            },
            processing_speed: {
                chart1: 'Age vs Processing Speed',
                chart2: 'Education vs Processing Speed',
                chart3: 'Processing Speed Residuals',
                chart4: 'Predicted vs Actual PS'
            },
            verbal_fluency: {
                chart1: 'Age vs Verbal Fluency',
                chart2: 'Education vs Verbal Fluency',
                chart3: 'Verbal Fluency Residuals',
                chart4: 'Predicted vs Actual VF'
            },
            memory_recall: {
                chart1: 'Age vs Memory Recall',
                chart2: 'Education vs Memory Recall',
                chart3: 'Memory Recall Residuals',
                chart4: 'Predicted vs Actual Memory'
            }
        };

        const titles = measureTitles[measureName];
        if (titles) {
            Object.keys(titles).forEach(chartKey => {
                const titleElement = document.querySelector(`#${chartKey}`).parentNode.querySelector('.chart-title');
                if (titleElement) {
                    titleElement.textContent = titles[chartKey];
                }
            });
        }
    }

    /**
     * Cleanup charts when switching measures
     */
    cleanup() {
        const chartIds = ['chart1', 'chart2', 'chart3', 'chart4'];
        chartIds.forEach(chartId => {
            const element = document.getElementById(chartId);
            if (element) {
                Plotly.purge(chartId);
            }
        });
        this.highlightedSubject = null;
    }
}

// Create global instance
const chartManager = new ChartManager();