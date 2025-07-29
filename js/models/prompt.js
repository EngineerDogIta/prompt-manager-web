/**
 * Prompt Model
 * Handles prompt data structure, validation, and serialization
 */

class Prompt {
    static TYPES = {
        TEXT_GENERATION: 'text_generation',
        IMAGE_GENERATION: 'image_generation',
        CODE: 'code',
        OTHER: 'other'
    };
    
    static REQUIRED_FIELDS = ['title', 'type', 'prompt'];
    
    constructor(data = {}) {
        this.id = data.id || this.generateId();
        this.title = data.title || '';
        this.type = data.type || Prompt.TYPES.TEXT_GENERATION;
        this.prompt = data.prompt || '';
        this.negative_prompt = data.negative_prompt || '';
        this.model = data.model || '';
        this.author = data.author || '';
        this.tags = Array.isArray(data.tags) ? data.tags : [];
        this.notes = data.notes || '';
        this.version = data.version || '1.0';
        this.created = data.created || new Date().toISOString().split('T')[0];
        this.modified = data.modified || new Date().toISOString().split('T')[0];
        this.category = data.category || '';
        this.isFavorite = Boolean(data.isFavorite);
        
        // Validate data
        this.validate();
    }
    
    /**
     * Generate unique ID for prompt
     * @returns {string} Unique identifier
     */
    generateId() {
        return `prompt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Validate prompt data
     * @throws {Error} If validation fails
     */
    validate() {
        const errors = [];
        
        // Check required fields
        Prompt.REQUIRED_FIELDS.forEach(field => {
            if (!this[field] || (typeof this[field] === 'string' && this[field].trim() === '')) {
                errors.push(`Field '${field}' is required`);
            }
        });
        
        // Validate type
        if (!Object.values(Prompt.TYPES).includes(this.type)) {
            errors.push(`Invalid type '${this.type}'. Must be one of: ${Object.values(Prompt.TYPES).join(', ')}`);
        }
        
        // Validate title length
        if (this.title && this.title.length > 200) {
            errors.push('Title must be 200 characters or less');
        }
        
        // Validate prompt length
        if (this.prompt && this.prompt.length > 10000) {
            errors.push('Prompt must be 10000 characters or less');
        }
        
        // Validate tags
        if (this.tags && !Array.isArray(this.tags)) {
            errors.push('Tags must be an array');
        }
        
        if (this.tags && this.tags.length > 20) {
            errors.push('Maximum 20 tags allowed');
        }
        
        // Validate version format
        if (this.version && !/^\d+\.\d+(\.\d+)?$/.test(this.version)) {
            errors.push('Version must be in format X.Y or X.Y.Z');
        }
        
        // Validate dates
        if (this.created && !this.isValidDate(this.created)) {
            errors.push('Invalid created date format');
        }
        
        if (this.modified && !this.isValidDate(this.modified)) {
            errors.push('Invalid modified date format');
        }
        
        if (errors.length > 0) {
            throw new Error(`Validation failed: ${errors.join(', ')}`);
        }
    }
    
    /**
     * Check if date string is valid
     * @param {string} dateString - Date string to validate
     * @returns {boolean} True if valid
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
    
    /**
     * Update prompt data
     * @param {Object} data - Data to update
     */
    update(data) {
        const allowedFields = [
            'title', 'type', 'prompt', 'negative_prompt', 'model', 
            'author', 'tags', 'notes', 'version', 'category', 'isFavorite'
        ];
        
        allowedFields.forEach(field => {
            if (data.hasOwnProperty(field)) {
                this[field] = data[field];
            }
        });
        
        // Update modified date
        this.modified = new Date().toISOString().split('T')[0];
        
        // Re-validate
        this.validate();
    }
    
    /**
     * Clone prompt with new ID
     * @returns {Prompt} Cloned prompt
     */
    clone() {
        const data = this.toObject();
        delete data.id;
        data.title = `${data.title} (Copy)`;
        return new Prompt(data);
    }
    
    /**
     * Convert to plain object
     * @returns {Object} Plain object representation
     */
    toObject() {
        return {
            id: this.id,
            title: this.title,
            type: this.type,
            prompt: this.prompt,
            negative_prompt: this.negative_prompt,
            model: this.model,
            author: this.author,
            tags: [...this.tags],
            notes: this.notes,
            version: this.version,
            created: this.created,
            modified: this.modified,
            category: this.category,
            isFavorite: this.isFavorite
        };
    }
    
    /**
     * Convert to YAML format (compatible with original app)
     * @returns {string} YAML representation
     */
    toYAML() {
        const yamlData = {
            title: this.title,
            type: this.type,
            prompt: this.prompt,
            negative_prompt: this.negative_prompt,
            model: this.model,
            author: this.author,
            tags: this.tags,
            notes: this.notes,
            version: this.version,
            created: this.created,
            modified: this.modified
        };
        
        // Remove empty fields for cleaner YAML
        Object.keys(yamlData).forEach(key => {
            if (yamlData[key] === '' || (Array.isArray(yamlData[key]) && yamlData[key].length === 0)) {
                delete yamlData[key];
            }
        });
        
        return jsyaml.dump(yamlData, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: false
        });
    }
    
    /**
     * Create prompt from YAML string
     * @param {string} yamlString - YAML content
     * @param {Object} metadata - Additional metadata
     * @returns {Prompt} Prompt instance
     */
    static fromYAML(yamlString, metadata = {}) {
        try {
            const data = jsyaml.load(yamlString);
            return new Prompt({ ...data, ...metadata });
        } catch (error) {
            throw new Error(`Failed to parse YAML: ${error.message}`);
        }
    }
    
    /**
     * Generate safe filename from title
     * @returns {string} Safe filename
     */
    getFilename() {
        return this.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim('-')
            .substring(0, 50) + '.prompt.yaml';
    }
    
    /**
     * Get display name for type
     * @returns {string} Human-readable type name
     */
    getTypeDisplayName() {
        const typeNames = {
            [Prompt.TYPES.TEXT_GENERATION]: 'Generazione Testo',
            [Prompt.TYPES.IMAGE_GENERATION]: 'Generazione Immagini',
            [Prompt.TYPES.CODE]: 'Codice',
            [Prompt.TYPES.OTHER]: 'Altro'
        };
        
        return typeNames[this.type] || this.type;
    }
    
    /**
     * Get formatted tags string
     * @returns {string} Comma-separated tags
     */
    getTagsString() {
        return this.tags.join(', ');
    }
    
    /**
     * Check if prompt matches search query
     * @param {string} query - Search query
     * @returns {boolean} True if matches
     */
    matchesSearch(query) {
        if (!query || query.trim() === '') return true;
        
        const searchText = query.toLowerCase();
        const searchableFields = [
            this.title,
            this.prompt,
            this.notes,
            this.author,
            this.model,
            this.getTagsString(),
            this.getTypeDisplayName()
        ];
        
        return searchableFields.some(field => 
            field && field.toLowerCase().includes(searchText)
        );
    }
    
    /**
     * Get search relevance score
     * @param {string} query - Search query
     * @returns {number} Relevance score (0-100)
     */
    getSearchRelevance(query) {
        if (!query || query.trim() === '') return 0;
        
        const searchText = query.toLowerCase();
        let score = 0;
        
        // Title match (highest weight)
        if (this.title.toLowerCase().includes(searchText)) {
            score += 50;
            if (this.title.toLowerCase().startsWith(searchText)) {
                score += 25;
            }
        }
        
        // Prompt content match
        if (this.prompt.toLowerCase().includes(searchText)) {
            score += 20;
        }
        
        // Tags match
        if (this.getTagsString().toLowerCase().includes(searchText)) {
            score += 15;
        }
        
        // Other fields match
        const otherFields = [this.notes, this.author, this.model];
        otherFields.forEach(field => {
            if (field && field.toLowerCase().includes(searchText)) {
                score += 5;
            }
        });
        
        return Math.min(score, 100);
    }
    
    /**
     * Get word count of prompt
     * @returns {number} Word count
     */
    getWordCount() {
        return this.prompt.trim().split(/\s+/).filter(word => word.length > 0).length;
    }
    
    /**
     * Get character count of prompt
     * @returns {number} Character count
     */
    getCharacterCount() {
        return this.prompt.length;
    }
    
    /**
     * Check if prompt is empty
     * @returns {boolean} True if empty
     */
    isEmpty() {
        return !this.title.trim() && !this.prompt.trim();
    }
    
    /**
     * Get summary for display
     * @param {number} maxLength - Maximum length of summary
     * @returns {string} Summary text
     */
    getSummary(maxLength = 150) {
        const text = this.prompt.trim();
        if (text.length <= maxLength) return text;
        
        return text.substring(0, maxLength).trim() + '...';
    }
    
    /**
     * Export prompt for sharing
     * @param {string} format - Export format ('json', 'yaml')
     * @returns {string} Exported data
     */
    export(format = 'yaml') {
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(this.toObject(), null, 2);
            case 'yaml':
                return this.toYAML();
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    
    /**
     * Import prompt from various formats
     * @param {string} data - Import data
     * @param {string} format - Data format ('json', 'yaml', 'auto')
     * @returns {Prompt} Imported prompt
     */
    static import(data, format = 'auto') {
        try {
            let parsedData;
            
            if (format === 'auto') {
                // Try to detect format
                try {
                    parsedData = JSON.parse(data);
                    format = 'json';
                } catch {
                    try {
                        parsedData = jsyaml.load(data);
                        format = 'yaml';
                    } catch {
                        throw new Error('Unable to detect data format');
                    }
                }
            } else if (format === 'json') {
                parsedData = JSON.parse(data);
            } else if (format === 'yaml') {
                parsedData = jsyaml.load(data);
            } else {
                throw new Error(`Unsupported import format: ${format}`);
            }
            
            return new Prompt(parsedData);
        } catch (error) {
            throw new Error(`Failed to import prompt: ${error.message}`);
        }
    }
}

// Export for use in other modules
window.Prompt = Prompt;

