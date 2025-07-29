/**
 * Prompt Viewer Component
 * Displays prompt details in structured and YAML views
 */

class PromptViewer {
    constructor(container, storageManager) {
        this.container = container;
        this.storage = storageManager;
        this.currentPrompt = null;
        this.currentView = 'structured'; // 'structured' or 'yaml'
        
        this.init();
    }
    
    /**
     * Initialize prompt viewer
     */
    init() {
        this.setupEventListeners();
        this.showWelcomeScreen();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Tab switching
        const structuredTab = document.getElementById('tab-structured');
        const yamlTab = document.getElementById('tab-yaml');
        
        if (structuredTab) {
            structuredTab.addEventListener('click', () => {
                this.switchView('structured');
            });
        }
        
        if (yamlTab) {
            yamlTab.addEventListener('click', () => {
                this.switchView('yaml');
            });
        }
        
        // Action buttons
        const copyBtn = document.getElementById('copy-prompt-btn');
        const editBtn = document.getElementById('edit-prompt-btn');
        const deleteBtn = document.getElementById('delete-prompt-btn');
        
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                this.copyPromptToClipboard();
            });
        }
        
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                this.editCurrentPrompt();
            });
        }
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                this.deleteCurrentPrompt();
            });
        }
        
        // Listen for prompt selection events
        window.addEventListener('prompt-selected', (e) => {
            this.showPrompt(e.detail.promptId);
        });
        
        window.addEventListener('prompt-deselected', () => {
            this.showWelcomeScreen();
        });
        
        // Listen for prompt updates
        window.addEventListener('prompt-updated', (e) => {
            if (this.currentPrompt && this.currentPrompt.id === e.detail.promptId) {
                this.showPrompt(e.detail.promptId);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.currentPrompt) {
                this.handleKeyboardShortcuts(e);
            }
        });
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        // Only handle shortcuts when viewer is active and no input is focused
        if (document.activeElement.tagName === 'INPUT' || 
            document.activeElement.tagName === 'TEXTAREA') {
            return;
        }
        
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'c':
                    e.preventDefault();
                    this.copyPromptToClipboard();
                    break;
                case 'e':
                    e.preventDefault();
                    this.editCurrentPrompt();
                    break;
                case 'd':
                    e.preventDefault();
                    this.toggleFavorite();
                    break;
            }
        } else {
            switch (e.key) {
                case 'Delete':
                    this.deleteCurrentPrompt();
                    break;
                case 'Tab':
                    e.preventDefault();
                    this.switchView(this.currentView === 'structured' ? 'yaml' : 'structured');
                    break;
            }
        }
    }
    
    /**
     * Show welcome screen
     */
    showWelcomeScreen() {
        this.currentPrompt = null;
        
        const welcomeScreen = document.getElementById('welcome-screen');
        const promptViewer = document.getElementById('prompt-viewer');
        
        if (welcomeScreen) {
            welcomeScreen.style.display = 'flex';
        }
        
        if (promptViewer) {
            promptViewer.style.display = 'none';
        }
    }
    
    /**
     * Show prompt details
     * @param {string} promptId - Prompt ID to display
     */
    showPrompt(promptId) {
        const prompt = this.storage.prompts.get(promptId);
        if (!prompt) {
            this.showWelcomeScreen();
            return;
        }
        
        this.currentPrompt = prompt;
        
        const welcomeScreen = document.getElementById('welcome-screen');
        const promptViewer = document.getElementById('prompt-viewer');
        
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
        
        if (promptViewer) {
            promptViewer.style.display = 'flex';
        }
        
        this.renderPromptContent();
    }
    
    /**
     * Render prompt content
     */
    renderPromptContent() {
        if (!this.currentPrompt) return;
        
        this.renderStructuredView();
        this.renderYamlView();
        this.updateActionButtons();
    }
    
    /**
     * Render structured view
     */
    renderStructuredView() {
        const container = document.getElementById('structured-view');
        if (!container) return;
        
        container.innerHTML = '';
        
        const prompt = this.currentPrompt;
        
        // Title section
        const titleSection = this.createFieldGroup('Titolo');
        titleSection.appendChild(this.createField('Titolo', prompt.title));
        container.appendChild(titleSection);
        
        // Metadata section
        const metadataSection = this.createFieldGroup('Metadati');
        
        metadataSection.appendChild(this.createField('Tipo', prompt.getTypeDisplayName()));
        
        if (prompt.model) {
            metadataSection.appendChild(this.createField('Modello', prompt.model));
        }
        
        if (prompt.author) {
            metadataSection.appendChild(this.createField('Autore', prompt.author));
        }
        
        metadataSection.appendChild(this.createField('Versione', prompt.version));
        metadataSection.appendChild(this.createField('Creato', DOMUtils.formatDate(prompt.created)));
        metadataSection.appendChild(this.createField('Modificato', DOMUtils.formatDate(prompt.modified)));
        
        if (prompt.tags && prompt.tags.length > 0) {
            metadataSection.appendChild(this.createTagsField('Tag', prompt.tags));
        }
        
        container.appendChild(metadataSection);
        
        // Content section
        const contentSection = this.createFieldGroup('Contenuto del Prompt');
        contentSection.appendChild(this.createCodeField('Prompt', prompt.prompt));
        
        if (prompt.negative_prompt) {
            contentSection.appendChild(this.createCodeField('Prompt Negativo', prompt.negative_prompt));
        }
        
        if (prompt.notes) {
            contentSection.appendChild(this.createField('Note', prompt.notes));
        }
        
        container.appendChild(contentSection);
        
        // Statistics section
        const statsSection = this.createFieldGroup('Statistiche');
        statsSection.appendChild(this.createField('Caratteri', prompt.getCharacterCount().toLocaleString()));
        statsSection.appendChild(this.createField('Parole', prompt.getWordCount().toLocaleString()));
        
        if (prompt.category) {
            statsSection.appendChild(this.createField('Categoria', prompt.category));
        }
        
        statsSection.appendChild(this.createField('Preferito', prompt.isFavorite ? 'Sì' : 'No'));
        
        container.appendChild(statsSection);
    }
    
    /**
     * Render YAML view
     */
    renderYamlView() {
        const container = document.getElementById('yaml-content');
        if (!container) return;
        
        const yamlContent = this.currentPrompt.toYAML();
        container.textContent = yamlContent;
        
        // Apply syntax highlighting if available
        // this.applySyntaxHighlighting(container);
    }
    
    /**
     * Apply basic syntax highlighting to YAML
     * @param {Element} container - Container element
     */
    applySyntaxHighlighting(container) {
        const content = container.textContent;
        const lines = content.split('\n');
        
        const highlightedLines = lines.map(line => {
            // Highlight keys (before colon)
            line = line.replace(/^(\s*)([^:]+)(:)/gm, 
                '$1<span style="color: var(--syntax-keyword)">$2</span><span style="color: var(--syntax-punctuation)">$3</span>');
            
            // Highlight strings (quoted values)
            line = line.replace(/"([^"]*)"/g, 
                '<span style="color: var(--syntax-string)">"$1"</span>');
            
            // Highlight numbers
            line = line.replace(/\b(\d+)\b/g, 
                '<span style="color: var(--syntax-number)">$1</span>');
            
            // Highlight comments
            line = line.replace(/(#.*$)/gm, 
                '<span style="color: var(--syntax-comment)">$1</span>');
            
            return line;
        });
        
        container.innerHTML = highlightedLines.join('\n');
    }
    
    /**
     * Create field group
     * @param {string} title - Group title
     * @returns {Element} Field group element
     */
    createFieldGroup(title) {
        const group = DOMUtils.createElement('div', {
            className: 'field-group'
        });
        
        const titleElement = DOMUtils.createElement('h3', {
            className: 'field-group__title'
        }, title);
        
        group.appendChild(titleElement);
        return group;
    }
    
    /**
     * Create field
     * @param {string} label - Field label
     * @param {string} value - Field value
     * @returns {Element} Field element
     */
    createField(label, value) {
        const field = DOMUtils.createElement('div', {
            className: 'field'
        });
        
        const labelElement = DOMUtils.createElement('label', {
            className: 'field__label'
        }, label);
        
        const valueElement = DOMUtils.createElement('div', {
            className: 'field__value'
        }, value || 'Non specificato');
        
        field.appendChild(labelElement);
        field.appendChild(valueElement);
        
        return field;
    }
    
    /**
     * Create code field
     * @param {string} label - Field label
     * @param {string} value - Field value
     * @returns {Element} Field element
     */
    createCodeField(label, value) {
        const field = DOMUtils.createElement('div', {
            className: 'field'
        });
        
        const labelElement = DOMUtils.createElement('label', {
            className: 'field__label'
        }, label);
        
        const valueElement = DOMUtils.createElement('div', {
            className: 'field__value field__value--code'
        }, value || 'Non specificato');
        
        field.appendChild(labelElement);
        field.appendChild(valueElement);
        
        return field;
    }
    
    /**
     * Create tags field
     * @param {string} label - Field label
     * @param {Array} tags - Tags array
     * @returns {Element} Field element
     */
    createTagsField(label, tags) {
        const field = DOMUtils.createElement('div', {
            className: 'field'
        });
        
        const labelElement = DOMUtils.createElement('label', {
            className: 'field__label'
        }, label);
        
        const valueElement = DOMUtils.createElement('div', {
            className: 'field__value field__value--tags'
        });
        
        tags.forEach(tag => {
            const tagElement = DOMUtils.createElement('span', {
                className: 'tag'
            }, tag);
            valueElement.appendChild(tagElement);
        });
        
        field.appendChild(labelElement);
        field.appendChild(valueElement);
        
        return field;
    }
    
    /**
     * Switch between views
     * @param {string} view - View name ('structured' or 'yaml')
     */
    switchView(view) {
        this.currentView = view;
        
        const structuredTab = document.getElementById('tab-structured');
        const yamlTab = document.getElementById('tab-yaml');
        const structuredView = document.getElementById('structured-view');
        const yamlView = document.getElementById('yaml-view');
        
        // Update tab states
        if (structuredTab && yamlTab) {
            structuredTab.classList.toggle('tab--active', view === 'structured');
            yamlTab.classList.toggle('tab--active', view === 'yaml');
        }
        
        // Update view visibility
        if (structuredView && yamlView) {
            structuredView.style.display = view === 'structured' ? 'block' : 'none';
            yamlView.style.display = view === 'yaml' ? 'block' : 'none';
        }
    }
    
    /**
     * Update action buttons state
     */
    updateActionButtons() {
        const copyBtn = document.getElementById('copy-prompt-btn');
        const editBtn = document.getElementById('edit-prompt-btn');
        const deleteBtn = document.getElementById('delete-prompt-btn');
        
        const hasPrompt = this.currentPrompt !== null;
        
        if (copyBtn) {
            copyBtn.disabled = !hasPrompt;
        }
        
        if (editBtn) {
            editBtn.disabled = !hasPrompt;
        }
        
        if (deleteBtn) {
            deleteBtn.disabled = !hasPrompt;
        }
    }
    
    /**
     * Copy prompt to clipboard
     */
    async copyPromptToClipboard() {
        if (!this.currentPrompt) return;
        
        const textToCopy = this.currentView === 'yaml' 
            ? this.currentPrompt.toYAML()
            : this.currentPrompt.prompt;
        
        const success = await DOMUtils.copyToClipboard(textToCopy);
        
        if (success) {
            DOMUtils.showToast('Prompt copiato negli appunti', 'success');
        } else {
            DOMUtils.showToast('Errore durante la copia', 'error');
        }
    }
    
    /**
     * Edit current prompt
     */
    editCurrentPrompt() {
        if (!this.currentPrompt) return;
        
        window.dispatchEvent(new CustomEvent('prompt-edit', {
            detail: { promptId: this.currentPrompt.id }
        }));
    }
    
    /**
     * Delete current prompt
     */
    deleteCurrentPrompt() {
        if (!this.currentPrompt) return;
        
        const promptTitle = this.currentPrompt.title;
        
        if (confirm(`Sei sicuro di voler eliminare il prompt "${promptTitle}"?`)) {
            const promptId = this.currentPrompt.id;
            
            // Remove from storage
            this.storage.prompts.delete(promptId);
            this.storage.favorites.delete(promptId);
            
            this.storage.savePrompts();
            this.storage.saveFavorites();
            
            // Clear current view
            this.showWelcomeScreen();
            
            // Notify other components
            window.dispatchEvent(new CustomEvent('prompt-deleted', {
                detail: { promptId }
            }));
            
            DOMUtils.showToast('Prompt eliminato', 'success');
        }
    }
    
    /**
     * Toggle favorite status
     */
    toggleFavorite() {
        if (!this.currentPrompt) return;
        
        const newFavoriteStatus = !this.currentPrompt.isFavorite;
        this.currentPrompt.update({ isFavorite: newFavoriteStatus });
        
        if (newFavoriteStatus) {
            this.storage.favorites.add(this.currentPrompt.id);
        } else {
            this.storage.favorites.delete(this.currentPrompt.id);
        }
        
        this.storage.savePrompts();
        this.storage.saveFavorites();
        
        // Update display
        this.renderPromptContent();
        
        // Notify other components
        window.dispatchEvent(new CustomEvent('prompt-updated', {
            detail: { promptId: this.currentPrompt.id }
        }));
        
        const message = newFavoriteStatus ? 'Aggiunto ai preferiti' : 'Rimosso dai preferiti';
        DOMUtils.showToast(message, 'success');
    }
    
    /**
     * Export current prompt
     * @param {string} format - Export format ('json', 'yaml')
     */
    exportPrompt(format = 'yaml') {
        if (!this.currentPrompt) return;
        
        try {
            const exportData = this.currentPrompt.export(format);
            const filename = this.currentPrompt.getFilename();
            
            // Create download link
            const blob = new Blob([exportData], { 
                type: format === 'json' ? 'application/json' : 'text/yaml' 
            });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            
            URL.revokeObjectURL(url);
            
            DOMUtils.showToast('Prompt esportato', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            DOMUtils.showToast('Errore durante l\'esportazione', 'error');
        }
    }
    
    /**
     * Get current prompt
     * @returns {Prompt|null} Current prompt
     */
    getCurrentPrompt() {
        return this.currentPrompt;
    }
    
    /**
     * Refresh viewer content
     */
    refresh() {
        if (this.currentPrompt) {
            this.renderPromptContent();
        }
    }
    
    /**
     * Clear viewer
     */
    clear() {
        this.showWelcomeScreen();
    }
}

// Export for use in other modules
window.PromptViewer = PromptViewer;

