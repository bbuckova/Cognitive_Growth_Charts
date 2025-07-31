/**
 * Data Management Module - Upgraded for Normative Models
 * Handles loading, caching, and exporting of cognitive measures data
 */

class DataManager {
    constructor() {
        this.cache = new Map();
        this.measures = null;
        this.currentMeasure = null;
        this.currentFilters = {
            sex: null,
            site: null
        };
    }

    /**
     * Load measure data from JSON files
     * @param {string} measureName - Name of the cognitive measure
     * @returns {Promise<Object>} Measure data
     */
    async loadMeasure(measureName) {
        const cacheKey = `${measureName}_${this.currentFilters.sex}_${this.currentFilters.site}`;
        
        console.log('Loading measure with cache key:', cacheKey);
        console.log('Cache has key?', this.cache.has(cacheKey));

        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Load the scale data
            const response = await fetch(`data/${measureName}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load ${measureName}: ${response.status}`);
            }
            
            const rawData = await response.json();
            
            // Process data for the current filters
            const processedData = this.processDataForChartManager(rawData);
            
            this.cache.set(cacheKey, processedData);
            return processedData;
            
        } catch (error) {
            console.error(`Error loading measure ${measureName}:`, error);
            throw error;
        }
    }

    /**
     * Process raw normative data into chart-ready format
     * @param {Object} rawData - Raw JSON data from file
     * @returns {Object} Processed data for ChartManager
     */
    processDataForChartManager(rawData) {
        const { currentFilters } = this;
        const sex = currentFilters.sex || rawData.available_sexes[0];
        const site = currentFilters.site || rawData.available_sites[0];
        
        // Filter centiles data
        const centiles = rawData.centiles.filter(row => 
            row.Sex_harmonized === sex && row.Site_harmonized === site
        ).sort((a, b) => a.Age - b.Age);
        
        // Filter harmonized data
        const harmonized = rawData.harmonized.filter(row => 
            row.Sex_harmonized === sex && row.Site_harmonized === site
        );
        
        // Get all sites for histogram data
        const allSitesData = rawData.harmonized.filter(row => 
            row.Sex_harmonized === sex && row.Site_harmonized === site
        );

        console.log(`Filtered data: Sex=${sex}, Site=${site}, Results=${harmonized.length} rows`);
        console.log('Available in raw data:', rawData.available_sexes, rawData.available_sites);
        
        // Prepare data for each chart
        return {
            scale_name: rawData.scale_name,
            display_name: rawData.display_name,
            current_filters: { sex, site },
            available_filters: {
                sexes: rawData.available_sexes,
                sites: rawData.available_sites,
                raw_sites: rawData.available_raw_sites
            },
            
            // Chart 1: Raw Scatter (Age vs Raw Score)
            chart1: {
                type: 'raw_scatter',
                title: 'Raw Score vs Age',
                sites_data: this.groupBySite(harmonized, 'Site'),
                scale_column: rawData.scale_name
            },
            
            // Chart 2: Centile Plot (Age vs Harmonized Score with percentile lines)  
            chart2: {
                type: 'centile_plot',
                title: 'Harmonized Score vs Age with Centiles',
                centiles: centiles,
                harmonized_data: harmonized,
                centile_columns: rawData.metadata.centile_columns
            },
            
            // Chart 3: QQ Plot (Theoretical vs Z-Score)
            chart3: {
                type: 'qq_plot', 
                title: 'Q-Q Plot',
                sites_data: this.groupBySite(harmonized, 'Site'),
                identity_lines: this.calculateIdentityLines(harmonized)
            },
            
            // Chart 4: Histograms with KDE
            chart4: {
                type: 'histogram_kde',
                title: 'Z-Score Distribution',
                sites_data: this.groupBySite(allSitesData, 'Site')
            }
        };
    }

    /**
     * Group data by site for visualization
     * @param {Array} data - Array of data objects
     * @param {string} siteColumn - Column name for site grouping
     * @returns {Object} Grouped data by site
     */
    groupBySite(data, siteColumn) {
        const grouped = {};
        
        data.forEach(row => {
            const site = row[siteColumn];
            if (!grouped[site]) {
                grouped[site] = [];
            }
            grouped[site].push(row);
        });
        
        return grouped;
    }

    /**
     * Calculate identity lines for QQ plot
     * @param {Array} data - Harmonized data
     * @returns {Object} Identity line data for each site
     */
    calculateIdentityLines(data) {
        const lines = {};
        const sites = [...new Set(data.map(row => row.Site))];
        const numSites = sites.length;
        
        // Calculate the overall data range for both theoretical and Z values
        const allTheoretical = data.map(row => row.theoretical).filter(val => val !== null && val !== undefined);
        const allZ = data.map(row => row.Z).filter(val => val !== null && val !== undefined);
        
        if (allTheoretical.length === 0 || allZ.length === 0) {
            console.warn('No valid data for identity lines');
            return lines;
        }
        
        // Find the range that covers both theoretical and Z values
        const minTheoretical = Math.min(...allTheoretical);
        const maxTheoretical = Math.max(...allTheoretical);
        const minZ = Math.min(...allZ);
        const maxZ = Math.max(...allZ);
        
        // Use the broader range with some padding
        const minRange = Math.min(minTheoretical, minZ) - 0.5;
        const maxRange = Math.max(maxTheoretical, maxZ) + 0.5;
        
        console.log(`Q-Q Plot range: [${minRange.toFixed(2)}, ${maxRange.toFixed(2)}]`);
        
        sites.forEach(site => {
            const siteData = data.filter(row => row.Site === site);
            if (siteData.length > 0) {
                // Use the corrected offset formula: number of sites - 1
                const originalOffset = siteData[0].offset;
                const correctedOffset = originalOffset - (numSites - 1);
                
                lines[site] = {
                    x: [minRange, maxRange],  // Dynamic range instead of [-3, 3]
                    y: [minRange + correctedOffset, maxRange + correctedOffset],
                    offset: correctedOffset
                };
            }
        });
        
        return lines;
    }
    /**
     * Set current filters
     * @param {string} sex - Selected sex
     * @param {string} site - Selected site  
     */
    setFilters(sex, site) {
        this.currentFilters = { sex, site };
        // Clear cache when filters change
        this.clearCache();
    }

    /**
     * Get current filters
     * @returns {Object} Current filter values
     */
    getFilters() {
        return this.currentFilters;
    }

    /**
     * Get list of available measures
     * @returns {Promise<Array>} Array of measure objects
     */
    async getMeasures() {
        if (this.measures) {
            return this.measures;
        }

        try {
            const response = await fetch('data/measures.json');
            if (response.ok) {
                this.measures = await response.json();
                return this.measures;
            }
        } catch (error) {
            console.log(`Loading measures failed: ${error.message}`);
        }

        // Fallback - empty array if no measures file
        this.measures = [];
        return this.measures;
    }

    /**
     * Get available filter options for a measure
     * @param {string} measureName - Name of the measure
     * @returns {Promise<Object>} Available filter options
     */
    async getFilterOptions(measureName) {
        try {
            const response = await fetch(`data/${measureName}.json`);
            if (response.ok) {
                const data = await response.json();
                
                // Map sex codes to readable labels
                const sexOptions = data.available_sexes.map(sex => ({
                    value: sex,
                    label: sex === 0 ? 'Female' : sex === 1 ? 'Male' : sex
                }));
                
                return {
                    sexes: sexOptions,  // ← Now returns [{value: 0, label: 'Female'}, {value: 1, label: 'Male'}]
                    sites: data.available_sites
                };
            }
        } catch (error) {
            console.error('Error loading filter options:', error);
        }
        
        return { sexes: [], sites: [] };
    }

    /**
     * Export current measure data as JSON
     */
    static exportData() {
        const currentMeasure = dataManager.currentMeasure;
        if (!currentMeasure) {
            alert('No data to export. Please select a measure first.');
            return;
        }

        const cacheKey = `${currentMeasure}_${dataManager.currentFilters.sex}_${dataManager.currentFilters.site}`;
        const currentData = dataManager.cache.get(cacheKey);
        
        if (!currentData) {
            alert('No data loaded. Please wait for the charts to load first.');
            return;
        }

        // Create comprehensive export data
        const exportData = {
            measure: currentMeasure,
            display_name: currentData.display_name,
            filters: currentData.current_filters,
            timestamp: new Date().toISOString(),
            data: currentData
        };

        const jsonData = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentMeasure}_${currentData.current_filters.sex}_${currentData.current_filters.site}_data.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Export model information
     */
    static exportModel() {
        const currentMeasure = dataManager.currentMeasure;
        if (!currentMeasure) {
            alert('Please select a measure first.');
            return;
        }
        
        const modelInfo = {
            measure: currentMeasure,
            model_type: 'normative_model',
            filters: dataManager.currentFilters,
            methodology: {
                centile_calculation: 'Quantile regression with demographic harmonization',
                z_score_standardization: 'Age and demographic adjusted normalization',
                site_harmonization: 'Multi-site batch effect correction'
            },
            parameters: {
                centiles: ['5th', '25th', '50th', '75th', '95th'],
                demographic_variables: ['Age', 'Sex', 'Site'],
                harmonization_method: 'ComBat'
            },
            metadata: {
                created: new Date().toISOString(),
                version: '1.0.0',
                description: 'Cognitive normative model with demographic harmonization'
            }
        };

        const jsonData = JSON.stringify(modelInfo, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentMeasure}_model_info.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Set current measure
     * @param {string} measureName - Name of the measure
     */
    setCurrentMeasure(measureName) {
        this.currentMeasure = measureName;
    }

    /**
     * Get current measure
     * @returns {string} Current measure name
     */
    getCurrentMeasure() {
        return this.currentMeasure;
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Create global instance
const dataManager = new DataManager();