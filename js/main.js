/**
 * Main Application Module - Upgraded for Normative Models
 * Handles navigation, page routing, and overall app coordination
 */

class App {
    constructor() {
        this.currentPage = 'introduction';
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        await this.loadNavigation();
        this.showIntroduction();
        this.setupEventListeners();
    }

    /**
     * Load navigation from available measures
     */
    async loadNavigation() {
        try {
            const measures = await dataManager.getMeasures();
            this.renderNavigation(measures);
        } catch (error) {
            console.error('Error loading navigation:', error);
            this.renderNavigation([]); // Fallback to empty navigation
        }
    }

    /**
     * Render navigation menu
     * @param {Array} measures - Array of available measures
     */
    renderNavigation(measures) {
        const nav = document.getElementById('navigation');
        // Update the logo section with clickable logo
        const logoSection = document.querySelector('.logo');
        if (logoSection) {
            logoSection.innerHTML = `
                <img src="assets/images/lab-logo.jpeg" 
                    alt="Lab Logo" 
                    class="logo-image" 
                    onclick="window.open('https://predictiveclinicalneuroscience.com/', '_blank')">
                <div class="logo-text">
                    <h1>Cognitive Models</h1>
                    <p>Normative Analysis Dashboard</p>
                </div>
            `;
        }
        nav.innerHTML = `
            <div class="nav-section">
                <h3>Navigation</h3>
                <a href="#" class="nav-item active" onclick="app.showIntroduction()">Introduction</a>
                <a href="#" class="nav-item" onclick="app.showDocumentation()">Documentation</a>
            </div>
            
            <div class="nav-section">
                <h3>Normative Models</h3>
                ${measures.length > 0 ? measures.map(measure => `
                    <a href="#" class="nav-item" onclick="app.loadMeasure('${measure.id}')" title="${measure.description}">
                        ${measure.name}
                    </a>
                `).join('') : '<p style="color: #6b7280; font-size: 0.9rem; padding: 10px;">No measures available.<br><small>Convert your data using the Python script first.</small></p>'}
            </div>
        `;
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (event) => {
            if (event.state) {
                this.handleRoute(event.state.page, event.state.measure);
            }
        });

        // Handle window resize for chart responsiveness
        window.addEventListener('resize', () => {
            if (this.currentPage.startsWith('measure_')) {
                this.resizeCharts();
            }
        });
    }

    /**
     * Show introduction page
     */
    async showIntroduction() {
        this.currentPage = 'introduction';
        this.updateHeader('Welcome to Cognitive Normative Models', 
                         'Explore interactive visualizations of cognitive assessment normative data with demographic harmonization');
        this.hideControls();
        
        try {
            const content = await this.loadPageContent('intro.html');
            this.setContent(content);
        } catch (error) {
            // Fallback content if file doesn't exist
            this.setContent(this.getDefaultIntroContent());
        }
        
        this.updateActiveNav('Introduction');
        this.updateURL('introduction');
    }

    /**
     * Show documentation page
     */
    async showDocumentation() {
        this.currentPage = 'documentation';
        this.updateHeader('Documentation', 'Detailed information about normative modeling methods and data harmonization');
        this.hideControls();
        
        try {
            const content = await this.loadPageContent('docs.html');
            this.setContent(content);
        } catch (error) {
            // Fallback content if file doesn't exist
            this.setContent(this.getDefaultDocsContent());
        }
        
        this.updateActiveNav('Documentation');
        this.updateURL('documentation');
    }

    /**
     * Load and display a cognitive measure
     * @param {string} measureName - Name of the measure to load
     */
    async loadMeasure(measureName) {
        this.currentPage = `measure_${measureName}`;
        dataManager.setCurrentMeasure(measureName);
        
        const displayName = this.formatMeasureName(measureName);
        this.updateHeader(displayName, 
                         'Interactive normative model with demographic harmonization and filtering');
        this.showControls();
        
        // Show loading state
        chartManager.showLoading();
        
        try {
            // Cleanup previous charts
            chartManager.cleanup();
            
            // Create charts grid with filter controls
            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = '';
            contentArea.appendChild(chartManager.createChartsGrid());
    
            // Wait for DOM to be fully updated with proper checking
            await this.waitForChartContainers();
            
            // Load charts with real data
            await chartManager.loadCharts(measureName);

            // Only update titles if charts were created successfully
            try {
                chartManager.updateChartTitles(measureName);
            } catch (titleError) {
                console.warn('Could not update chart titles:', titleError.message);
            }
            
            this.updateActiveNav(displayName);
            this.updateURL('measure', measureName);
            
        } catch (error) {
            console.error('Error loading measure:', error);
            chartManager.showError(`Failed to load ${displayName}: ${error.message}`);
        }
    }
    
    /**
     * Wait for chart containers to exist in DOM
     */
    async waitForChartContainers() {
        const maxAttempts = 50; // 5 seconds max
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            const chart1 = document.getElementById('chart1');
            const sexFilter = document.getElementById('sex-filter');
            
            if (chart1 && sexFilter) {
                console.log('✅ Chart containers ready after', attempts * 100, 'ms');
                return; // All containers exist
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        throw new Error('Chart containers were not created in time');
    }

    /**
     * Load page content from HTML file
     * @param {string} filename - Name of the HTML file to load
     * @returns {Promise<string>} HTML content
     */
    async loadPageContent(filename) {
        const response = await fetch(`pages/${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${filename}`);
        }
        return await response.text();
    }

    /**
     * Get default introduction content
     * @returns {string} HTML content
     */
    getDefaultIntroContent() {
        return `
            <div class="intro-content">
                <h3>About This Dashboard</h3>
                <p>This interactive dashboard presents sophisticated normative models for cognitive measures with demographic harmonization. Our research has developed comprehensive normative models that account for demographic variables, site effects, and provide standardized reference points for cognitive assessment across diverse populations.</p>
                
                <h3>Key Features</h3>
                <p><strong>4-Panel Dashboard:</strong> Each cognitive measure displays four coordinated visualizations:</p>
                <p>• <strong>Raw Scatter Plot:</strong> Shows the relationship between age and raw cognitive scores</p>
                <p>• <strong>Centile Plot:</strong> Displays harmonized scores with percentile reference lines (5th, 25th, 50th, 75th, 95th)</p>
                <p>• <strong>Q-Q Plot:</strong> Quantile-quantile plot for assessing normality of standardized scores</p>
                <p>• <strong>Distribution Plot:</strong> Histograms with KDE curves showing Z-score distributions</p>
                
                <h3>Interactive Filtering</h3>
                <p>• <strong>Sex & Site Filtering:</strong> View data for specific demographic groups and data collection sites</p>
                <p>• <strong>Cross-chart Highlighting:</strong> Hover over data points to see the same subjects highlighted across all four charts</p>
                <p>• <strong>Real-time Updates:</strong> Apply filters without page reloads for seamless exploration</p>
                
                <h3>Data Export & Analysis</h3>
                <p>• Export filtered data as JSON for further analysis</p>
                <p>• Download model parameters and metadata</p>
                <p>• Export high-resolution chart images for publications</p>
                <p>• Reset views and clear highlights with one click</p>
                
                <h3>Getting Started</h3>
                <p>Select any cognitive measure from the sidebar to begin exploring. Use the Sex and Site filters in the dashboard to focus on specific populations. Hover over data points to see cross-chart highlighting and detailed information.</p>
                
                <div style="margin-top: 20px; padding: 15px; background: rgba(79, 70, 229, 0.1); border-radius: 8px; border-left: 4px solid #4f46e5;">
                    <strong>Note:</strong> If no measures appear in the sidebar, make sure to run the Python data conversion script first to convert your CSV files to web-compatible JSON format.
                </div>
            </div>
        `;
    }

    /**
     * Get default documentation content
     * @returns {string} HTML content
     */
    getDefaultDocsContent() {
        return `
            <div class="intro-content">
                <h3>Normative Modeling Methodology</h3>
                <p>Our normative models employ advanced statistical techniques including quantile regression, generalized additive models, and demographic harmonization methods. Each model accounts for key demographic variables and corrects for multi-site batch effects.</p>
                
                <h3>Data Harmonization</h3>
                <p><strong>ComBat Harmonization:</strong> Multi-site data undergoes batch effect correction using ComBat methodology to ensure comparability across different data collection sites.</p>
                <p><strong>Demographic Adjustment:</strong> Models incorporate age, sex, and education effects through sophisticated regression techniques.</p>
                <p><strong>Z-Score Standardization:</strong> Final scores are standardized using demographic-adjusted normative distributions.</p>
                
                <h3>Model Validation</h3>
                <p>Each normative model underwent rigorous validation using:</p>
                <p>• Cross-validation across multiple folds</p>
                <p>• Independent test datasets</p>
                <p>• Site-stratified validation to ensure generalizability</p>
                <p>• Quantile regression validation for percentile accuracy</p>
                
                <h3>Dashboard Visualizations</h3>
                <p><strong>Raw Scatter Plot (Top-Left):</strong> Shows the relationship between participant age and raw cognitive performance scores, colored by data collection site. This plot reveals the underlying age-performance relationship before harmonization.</p>
                
                <p><strong>Centile Plot (Top-Right):</strong> Displays harmonized cognitive scores plotted against age with overlaid percentile reference lines. The gray lines represent the 5th, 25th, 50th, 75th, and 95th percentiles of the normative distribution.</p>
                
                <p><strong>Q-Q Plot (Bottom-Left):</strong> Quantile-quantile plot comparing theoretical normal quantiles against observed Z-scores. Points falling along the diagonal line indicate good normality, while deviations suggest non-normal distributions.</p>
                
                <p><strong>Distribution Plot (Bottom-Right):</strong> Histograms of Z-scores with overlaid kernel density estimation (KDE) curves. This visualization shows the distribution shape of standardized scores for each site.</p>
                
                <h3>Interactive Features</h3>
                <p><strong>Cross-Chart Highlighting:</strong> Hovering over any data point highlights the same subject across all four visualizations, enabling comprehensive subject-level analysis.</p>
                
                <p><strong>Filter Controls:</strong> Use the Sex and Site dropdown menus to focus analysis on specific demographic groups or data collection sites. Updates are applied in real-time without page reloads.</p>
                
                <p><strong>Export Functions:</strong> The dashboard provides multiple export options:</p>
                <p>• <strong>Export Data:</strong> Download filtered dataset as JSON including all demographic and score information</p>
                <p>• <strong>Export Model:</strong> Download model parameters, methodology details, and metadata</p>
                <p>• <strong>Export Images:</strong> Save high-resolution PNG images of all four charts for publications</p>
                <p>• <strong>Reset View:</strong> Clear all highlights and reset zoom levels across all charts</p>
                
                <h3>Technical Implementation</h3>
                <p>The dashboard uses Plotly.js for interactive visualizations with coordinated highlighting across multiple charts. The underlying normative models are implemented in Python and exported as JSON for web visualization. Real-time filtering is achieved through client-side data processing without server requests.</p>
                
                <h3>Data Privacy & Ethics</h3>
                <p>All normative data has been anonymized and aggregated to protect participant privacy. Subject identifiers are randomized and contain no personally identifiable information. The models comply with research ethics guidelines for data sharing and visualization.</p>
            </div>
        `;
    }

    /**
     * Update page header
     * @param {string} title - Main title
     * @param {string} subtitle - Subtitle
     */
    updateHeader(title, subtitle) {
        document.getElementById('main-title').textContent = title;
        document.getElementById('main-subtitle').textContent = subtitle;
    }

    /**
     * Show/hide control buttons
     */
    showControls() {
        document.getElementById('controls').style.display = 'flex';
    }

    hideControls() {
        document.getElementById('controls').style.display = 'none';
    }

    /**
     * Set main content area
     * @param {string} content - HTML content to display
     */
    setContent(content) {
        document.getElementById('content-area').innerHTML = content;
    }

    /**
     * Update active navigation item
     * @param {string} activeName - Name of the active item
     */
    updateActiveNav(activeName) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.textContent.trim() === activeName) {
                item.classList.add('active');
            }
        });
    }

    /**
     * Update browser URL without page reload
     * @param {string} page - Page type
     * @param {string} measure - Measure name (optional)
     */
    updateURL(page, measure = null) {
        const state = { page, measure };
        const url = measure ? `#${page}/${measure}` : `#${page}`;
        history.pushState(state, '', url);
    }

    /**
     * Handle route changes
     * @param {string} page - Page type
     * @param {string} measure - Measure name (optional)
     */
    handleRoute(page, measure) {
        switch (page) {
            case 'introduction':
                this.showIntroduction();
                break;
            case 'documentation':
                this.showDocumentation();
                break;
            case 'measure':
                if (measure) {
                    this.loadMeasure(measure);
                }
                break;
            default:
                this.showIntroduction();
        }
    }

    /**
     * Format measure name for display
     * @param {string} name - Raw measure name
     * @returns {string} Formatted name
     */
    formatMeasureName(name) {
        // Handle special formatting for cognitive measure names
        return name
            .split('_')
            .map(word => {
                // Handle special cases
                if (word.toUpperCase() === 'NIH') return 'NIH';
                if (word.toLowerCase() === 'rawscore') return 'Raw Score';
                if (word.toLowerCase() === 'cardsort') return 'Card Sort';
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    }

    /**
     * Resize charts when window size changes
     */
    resizeCharts() {
        const chartIds = ['chart1', 'chart2', 'chart3', 'chart4'];
        chartIds.forEach(chartId => {
            const element = document.getElementById(chartId);
            if (element && element.layout) {
                Plotly.Plots.resize(chartId);
            }
        });
    }

    /**
     * Handle initial page load routing
     */
    handleInitialRoute() {
        const hash = window.location.hash.slice(1); // Remove #
        if (hash) {
            const [page, measure] = hash.split('/');
            this.handleRoute(page, measure);
        } else {
            this.showIntroduction();
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if we're on the main dashboard page
    if (document.getElementById('navigation') && document.getElementById('main-title')) {
        window.app = new App();
        app.handleInitialRoute();
    } else {
        console.log('Not on main dashboard page, skipping App initialization');
    }
});