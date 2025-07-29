/**
 * Search Controller
 * Handles search functionality with debouncing and filtering
 */

class SearchController {
    constructor(storageManager, treeView) {
        this.storage = storageManager;
        this.treeView = treeView;
        this.searchInput = null;
        this.clearButton = null;
        this.searchTimeout = null;
        this.debounceMs = 300;
        this.currentQuery = '';
        this.searchHistory = [];
        this.maxHistoryItems = 10;
        
        this.init();
    }
    
    /**
     * Initialize search controller
     */
    init() {
        this.searchInput = document.getElementById('search-input');
        this.clearButton = document.getElementById('search-clear');
        
        this.setupEventListeners();
        this.loadSearchHistory();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        if (this.searchInput) {
            // Input events
            this.searchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
            
            // Keyboard events
            this.searchInput.addEventListener('keydown', (e) => {
                this.handleKeyDown(e);
            });
            
            // Focus events
            this.searchInput.addEventListener('focus', () => {
                this.handleFocus();
            });
            
            this.searchInput.addEventListener('blur', () => {
                this.handleBlur();
            });
        }
        
        if (this.clearButton) {
            this.clearButton.addEventListener('click', () => {
                this.clearSearch();
            });
        }
        
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });
        
        // Storage changes
        window.addEventListener('storagechange', () => {
            if (this.currentQuery) {
                this.performSearch(this.currentQuery);
            }
        });
    }
    
    /**
     * Handle search input
     * @param {string} query - Search query
     */
    handleSearchInput(query) {
        this.currentQuery = query.trim();
        
        // Clear previous timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Update clear button visibility
        this.updateClearButton();
        
        // Debounce search
        this.searchTimeout = setTimeout(() => {
            this.performSearch(this.currentQuery);
        }, this.debounceMs);
    }
    
    /**
     * Handle keyboard events
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyDown(e) {
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.executeSearch();
                break;
                
            case 'Escape':
                this.clearSearch();
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.navigateToResults();
                break;
                
            case 'ArrowUp':
                if (this.searchHistory.length > 0) {
                    e.preventDefault();
                    this.showSearchHistory();
                }
                break;
        }
    }
    
    /**
     * Handle global keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleGlobalKeyboard(e) {
        // Ctrl+F or Cmd+F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            this.focusSearch();
        }
        
        // Escape to clear search when not in input
        if (e.key === 'Escape' && document.activeElement !== this.searchInput) {
            if (this.currentQuery) {
                this.clearSearch();
            }
        }
    }
    
    /**
     * Handle search input focus
     */
    handleFocus() {
        // Select all text for easy replacement
        if (this.searchInput.value) {
            this.searchInput.select();
        }
    }
    
    /**
     * Handle search input blur
     */
    handleBlur() {
        // Hide search suggestions if any
        this.hideSearchSuggestions();
    }
    
    /**
     * Perform search
     * @param {string} query - Search query
     */
    performSearch(query) {
        if (!query) {
            this.clearSearchResults();
            return;
        }
        
        // Get all prompts
        const prompts = Array.from(this.storage.prompts.values());
        
        // Filter and score prompts
        const results = prompts
            .map(prompt => ({
                prompt,
                relevance: prompt.getSearchRelevance(query),
                matches: prompt.matchesSearch(query)
            }))
            .filter(result => result.matches)
            .sort((a, b) => b.relevance - a.relevance);
        
        // Apply search filter to tree view
        this.applySearchFilter(query, results);
        
        // Update search status
        this.updateSearchStatus(query, results.length);
        
        // Dispatch search event
        window.dispatchEvent(new CustomEvent('search-performed', {
            detail: { query, results: results.length }
        }));
    }
    
    /**
     * Apply search filter to tree view
     * @param {string} query - Search query
     * @param {Array} results - Search results
     */
    applySearchFilter(query, results) {
        if (this.treeView) {
            this.treeView.applySearchFilter(query);
        }
    }
    
    /**
     * Clear search results
     */
    clearSearchResults() {
        if (this.treeView) {
            this.treeView.clearSearchFilter();
        }
        
        this.updateSearchStatus('', 0);
    }
    
    /**
     * Execute immediate search (on Enter)
     */
    executeSearch() {
        // Clear timeout and search immediately
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        const query = this.currentQuery;
        this.performSearch(query);
        
        // Add to search history
        if (query) {
            this.addToSearchHistory(query);
        }
        
        // Navigate to first result
        this.navigateToResults();
    }
    
    /**
     * Clear search
     */
    clearSearch() {
        this.searchInput.value = '';
        this.currentQuery = '';
        this.clearSearchResults();
        this.updateClearButton();
        
        // Clear timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Focus search input
        this.searchInput.focus();
    }
    
    /**
     * Focus search input
     */
    focusSearch() {
        if (this.searchInput) {
            this.searchInput.focus();
        }
    }
    
    /**
     * Navigate to search results
     */
    navigateToResults() {
        // Focus first visible prompt in tree view
        if (this.treeView && this.treeView.container) {
            const firstPrompt = this.treeView.container.querySelector(
                '.tree-node[data-type="prompt"]:not([style*="display: none"]) .tree-node__content'
            );
            
            if (firstPrompt) {
                firstPrompt.focus();
                firstPrompt.click();
            }
        }
    }
    
    /**
     * Update clear button visibility
     */
    updateClearButton() {
        if (this.clearButton) {
            this.clearButton.style.display = this.currentQuery ? 'block' : 'none';
        }
    }
    
    /**
     * Update search status
     * @param {string} query - Search query
     * @param {number} resultCount - Number of results
     */
    updateSearchStatus(query, resultCount) {
        // Update placeholder text
        if (this.searchInput) {
            if (query) {
                this.searchInput.setAttribute('title', `${resultCount} risultati per "${query}"`);
            } else {
                this.searchInput.setAttribute('title', 'Cerca prompt...');
            }
        }
        
        // Update search input styling
        if (this.searchInput) {
            this.searchInput.classList.toggle('search-input--has-results', resultCount > 0);
            this.searchInput.classList.toggle('search-input--no-results', query && resultCount === 0);
        }
    }
    
    /**
     * Add query to search history
     * @param {string} query - Search query
     */
    addToSearchHistory(query) {
        if (!query || this.searchHistory.includes(query)) {
            return;
        }
        
        this.searchHistory.unshift(query);
        
        // Limit history size
        if (this.searchHistory.length > this.maxHistoryItems) {
            this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
        }
        
        this.saveSearchHistory();
    }
    
    /**
     * Show search history
     */
    showSearchHistory() {
        if (this.searchHistory.length === 0) {
            return;
        }
        
        // Create suggestions dropdown
        this.createSearchSuggestions(this.searchHistory);
    }
    
    /**
     * Create search suggestions dropdown
     * @param {Array} suggestions - Suggestion items
     */
    createSearchSuggestions(suggestions) {
        // Remove existing suggestions
        this.hideSearchSuggestions();
        
        const dropdown = DOMUtils.createElement('div', {
            className: 'search-suggestions',
            id: 'search-suggestions'
        });
        
        suggestions.forEach((suggestion, index) => {
            const item = DOMUtils.createElement('button', {
                className: 'search-suggestions__item',
                onclick: () => this.selectSuggestion(suggestion)
            });
            
            const icon = DOMUtils.createIcon('search');
            icon.setAttribute('class', 'search-suggestions__icon');
            
            const text = DOMUtils.createElement('span', {
                className: 'search-suggestions__text'
            }, suggestion);
            
            item.appendChild(icon);
            item.appendChild(text);
            dropdown.appendChild(item);
        });
        
        // Position dropdown
        const searchContainer = this.searchInput.parentElement;
        searchContainer.style.position = 'relative';
        dropdown.style.position = 'absolute';
        dropdown.style.top = '100%';
        dropdown.style.left = '0';
        dropdown.style.right = '0';
        dropdown.style.zIndex = '1000';
        
        searchContainer.appendChild(dropdown);
        
        // Hide on outside click
        setTimeout(() => {
            document.addEventListener('click', this.hideSuggestionsOnOutsideClick);
        }, 0);
    }
    
    /**
     * Hide search suggestions
     */
    hideSearchSuggestions() {
        const suggestions = document.getElementById('search-suggestions');
        if (suggestions) {
            suggestions.remove();
        }
        
        document.removeEventListener('click', this.hideSuggestionsOnOutsideClick);
    }
    
    /**
     * Hide suggestions on outside click
     * @param {Event} e - Click event
     */
    hideSuggestionsOnOutsideClick = (e) => {
        const suggestions = document.getElementById('search-suggestions');
        if (suggestions && !suggestions.contains(e.target) && e.target !== this.searchInput) {
            this.hideSearchSuggestions();
        }
    }
    
    /**
     * Select suggestion
     * @param {string} suggestion - Selected suggestion
     */
    selectSuggestion(suggestion) {
        this.searchInput.value = suggestion;
        this.currentQuery = suggestion;
        this.hideSearchSuggestions();
        this.executeSearch();
    }
    
    /**
     * Get search suggestions based on current input
     * @param {string} query - Current query
     * @returns {Array} Suggestions array
     */
    getSearchSuggestions(query) {
        if (!query) {
            return this.searchHistory.slice(0, 5);
        }
        
        const suggestions = [];
        
        // Add matching history items
        const matchingHistory = this.searchHistory.filter(item =>
            item.toLowerCase().includes(query.toLowerCase())
        );
        suggestions.push(...matchingHistory);
        
        // Add tag suggestions
        const allTags = new Set();
        this.storage.prompts.forEach(prompt => {
            prompt.tags.forEach(tag => allTags.add(tag));
        });
        
        const matchingTags = Array.from(allTags).filter(tag =>
            tag.toLowerCase().includes(query.toLowerCase()) &&
            !suggestions.includes(tag)
        );
        suggestions.push(...matchingTags.slice(0, 3));
        
        // Add model suggestions
        const allModels = new Set();
        this.storage.prompts.forEach(prompt => {
            if (prompt.model) {
                allModels.add(prompt.model);
            }
        });
        
        const matchingModels = Array.from(allModels).filter(model =>
            model.toLowerCase().includes(query.toLowerCase()) &&
            !suggestions.includes(model)
        );
        suggestions.push(...matchingModels.slice(0, 2));
        
        return suggestions.slice(0, 8);
    }
    
    /**
     * Save search history to storage
     */
    saveSearchHistory() {
        try {
            localStorage.setItem('prompt-manager-search-history', JSON.stringify(this.searchHistory));
        } catch (error) {
            console.warn('Failed to save search history:', error);
        }
    }
    
    /**
     * Load search history from storage
     */
    loadSearchHistory() {
        try {
            const data = localStorage.getItem('prompt-manager-search-history');
            if (data) {
                this.searchHistory = JSON.parse(data);
            }
        } catch (error) {
            console.warn('Failed to load search history:', error);
            this.searchHistory = [];
        }
    }
    
    /**
     * Clear search history
     */
    clearSearchHistory() {
        this.searchHistory = [];
        this.saveSearchHistory();
    }
    
    /**
     * Get current search query
     * @returns {string} Current query
     */
    getCurrentQuery() {
        return this.currentQuery;
    }
    
    /**
     * Set search query programmatically
     * @param {string} query - Query to set
     * @param {boolean} execute - Whether to execute search immediately
     */
    setQuery(query, execute = true) {
        this.searchInput.value = query;
        this.currentQuery = query;
        this.updateClearButton();
        
        if (execute) {
            this.executeSearch();
        }
    }
    
    /**
     * Get search statistics
     * @returns {Object} Search statistics
     */
    getSearchStats() {
        const totalPrompts = this.storage.prompts.size;
        let visiblePrompts = 0;
        
        if (this.currentQuery && this.treeView) {
            const visibleNodes = this.treeView.container.querySelectorAll(
                '.tree-node[data-type="prompt"]:not([style*="display: none"])'
            );
            visiblePrompts = visibleNodes.length;
        } else {
            visiblePrompts = totalPrompts;
        }
        
        return {
            query: this.currentQuery,
            totalPrompts,
            visiblePrompts,
            filteredCount: totalPrompts - visiblePrompts,
            historySize: this.searchHistory.length
        };
    }
    
    /**
     * Export search data
     * @returns {Object} Search data
     */
    exportSearchData() {
        return {
            history: [...this.searchHistory],
            currentQuery: this.currentQuery,
            settings: {
                debounceMs: this.debounceMs,
                maxHistoryItems: this.maxHistoryItems
            }
        };
    }
    
    /**
     * Import search data
     * @param {Object} data - Search data to import
     */
    importSearchData(data) {
        if (data.history && Array.isArray(data.history)) {
            this.searchHistory = data.history.slice(0, this.maxHistoryItems);
            this.saveSearchHistory();
        }
        
        if (data.settings) {
            if (data.settings.debounceMs) {
                this.debounceMs = data.settings.debounceMs;
            }
            if (data.settings.maxHistoryItems) {
                this.maxHistoryItems = data.settings.maxHistoryItems;
            }
        }
    }
    
    /**
     * Destroy search controller
     */
    destroy() {
        // Clear timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Remove event listeners
        document.removeEventListener('click', this.hideSuggestionsOnOutsideClick);
        
        // Hide suggestions
        this.hideSearchSuggestions();
        
        // Clear search
        this.clearSearch();
    }
}

// Export for use in other modules
window.SearchController = SearchController;

