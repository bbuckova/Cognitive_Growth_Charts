/**
 * Chart Management Module - Upgraded for Normative Models Dashboard
 * Handles creation of 4-panel dashboard with interactive filtering
 */

class ChartManager {
    constructor() {
        this.highlightedSubject = null;
        this.charts = new Map();
        this.colors = ['#39c0ba', '#f35b6a', '#fbb2b9', '#e2e7ee', '#2e3037'];
        this.chartConfig = {
            chart1: { title: 'Raw Score vs Age', containerId: 'chart1' },
            chart2: { title: 'Harmonized Score vs Age with Centiles', containerId: 'chart2' },
            chart3: { title: 'Q-Q Plot', containerId: 'chart3' },
            chart4: { title: 'Z-Score Distribution', containerId: 'chart4' }
        };
    }

    /**
     * Create the charts grid HTML with filter controls
     */
    createChartsGrid() {
        const grid = document.createElement('div');
        grid.innerHTML = `
                <!-- Filter Controls -->
                <div id="filter-controls" style="
                    margin-bottom: 20px; 
                    padding: 15px; 
                    background: rgba(255, 255, 255, 0.9); 
                    border-radius: 10px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                ">
                    <h4 style="
                        margin: 0 0 12px 0; 
                        color: #374151; 
                        font-size: 16px; 
                        font-weight: 600;
                    ">Show data harmonised by:</h4>
                    <div style="display: flex; gap: 15px; align-items: end;">
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #374151;">Sex:</label>
                    <select id="sex-filter" style="
                        padding: 8px 12px; 
                        border: 1px solid #d1d5db; 
                        border-radius: 6px; 
                        background: white;
                        font-size: 14px;
                        min-width: 120px;
                    ">
                        <!-- Options populated by JavaScript -->
                    </select>
                </div>
                <div>
                    <label style="display: block; font-weight: 600; margin-bottom: 5px; color: #374151;">Site:</label>
                    <select id="site-filter" style="
                        padding: 8px 12px; 
                        border: 1px solid #d1d5db; 
                        border-radius: 6px; 
                        background: white;
                        font-size: 14px;
                        min-width: 120px;
                    ">
                        <!-- Options populated by JavaScript -->
                    </select>
                </div>
                <div style="display: flex; align-items: end;">
                <button id="update-filters" class="control-btn" style="
                            padding: 8px 16px;
                            margin: 0;
                            font-size: 14px;
                        ">Update</button>
                    </div>
                </div>
            </div>
            
            <!-- Charts Grid -->
            <div class="charts-grid">
                <div class="chart-container">
                    <div class="chart-title">Raw Score vs Age</div>
                    <div id="chart1" class="chart"></div>
                </div>
                <div class="chart-container">
                    <div class="chart-title">Harmonized Score vs Age with Centiles</div>
                    <div id="chart2" class="chart"></div>
                </div>
                <div class="chart-container">
                    <div class="chart-title">Q-Q Plot</div>
                    <div id="chart3" class="chart"></div>
                </div>
                <div class="chart-container">
                    <div class="chart-title">Z-Score Distribution</div>
                    <div id="chart4" class="chart"></div>
                </div>
            </div>
        `;
        return grid;
    }

    /**
     * Load and display charts for a measure
     * @param {string} measureName - Name of the measure
     */
    async loadCharts(measureName) {
        const maxWait = 50; // 5 seconds max
        let attempts = 0;
        
        while (!document.getElementById('chart1') && attempts < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!document.getElementById('chart1')) {
            throw new Error('Chart containers were not created in time');
        }
        
        console.log('🚀 loadCharts called for:', measureName);
        try {
            // Setup filter controls first
            await this.setupFilterControls(measureName);
            
            const data = await dataManager.loadMeasure(measureName);
            
            // Create all four charts with real data
            this.createRawScatterChart(data.chart1, data.scale_name);
            this.createCentileChart(data.chart2);
            this.createQQChart(data.chart3);
            this.createHistogramChart(data.chart4);

            // Store reference for exports
            this.charts.set(measureName, data);
            
        } catch (error) {
            console.error('Error loading charts:', error);
            this.showError(`Failed to load ${measureName} data: ${error.message}`);
        }
    }

    /**
     * Setup filter controls
     * @param {string} measureName - Name of the measure
     */
    async setupFilterControls(measureName) {
        console.log('🎛️ Setting up filter controls for:', measureName);
        
        try {
            const filterOptions = await dataManager.getFilterOptions(measureName);
            console.log('📊 Filter options loaded:', filterOptions);
            
            const currentFilters = dataManager.getFilters();
            console.log('🔧 Current filters:', currentFilters);
            
            // Populate sex filter
            const sexFilter = document.getElementById('sex-filter');
            console.log('🔍 Sex filter element found:', sexFilter ? 'YES' : 'NO');
            
            if (!sexFilter) {
                console.error('❌ Sex filter element not found!');
                return;
            }
            
            sexFilter.innerHTML = filterOptions.sexes.map(sexOption => 
                `<option value="${sexOption.value}" ${sexOption.value === currentFilters.sex ? 'selected' : ''}>${sexOption.label}</option>`
            ).join('');
            
            // Populate site filter  
            const siteFilter = document.getElementById('site-filter');
            console.log('🔍 Site filter element found:', siteFilter ? 'YES' : 'NO');
            
            if (!siteFilter) {
                console.error('❌ Site filter element not found!');
                return;
            }
            
            siteFilter.innerHTML = filterOptions.sites.map(site => 
                `<option value="${site}" ${site === currentFilters.site ? 'selected' : ''}>${site}</option>`
            ).join('');
            
            // Add update button functionality
            const updateButton = document.getElementById('update-filters');
            console.log('🔧 Update button found:', updateButton ? 'YES' : 'NO');
            
            if (!updateButton) {
                console.error('❌ Update button not found!');
                return;
            }
            
            console.log('🔗 About to add event listener...');
            
            try {
                updateButton.addEventListener('click', () => {
                    console.log('🔘 UPDATE BUTTON CLICKED!');
                    
                    const newSex = isNaN(sexFilter.value) ? sexFilter.value : Number(sexFilter.value);
                    const newSite = siteFilter.value;
                    
                    console.log('Selected filters:', { newSex, newSite });
                    console.log('Current filters before update:', dataManager.getFilters());
                    
                    updateButton.textContent = 'Updating...';
                    updateButton.disabled = true;
                    
                    dataManager.setFilters(newSex, newSite);
                    console.log('Current filters after update:', dataManager.getFilters());
                    
                    this.loadCharts(measureName).finally(() => {
                        updateButton.textContent = 'Update';
                        updateButton.disabled = false;
                        console.log('✅ Filter update complete');
                    });
                });
                
                console.log('✅ Event listener added successfully');
                
            } catch (eventError) {
                console.error('❌ Error adding event listener:', eventError);
            }
            
            // Set default filters if not set
            if (!currentFilters.sex && filterOptions.sexes.length > 0) {
                console.log('🎯 Setting default filters');
                const defaultSex = filterOptions.sexes[0].value;  // ← Just get the value directly
                dataManager.setFilters(defaultSex, filterOptions.sites[0]);
                console.log('🎯 Default filters set:', dataManager.getFilters());
            }
            
        } catch (error) {
            console.error('❌ Error setting up filter controls:', error);
        }
    }

    /**
     * Create raw scatter chart (Chart 1: Age vs Raw Score)
     * @param {Object} chartData - Chart data
     * @param {string} scaleColumn - Name of the scale column
     */
    createRawScatterChart(chartData, scaleColumn) {
        const traces = [];
        const sites = Object.keys(chartData.sites_data);
        
        sites.forEach((site, index) => {
            const siteData = chartData.sites_data[site];
            const color = this.colors[index % this.colors.length];
            
            traces.push({
                x: siteData.map(d => d.Age),
                y: siteData.map(d => d[scaleColumn]),
                mode: 'markers',
                type: 'scatter',
                name: site,
                marker: {
                    size: 8,
                    color: color,
                    opacity: 0.7
                },
                hovertemplate: '<b>%{text}</b><br>Age: %{x:.1f}<br>Raw: %{y:.1f}<br>Site: ' + site + '<extra></extra>',
                text: siteData.map(d => d.subject_id || `S${d.Age?.toFixed(0)}_${site}`)
            });
        });

        const layout = {
            margin: { l: 60, r: 40, t: 20, b: 50 },
            showlegend: true,
            legend: { x: 1.02, y: 1, bgcolor: 'rgba(0,0,0,0)', borderwidth: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'white',
            font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 12 },
            xaxis: {
                title: 'Age (years)',
                showgrid: true,
                gridwidth: 1,
                gridcolor: 'rgba(189, 195, 199, 0.5)',
                zeroline: true,
                zerolinewidth: 1,
                zerolinecolor: 'rgba(189, 195, 199, 0.8)'
            },
            yaxis: {
                title: 'Raw Score',
                showgrid: true,
                gridwidth: 1,
                gridcolor: 'rgba(189, 195, 199, 0.5)',
                zeroline: true,
                zerolinewidth: 1,
                zerolinecolor: 'rgba(189, 195, 199, 0.8)'
            }
        };

        Plotly.newPlot('chart1', traces, layout, { responsive: true, displayModeBar: false });
        this.addHoverEvents('chart1');
    }

    /**
     * Create centile chart (Chart 2: Age vs Harmonized Score with centile lines)
     * @param {Object} chartData - Chart data
     */
    createCentileChart(chartData) {
        const traces = [];
        
        // Add centile lines first
        const centileStyles = {
            c5: { dash: 'dash', width: 1.5, name: '5th %ile' },
            c25: { dash: 'dashdot', width: 2, name: '25th %ile' },
            c50: { dash: 'solid', width: 3, name: '50th %ile' },
            c75: { dash: 'dashdot', width: 2, name: '75th %ile' },
            c95: { dash: 'dash', width: 1.5, name: '95th %ile' }
        };
        
        chartData.centile_columns.forEach(centile => {
            if (chartData.centiles.length > 0) {
                const style = centileStyles[centile];
                traces.push({
                    x: chartData.centiles.map(d => d.Age),
                    y: chartData.centiles.map(d => d[centile]),
                    mode: 'lines',
                    name: style.name,
                    line: { color: '#5C5C5C', dash: style.dash, width: style.width },
                    showlegend: false,
                    hoverinfo: 'skip'
                });
            }
        });
        
        // Add harmonized data points
        const sites = [...new Set(chartData.harmonized_data.map(d => d.Site))];
        sites.forEach((site, index) => {
            const siteData = chartData.harmonized_data.filter(d => d.Site === site);
            const color = this.colors[index % this.colors.length];
            
            traces.push({
                x: siteData.map(d => d.Age),
                y: siteData.map(d => d.Y_harmonized),
                mode: 'markers',
                type: 'scatter',
                name: site,
                marker: { size: 8, color: color, opacity: 0.7 },
                hovertemplate: '<b>%{text}</b><br>Age: %{x:.1f}<br>Harmonized: %{y:.1f}<br>Site: ' + site + '<extra></extra>',
                text: siteData.map(d => d.subject_id || `S${d.Age?.toFixed(0)}_${site}`)
            });
        });

        const layout = {
            margin: { l: 60, r: 40, t: 20, b: 50 },
            showlegend: true,
            legend: { x: 1.02, y: 1, bgcolor: 'rgba(0,0,0,0)', borderwidth: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'white',
            font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 12 },
            xaxis: {
                title: 'Age (years)',
                showgrid: true,
                gridwidth: 1,
                gridcolor: 'rgba(189, 195, 199, 0.5)'
            },
            yaxis: {
                title: 'Harmonized Score',
                showgrid: true,
                gridwidth: 1,
                gridcolor: 'rgba(189, 195, 199, 0.5)'
            }
        };

        Plotly.newPlot('chart2', traces, layout, { responsive: true, displayModeBar: false });
        this.addHoverEvents('chart2');
    }

    /**
     * Create QQ plot (Chart 3: Theoretical vs Z-Score)
     * @param {Object} chartData - Chart data
     */
    createQQChart(chartData) {
        const traces = [];
        const sites = Object.keys(chartData.sites_data);
        
        // Add data points
        sites.forEach((site, index) => {
            const siteData = chartData.sites_data[site];
            const color = this.colors[index % this.colors.length];
            
            traces.push({
                x: siteData.map(d => d.theoretical),
                y: siteData.map(d => d.Z),
                mode: 'markers',
                type: 'scatter',
                name: site,
                marker: { size: 8, color: color, opacity: 0.7 },
                hovertemplate: '<b>%{text}</b><br>Theoretical: %{x:.2f}<br>Z: %{y:.2f}<br>Site: ' + site + '<extra></extra>',
                text: siteData.map(d => d.subject_id || `S${d.Age?.toFixed(0)}_${site}`)
            });
        });
        
        // Add identity lines
        sites.forEach(site => {
            const lineData = chartData.identity_lines[site];
            if (lineData) {
                traces.push({
                    x: lineData.x,
                    y: lineData.y,
                    mode: 'lines',
                    line: { color: 'black', dash: 'dash', width: 1 },
                    showlegend: false,
                    hoverinfo: 'skip',
                    name: `${site} identity`
                });
            }
        });

        const layout = {
            margin: { l: 60, r: 40, t: 20, b: 50 },
            showlegend: true,
            legend: { x: 1.02, y: 1, bgcolor: 'rgba(0,0,0,0)', borderwidth: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'white',
            font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 12 },
            xaxis: {
                title: 'Theoretical Quantiles',
                showgrid: true,
                gridwidth: 1,
                gridcolor: 'rgba(189, 195, 199, 0.5)',
                zeroline: true,
                zerolinewidth: 1,
                zerolinecolor: 'rgba(189, 195, 199, 0.8)'
            },
            yaxis: {
                title: 'Z-Score',
                showgrid: true,
                gridwidth: 1,
                gridcolor: 'rgba(189, 195, 199, 0.5)',
                zeroline: true,
                zerolinewidth: 1,
                zerolinecolor: 'rgba(189, 195, 199, 0.8)'
            }
        };

        Plotly.newPlot('chart3', traces, layout, { responsive: true, displayModeBar: false });
        this.addHoverEvents('chart3');
    }

    /**
     * Create histogram chart (Chart 4: Z-Score Distribution with KDE)
     * @param {Object} chartData - Chart data
     */
    createHistogramChart(chartData) {
        const traces = [];
        const sites = Object.keys(chartData.sites_data);
        
        sites.forEach((site, index) => {
            const siteData = chartData.sites_data[site];
            const zScores = siteData.map(d => d.Z).filter(z => z !== null && z !== undefined);
            const color = this.colors[index % this.colors.length];
            
            if (zScores.length > 0) {
                // Histogram
                traces.push({
                    x: zScores,
                    type: 'histogram',
                    name: site,  // ← Cleaner name (just the site name)
                    marker: { color: color, opacity: 0.6 },
                    showlegend: true,  // ← Show in legend
                    nbinsx: 20
                });
                
                // KDE approximation using smooth curve
                if (zScores.length > 1) {
                    const kde = this.calculateKDE(zScores);
                    const binWidth = (Math.max(...zScores) - Math.min(...zScores)) / 20;
                    const kdeScaled = kde.y.map(y => y * zScores.length * binWidth);
                    
                    traces.push({
                        x: kde.x,
                        y: kdeScaled,
                        mode: 'lines',
                        type: 'scatter',
                        line: { color: color, width: 3 },
                        showlegend: false,
                        hoverinfo: 'skip',
                        name: `${site} KDE`
                    });
                }
            }
        });

        const layout = {
            margin: { l: 60, r: 40, t: 20, b: 50 },
            showlegend: true,
            legend: { x: 1.02, y: 1, bgcolor: 'rgba(0,0,0,0)', borderwidth: 0 }, 
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'white',
            font: { family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', size: 12 },
            xaxis: {
                title: 'Z-Score',
                showgrid: true,
                gridwidth: 1,
                gridcolor: 'rgba(189, 195, 199, 0.5)'
            },
            yaxis: {
                title: 'Count',
                showgrid: true,
                gridwidth: 1,
                gridcolor: 'rgba(189, 195, 199, 0.5)'
            }
        };

        Plotly.newPlot('chart4', traces, layout, { responsive: true, displayModeBar: false });
    }

    /**
     * Simple KDE calculation for smooth curves
     * @param {Array} data - Array of numeric values
     * @returns {Object} KDE x and y values
     */
    calculateKDE(data) {
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min;
        const bandwidth = range * 0.1; // Simple bandwidth estimation
        
        const x = [];
        const y = [];
        const numPoints = 100;
        
        for (let i = 0; i < numPoints; i++) {
            const xi = min - 0.3 * range + (i / (numPoints - 1)) * (range * 1.6);
            x.push(xi);
            
            let yi = 0;
            for (const dataPoint of data) {
                const u = (xi - dataPoint) / bandwidth;
                yi += Math.exp(-0.5 * u * u); // Gaussian kernel
            }
            y.push(yi / (data.length * bandwidth * Math.sqrt(2 * Math.PI)));
        }
        
        return { x, y };
    }

    /**
     * Add hover events to a chart for cross-highlighting
     * @param {string} containerId - ID of the container element
     */
    addHoverEvents(containerId) {
        const plotElement = document.getElementById(containerId);
        
        plotElement.on('plotly_hover', (eventData) => {
            const point = eventData.points[0];
            if (point.text) {
                this.highlightSubjectInAllCharts(point.text);
            }
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
        this.highlightedSubject = subject;
        
        const chartIds = ['chart1', 'chart2', 'chart3', 'chart4'];
        chartIds.forEach(chartId => {
            const element = document.getElementById(chartId);
            if (element && element.data) {
                // Find traces with the subject
                element.data.forEach((trace, traceIndex) => {
                    if (trace.text && trace.text.includes(subject)) {
                        const subjectIndex = trace.text.indexOf(subject);
                        if (subjectIndex !== -1) {
                            const colors = trace.text.map(text => 
                                text === subject ? '#ef4444' : (trace.marker.color || '#4f46e5')
                            );
                            const sizes = trace.text.map(text => 
                                text === subject ? 12 : 8
                            );
                            
                            const update = {
                                'marker.color': colors,
                                'marker.size': sizes
                            };
                            
                            Plotly.restyle(chartId, update, traceIndex);
                        }
                    }
                });
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
            if (element && element.data) {
                element.data.forEach((trace, traceIndex) => {
                    if (trace.text && trace.marker) {
                        // Reset to original colors/sizes
                        const originalColor = this.colors[traceIndex % this.colors.length] || '#4f46e5';
                        const colors = new Array(trace.text.length).fill(originalColor);
                        const sizes = new Array(trace.text.length).fill(8);
                        
                        const update = {
                            'marker.color': colors,
                            'marker.size': sizes
                        };
                        
                        Plotly.restyle(chartId, update, traceIndex);
                    }
                });
            }
        });
        
        this.highlightedSubject = null;
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
        
        const filters = dataManager.getFilters();
        const chartIds = ['chart1', 'chart2', 'chart3', 'chart4'];
        const chartNames = ['raw_scatter', 'centile_plot', 'qq_plot', 'histogram_kde'];
        
        chartIds.forEach((chartId, index) => {
            const element = document.getElementById(chartId);
            if (element && element.data) {
                setTimeout(() => {
                    Plotly.downloadImage(chartId, {
                        format: 'png',
                        width: 1200,
                        height: 800,
                        filename: `${currentMeasure}_${chartNames[index]}_${filters.sex}_${filters.site}`
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
            
            // Reset zoom on all charts
            const chartIds = ['chart1', 'chart2', 'chart3', 'chart4'];
            chartIds.forEach(chartId => {
                const element = document.getElementById(chartId);
                if (element) {
                    Plotly.relayout(chartId, {
                        'xaxis.autorange': true,
                        'yaxis.autorange': true
                    });
                }
            });
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = `
            <div class="error-message">
                <strong>Error:</strong> ${message}
                <br><br>
                <small>Make sure your data files are properly converted and available in the /data directory.</small>
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
                <span style="margin-left: 10px;">Loading normative model data...</span>
            </div>
        `;
    }

    /**
     * Update chart titles for specific measure
     * @param {string} measureName - Name of the measure
     */
    updateChartTitles(measureName) {
        const titles = {
            chart1: 'Raw Score vs Age',
            chart2: 'Harmonized Score vs Age with Centiles', 
            chart3: 'Q-Q Plot',
            chart4: 'Z-Score Distribution'
        };

        Object.keys(titles).forEach(chartKey => {
            const titleElement = document.querySelector(`#${chartKey}`).parentNode.querySelector('.chart-title');
            if (titleElement) {
                titleElement.textContent = titles[chartKey];
            }
        });
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