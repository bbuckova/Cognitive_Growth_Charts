/**
 * Data Management Module
 * Handles loading, caching, and exporting of cognitive measures data
 */

class DataManager {
    constructor() {
        this.cache = new Map();
        this.measures = null;
        this.currentMeasure = null;
    }

    // Sample data structure - replace with your actual data loading
    static sampleData = {
        working_memory: {
            chart1: {
                x: [20, 30, 40, 50, 60, 70, 80],
                y: [10, 11, 12, 13, 14, 13, 12],
                subjects: ['S001', 'S002', 'S003', 'S004', 'S005', 'S006', 'S007'],
                type: 'scatter',
                mode: 'markers',
                name: 'Age vs Performance'
            },
            chart2: {
                x: [12, 14, 16, 18, 20, 16, 14],
                y: [15, 16, 14, 13, 12, 11, 10],
                subjects: ['S001', 'S002', 'S003', 'S004', 'S005', 'S006', 'S007'],
                type: 'scatter',
                mode: 'markers',
                name: 'Education vs Performance'
            },
            chart3: {
                x: [1, 2, 3, 4, 5, 6, 7],
                y: [2, 3, 1, 4, 2, -1, 0],
                subjects: ['S001', 'S002', 'S003', 'S004', 'S005', 'S006', 'S007'],
                type: 'scatter',
                mode: 'markers',
                name: 'Residuals'
            },
            chart4: {
                x: [10, 11, 12, 13, 14, 13, 12],
                y: [9.8, 11.2, 11.9, 13.1, 14.2, 12.8, 11.9],
                subjects: ['S001', 'S002', 'S003', 'S004', 'S005', 'S006', 'S007'],
                type: 'scatter',
                mode: 'markers',
                name: 'Predicted vs Actual'
            }
        },
        attention: {
            chart1: {
                x: [25, 35, 45, 55, 65, 75],
                y: [95, 90, 85, 80, 75, 70],
                subjects: ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                type: 'scatter',
                mode: 'markers',
                name: 'Age vs Attention Score'
            },
            chart2: {
                x: [12, 14, 16, 18, 20, 16],
                y: [85, 88, 92, 95, 90, 87],
                subjects: ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                type: 'scatter',
                mode: 'markers',
                name: 'Education vs Attention'
            },
            chart3: {
                x: [1, 2, 3, 4, 5, 6],
                y: [1, -2, 3, -1, 2, 0],
                subjects: ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                type: 'scatter',
                mode: 'markers',
                name: 'Residuals'
            },
            chart4: {
                x: [95, 90, 85, 80, 75, 70],
                y: [94, 92, 88, 81, 77, 70],
                subjects: ['S001', 'S002', 'S003', 'S004', 'S005', 'S006'],
                type: 'scatter',
                mode: 'markers',
                name: 'Predicted vs Actual'
            }
        }
    };

    /**
     * Load measure data (from file or sample data)
     * @param {string} measureName - Name of the cognitive measure
     * @returns {Promise<Object>} Measure data
     */
    async loadMeasure(measureName) {
        if (this.cache.has(measureName)) {
            return this.cache.get(measureName);
        }

        try {
            // Try to load from file first
            const response = await fetch(`data/${measureName}.json`);
            if (response.ok) {
                const data = await response.json();
                this.cache.set(measureName, data);
                return data;
            }
        } catch (error) {
            console.log(`Loading from file failed, using sample data: ${error.message}`);
        }

        // Fall back to sample data
        const sampleData = DataManager.sampleData[measureName] || DataManager.sampleData.working_memory;
        this.cache.set(measureName, sampleData);
        return sampleData;
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
            console.log(`Loading measures failed, using defaults: ${error.message}`);
        }

        // Default measures
        this.measures = [
            { id: 'working_memory', name: 'Working Memory', description: 'Working memory capacity assessment' },
            { id: 'attention', name: 'Attention', description: 'Sustained attention performance' },
            { id: 'executive_function', name: 'Executive Function', description: 'Executive function measures' },
            { id: 'processing_speed', name: 'Processing Speed', description: 'Processing speed assessment' },
            { id: 'verbal_fluency', name: 'Verbal Fluency', description: 'Verbal fluency tests' },
            { id: 'memory_recall', name: 'Memory Recall', description: 'Memory recall performance' }
        ];

        return this.measures;
    }

    /**
     * Export current measure data as JSON
     */
    static exportData() {
        const currentData = dataManager.cache.get(dataManager.currentMeasure);
        if (!currentData) {
            alert('No data to export. Please select a measure first.');
            return;
        }

        const jsonData = JSON.stringify(currentData, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataManager.currentMeasure}_data.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Export model information (placeholder)
     */
    static exportModel() {
        if (!dataManager.currentMeasure) {
            alert('Please select a measure first.');
            return;
        }
        
        // This would contain your actual model export logic
        const modelInfo = {
            measure: dataManager.currentMeasure,
            model_type: 'normative_model',
            parameters: {
                // Add your model parameters here
            },
            metadata: {
                created: new Date().toISOString(),
                version: '1.0.0'
            }
        };

        const jsonData = JSON.stringify(modelInfo, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataManager.currentMeasure}_model.json`;
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