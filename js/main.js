/**
 * Main Application Module
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
        nav.innerHTML = `
            <div class="nav-section">
                <h3>Navigation</h3>
                <a href="#" class="nav-item active" onclick="app.showIntroduction()">Introduction</a>
                <a href="#" class="nav-item" onclick="app.showDocumentation()">Documentation</a>
            </div>
            
            <div class="nav-section">
                <h3>Cognitive Measures</h3>
                ${measures.map(measure => `
                    <a href="#" class="nav-item" onclick="app.loadMeasure('${measure.id}')" title="${measure.description}">
                        ${measure.name}
                    </a>
                `).join('')}
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
                         'Explore interactive visualizations of cognitive assessment normative data');
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
        this.updateHeader('Documentation', 'Detailed information about methods and data');
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
        
        this.updateHeader(this.formatMeasureName(measureName), 
                         'Interactive normative model visualization');
        this.showControls();
        
        // Show loading state
        chartManager.showLoading();
        
        try {
            // Create charts grid
            const contentArea = document.getElementById('content-area');
            contentArea.innerHTML = '';
            contentArea.appendChild(chartManager.createChartsGrid());
            
            // Load charts
            await chartManager.loadCharts(measureName);
            chartManager.updateChartTitles(measureName);
            
            this.updateActiveNav(this.formatMeasureName(measureName));
            this.updateURL('measure', measureName);
            
        } catch (error) {
            console.error('Error loading measure:', error);
            chartManager.showError(`Failed to load ${measureName} data`);
        }
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
                <p>This interactive dashboard presents normative models for various cognitive measures. Our research has developed comprehensive normative models that account for demographic variables and provide standardized reference points for cognitive assessment.</p>
                
                <h3>How to Use</h3>
                <p>Select a cognitive measure from the left sidebar to view interactive visualizations. Each measure displays four coordinated charts showing different aspects of the normative model. Hover over data points to see detailed information and observe how the same subjects are highlighted across all charts.</p>
                
                <h3>Features</h3>
                <p>• Interactive cross-chart highlighting for subject tracking</p>
                <p>• Export functionality for data, models, and visualizations</p>
                <p>• Responsive design for desktop and mobile viewing</p>
                <p>• Real-time data exploration and analysis</p>
                
                <h3>Getting Started</h3>
                <p>Click on any cognitive measure in the sidebar to begin exploring the normative data. The dashboard will load interactive visualizations that allow you to examine relationships between demographic variables and cognitive performance.</p>
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
                <h3>Methodology</h3>
                <p>Our normative models were developed using advanced statistical techniques including regression modeling, generalized additive models, and machine learning approaches. Each model accounts for key demographic variables such as age, education, and gender.</p>
                
                <h3>Data Sources</h3>
                <p>The normative data is derived from a comprehensive dataset of cognitive assessments from healthy participants. All data has been anonymized and aggregated to protect participant privacy.</p>
                
                <h3>Model Validation</h3>
                <p>Each model underwent rigorous validation using cross-validation techniques and independent test datasets. Performance metrics and validation results are available in the research publications.</p>
                
                <h3>Technical Implementation</h3>
                <p>This dashboard uses Plotly.js for interactive visualizations with coordinated highlighting across multiple charts. The underlying models are implemented in Python and exported for web visualization.</p>
                
                <h3>Chart Descriptions</h3>
                <p><strong>Age vs Performance:</strong> Shows the relationship between participant age and cognitive performance scores.</p>
                <p><strong>Education vs Performance:</strong> Displays how education level correlates with cognitive performance.</p>
                <p><strong>Model Residuals:</strong> Visualizes the residuals from the normative model, helping identify outliers.</p>
                <p><strong>Predicted vs Actual:</strong> Compares model predictions against actual observed scores.</p>
                
                <h3>Data Export</h3>
                <p>Use the export buttons to download the underlying data, model parameters, or high-resolution chart images for use in publications or presentations.</p>
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
        return name.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
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
    window.app = new App();
    app.handleInitialRoute();
});