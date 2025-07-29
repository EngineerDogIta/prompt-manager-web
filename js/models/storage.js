/**
 * Storage Manager
 * Handles data persistence using localStorage with backup and recovery
 */

class StorageManager {
    static STORAGE_KEYS = {
        PROMPTS: 'prompt-manager-prompts',
        CATEGORIES: 'prompt-manager-categories',
        FAVORITES: 'prompt-manager-favorites',
        SETTINGS: 'prompt-manager-settings',
        BACKUP: 'prompt-manager-backup'
    };
    
    static BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
    static MAX_BACKUPS = 5;
    
    constructor() {
        this.prompts = new Map();
        this.categories = new Map();
        this.favorites = new Set();
        this.settings = {};
        this.backupTimer = null;
        
        this.init();
    }
    
    /**
     * Initialize storage manager
     */
    init() {
        this.loadData();
        this.startAutoBackup();
        
        // Listen for storage events from other tabs
        window.addEventListener('storage', (e) => {
            if (Object.values(StorageManager.STORAGE_KEYS).includes(e.key)) {
                this.handleStorageChange(e);
            }
        });
        
        // Backup before page unload
        window.addEventListener('beforeunload', () => {
            this.createBackup();
        });
    }
    
    /**
     * Load all data from storage
     */
    loadData() {
        try {
            this.loadPrompts();
            this.loadCategories();
            this.loadFavorites();
            this.loadSettings();
        } catch (error) {
            console.error('Failed to load data from storage:', error);
            this.attemptRecovery();
        }
    }
    
    /**
     * Load prompts from storage
     */
    loadPrompts() {
        const data = this.getFromStorage(StorageManager.STORAGE_KEYS.PROMPTS);
        if (data && Array.isArray(data)) {
            this.prompts.clear();
            data.forEach(promptData => {
                try {
                    const prompt = new Prompt(promptData);
                    this.prompts.set(prompt.id, prompt);
                } catch (error) {
                    console.warn('Failed to load prompt:', error);
                }
            });
        }
    }
    
    /**
     * Load categories from storage
     */
    loadCategories() {
        const data = this.getFromStorage(StorageManager.STORAGE_KEYS.CATEGORIES);
        if (data && typeof data === 'object') {
            this.categories = new Map(Object.entries(data));
        } else {
            // Initialize with default categories
            this.initializeDefaultCategories();
        }
    }
    
    /**
     * Load favorites from storage
     */
    loadFavorites() {
        const data = this.getFromStorage(StorageManager.STORAGE_KEYS.FAVORITES);
        if (data && Array.isArray(data)) {
            this.favorites = new Set(data);
        }
    }
    
    /**
     * Load settings from storage
     */
    loadSettings() {
        const data = this.getFromStorage(StorageManager.STORAGE_KEYS.SETTINGS);
        if (data && typeof data === 'object') {
            this.settings = { ...this.getDefaultSettings(), ...data };
        } else {
            this.settings = this.getDefaultSettings();
        }
    }
    
    /**
     * Get default settings
     * @returns {Object} Default settings
     */
    getDefaultSettings() {
        return {
            theme: 'light',
            autoSave: true,
            backupEnabled: true,
            searchDebounce: 300,
            itemsPerPage: 50,
            defaultCategory: 'general',
            sortBy: 'modified',
            sortOrder: 'desc'
        };
    }
    
    /**
     * Initialize default categories
     */
    initializeDefaultCategories() {
        const defaultCategories = {
            'favorites': { name: '⭐ Favorites', icon: 'star', color: '#fbbf24' },
            'productivity': { name: 'Productivity', icon: 'folder', color: '#3b82f6' },
            'linguaggi': { name: 'Linguaggi', icon: 'folder', color: '#10b981' },
            'linguaggi/java': { name: 'Java', icon: 'file', color: '#f59e0b' },
            'immagini': { name: 'Immagini', icon: 'folder', color: '#8b5cf6' },
            'llm': { name: 'LLM', icon: 'folder', color: '#ef4444' },
            'general': { name: 'Generale', icon: 'folder', color: '#6b7280' }
        };
        
        this.categories = new Map(Object.entries(defaultCategories));
        this.saveCategories();
    }
    
    /**
     * Save prompts to storage
     */
    savePrompts() {
        const data = Array.from(this.prompts.values()).map(prompt => prompt.toObject());
        this.saveToStorage(StorageManager.STORAGE_KEYS.PROMPTS, data);
    }
    
    /**
     * Save categories to storage
     */
    saveCategories() {
        const data = Object.fromEntries(this.categories);
        this.saveToStorage(StorageManager.STORAGE_KEYS.CATEGORIES, data);
    }
    
    /**
     * Save favorites to storage
     */
    saveFavorites() {
        const data = Array.from(this.favorites);
        this.saveToStorage(StorageManager.STORAGE_KEYS.FAVORITES, data);
    }
    
    /**
     * Save settings to storage
     */
    saveSettings() {
        this.saveToStorage(StorageManager.STORAGE_KEYS.SETTINGS, this.settings);
    }
    
    /**
     * Get data from localStorage
     * @param {string} key - Storage key
     * @returns {*} Parsed data or null
     */
    getFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Failed to get data from storage (${key}):`, error);
            return null;
        }
    }
    
    /**
     * Save data to localStorage
     * @param {string} key - Storage key
     * @param {*} data - Data to save
     */
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Failed to save data to storage (${key}):`, error);
            this.handleStorageError(error);
        }
    }
    
    /**
     * Handle storage errors (quota exceeded, etc.)
     * @param {Error} error - Storage error
     */
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            // Try to free up space
            this.cleanupOldBackups();
            
            // Notify user
            if (window.DOMUtils) {
                DOMUtils.showToast(
                    'Spazio di archiviazione esaurito. Alcuni dati potrebbero non essere salvati.',
                    'warning',
                    5000
                );
            }
        }
    }
    
    /**
     * Create backup of all data
     */
    createBackup() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                version: '1.0',
                data: {
                    prompts: Array.from(this.prompts.values()).map(p => p.toObject()),
                    categories: Object.fromEntries(this.categories),
                    favorites: Array.from(this.favorites),
                    settings: this.settings
                }
            };
            
            // Get existing backups
            const backups = this.getFromStorage(StorageManager.STORAGE_KEYS.BACKUP) || [];
            
            // Add new backup
            backups.unshift(backup);
            
            // Keep only recent backups
            const trimmedBackups = backups.slice(0, StorageManager.MAX_BACKUPS);
            
            this.saveToStorage(StorageManager.STORAGE_KEYS.BACKUP, trimmedBackups);
        } catch (error) {
            console.error('Failed to create backup:', error);
        }
    }
    
    /**
     * Restore from backup
     * @param {number} backupIndex - Index of backup to restore (0 = most recent)
     * @returns {boolean} Success status
     */
    restoreFromBackup(backupIndex = 0) {
        try {
            const backups = this.getFromStorage(StorageManager.STORAGE_KEYS.BACKUP) || [];
            
            if (backupIndex >= backups.length) {
                throw new Error('Backup not found');
            }
            
            const backup = backups[backupIndex];
            const { data } = backup;
            
            // Restore data
            this.prompts.clear();
            if (data.prompts) {
                data.prompts.forEach(promptData => {
                    const prompt = new Prompt(promptData);
                    this.prompts.set(prompt.id, prompt);
                });
            }
            
            if (data.categories) {
                this.categories = new Map(Object.entries(data.categories));
            }
            
            if (data.favorites) {
                this.favorites = new Set(data.favorites);
            }
            
            if (data.settings) {
                this.settings = { ...this.getDefaultSettings(), ...data.settings };
            }
            
            // Save restored data
            this.saveAll();
            
            return true;
        } catch (error) {
            console.error('Failed to restore from backup:', error);
            return false;
        }
    }
    
    /**
     * Get available backups
     * @returns {Array} List of backup metadata
     */
    getBackups() {
        const backups = this.getFromStorage(StorageManager.STORAGE_KEYS.BACKUP) || [];
        return backups.map((backup, index) => ({
            index,
            timestamp: backup.timestamp,
            version: backup.version,
            size: JSON.stringify(backup).length
        }));
    }
    
    /**
     * Clean up old backups
     */
    cleanupOldBackups() {
        const backups = this.getFromStorage(StorageManager.STORAGE_KEYS.BACKUP) || [];
        const trimmedBackups = backups.slice(0, Math.floor(StorageManager.MAX_BACKUPS / 2));
        this.saveToStorage(StorageManager.STORAGE_KEYS.BACKUP, trimmedBackups);
    }
    
    /**
     * Start automatic backup
     */
    startAutoBackup() {
        if (this.settings.backupEnabled) {
            this.backupTimer = setInterval(() => {
                this.createBackup();
            }, StorageManager.BACKUP_INTERVAL);
        }
    }
    
    /**
     * Stop automatic backup
     */
    stopAutoBackup() {
        if (this.backupTimer) {
            clearInterval(this.backupTimer);
            this.backupTimer = null;
        }
    }
    
    /**
     * Handle storage changes from other tabs
     * @param {StorageEvent} event - Storage event
     */
    handleStorageChange(event) {
        // Reload data when changed in another tab
        this.loadData();
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('storagechange', {
            detail: { key: event.key, newValue: event.newValue }
        }));
    }
    
    /**
     * Attempt recovery from corruption
     */
    attemptRecovery() {
        console.warn('Attempting data recovery...');
        
        // Try to restore from most recent backup
        if (this.restoreFromBackup(0)) {
            if (window.DOMUtils) {
                DOMUtils.showToast(
                    'Dati ripristinati dal backup più recente.',
                    'success'
                );
            }
        } else {
            // Initialize with defaults
            this.prompts.clear();
            this.initializeDefaultCategories();
            this.favorites.clear();
            this.settings = this.getDefaultSettings();
            
            if (window.DOMUtils) {
                DOMUtils.showToast(
                    'Dati inizializzati con valori predefiniti.',
                    'warning'
                );
            }
        }
    }
    
    /**
     * Save all data
     */
    saveAll() {
        this.savePrompts();
        this.saveCategories();
        this.saveFavorites();
        this.saveSettings();
    }
    
    /**
     * Clear all data
     */
    clearAll() {
        this.prompts.clear();
        this.categories.clear();
        this.favorites.clear();
        this.settings = this.getDefaultSettings();
        
        // Clear storage
        Object.values(StorageManager.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
    
    /**
     * Export all data
     * @param {string} format - Export format ('json', 'yaml')
     * @returns {string} Exported data
     */
    exportData(format = 'json') {
        const data = {
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0',
                format: format
            },
            prompts: Array.from(this.prompts.values()).map(p => p.toObject()),
            categories: Object.fromEntries(this.categories),
            favorites: Array.from(this.favorites),
            settings: this.settings
        };
        
        if (format === 'yaml') {
            return jsyaml.dump(data, { indent: 2 });
        } else {
            return JSON.stringify(data, null, 2);
        }
    }
    
    /**
     * Import data
     * @param {string} data - Data to import
     * @param {string} format - Data format ('json', 'yaml', 'auto')
     * @param {boolean} merge - Whether to merge with existing data
     * @returns {Object} Import result
     */
    importData(data, format = 'auto', merge = false) {
        try {
            let parsedData;
            
            if (format === 'auto') {
                try {
                    parsedData = JSON.parse(data);
                } catch {
                    parsedData = jsyaml.load(data);
                }
            } else if (format === 'json') {
                parsedData = JSON.parse(data);
            } else if (format === 'yaml') {
                parsedData = jsyaml.load(data);
            }
            
            const result = {
                imported: 0,
                skipped: 0,
                errors: []
            };
            
            if (!merge) {
                this.clearAll();
            }
            
            // Import prompts
            if (parsedData.prompts && Array.isArray(parsedData.prompts)) {
                parsedData.prompts.forEach(promptData => {
                    try {
                        const prompt = new Prompt(promptData);
                        if (!merge || !this.prompts.has(prompt.id)) {
                            this.prompts.set(prompt.id, prompt);
                            result.imported++;
                        } else {
                            result.skipped++;
                        }
                    } catch (error) {
                        result.errors.push(`Failed to import prompt: ${error.message}`);
                    }
                });
            }
            
            // Import categories
            if (parsedData.categories) {
                Object.entries(parsedData.categories).forEach(([key, value]) => {
                    this.categories.set(key, value);
                });
            }
            
            // Import favorites
            if (parsedData.favorites && Array.isArray(parsedData.favorites)) {
                parsedData.favorites.forEach(id => {
                    this.favorites.add(id);
                });
            }
            
            // Import settings
            if (parsedData.settings) {
                this.settings = { ...this.settings, ...parsedData.settings };
            }
            
            this.saveAll();
            return result;
            
        } catch (error) {
            throw new Error(`Failed to import data: ${error.message}`);
        }
    }
    
    /**
     * Get storage usage statistics
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        const stats = {
            prompts: this.prompts.size,
            categories: this.categories.size,
            favorites: this.favorites.size,
            totalSize: 0,
            breakdown: {}
        };
        
        Object.entries(StorageManager.STORAGE_KEYS).forEach(([name, key]) => {
            const data = localStorage.getItem(key);
            const size = data ? data.length : 0;
            stats.breakdown[name] = size;
            stats.totalSize += size;
        });
        
        return stats;
    }
}

// Export for use in other modules
window.StorageManager = StorageManager;

