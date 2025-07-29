/**
 * Application Controller
 * Main controller that coordinates all components
 */

class AppController {
    constructor() {
        this.storage = null;
        this.treeView = null;
        this.promptViewer = null;
        this.promptEditor = null;
        this.searchController = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    /**
     * Initialize application
     */
    async init() {
        try {
            // Show loading state
            this.showLoadingState();
            
            // Initialize storage
            this.storage = new StorageManager();
            
            // Initialize components
            await this.initializeComponents();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Setup keyboard shortcuts
            this.setupKeyboardShortcuts();
            
            // Initialize sample data if empty
            this.initializeSampleData();
            
            // Hide loading state
            this.hideLoadingState();
            
            this.isInitialized = true;
            
            // Dispatch ready event
            window.dispatchEvent(new CustomEvent('app-ready'));
            
            console.log('Prompt Collection Manager initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showErrorState(error);
        }
    }
    
    /**
     * Show loading state
     */
    showLoadingState() {
        const app = document.getElementById('app');
        if (app) {
            app.classList.add('app--loading');
        }
        
        // Show loading message
        DOMUtils.showToast('Caricamento in corso...', 'info', 0);
    }
    
    /**
     * Hide loading state
     */
    hideLoadingState() {
        const app = document.getElementById('app');
        if (app) {
            app.classList.remove('app--loading');
        }
        
        // Hide loading toast
        const toasts = document.querySelectorAll('.toast--info');
        toasts.forEach(toast => {
            if (toast.textContent.includes('Caricamento')) {
                toast.remove();
            }
        });
    }
    
    /**
     * Show error state
     * @param {Error} error - Error object
     */
    showErrorState(error) {
        const errorMessage = `Errore durante l'inizializzazione: ${error.message}`;
        DOMUtils.showToast(errorMessage, 'error', 0);
        
        // Show error in welcome screen
        const welcomeScreen = document.getElementById('welcome-screen');
        if (welcomeScreen) {
            const content = welcomeScreen.querySelector('.welcome-screen__content');
            if (content) {
                content.innerHTML = `
                    <h2>Errore di Inizializzazione</h2>
                    <p>${errorMessage}</p>
                    <div class="welcome-screen__actions">
                        <button class="btn btn--primary" onclick="location.reload()">
                            Ricarica Pagina
                        </button>
                    </div>
                `;
            }
        }
    }
    
    /**
     * Initialize components
     */
    async initializeComponents() {
        // Initialize tree view
        const treeContainer = document.getElementById('tree-view');
        if (treeContainer) {
            this.treeView = new TreeView(treeContainer, this.storage);
        }
        
        // Initialize prompt viewer
        const contentArea = document.getElementById('content-area');
        if (contentArea) {
            this.promptViewer = new PromptViewer(contentArea, this.storage);
        }
        
        // Initialize prompt editor
        this.promptEditor = new PromptEditor(this.storage);
        
        // Initialize search controller
        if (this.treeView) {
            this.searchController = new SearchController(this.storage, this.treeView);
        }
        
        // Wait for components to be ready
        await this.waitForComponentsReady();
    }
    
    /**
     * Wait for components to be ready
     */
    async waitForComponentsReady() {
        return new Promise((resolve) => {
            // Simple timeout to ensure DOM is ready
            setTimeout(resolve, 100);
        });
    }
    
    /**
     * Setup global event listeners
     */
    setupGlobalEventListeners() {
        // Button event listeners
        this.setupButtonEventListeners();
        
        // Component communication events
        this.setupComponentEvents();
        
        // Window events
        this.setupWindowEvents();
        
        // Storage events
        this.setupStorageEvents();
    }
    
    /**
     * Setup button event listeners
     */
    setupButtonEventListeners() {
        // Add prompt button
        const addPromptBtn = document.getElementById('add-prompt-btn');
        if (addPromptBtn) {
            addPromptBtn.addEventListener('click', () => {
                this.createNewPrompt();
            });
        }
        
        // Add folder button
        const addFolderBtn = document.getElementById('add-folder-btn');
        if (addFolderBtn) {
            addFolderBtn.addEventListener('click', () => {
                this.createNewFolder();
            });
        }
        
        // Import button
        const importBtn = document.getElementById('import-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                this.importData();
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
        
        // Expand/Collapse all buttons
        const expandAllBtn = document.getElementById('expand-all-btn');
        if (expandAllBtn) {
            expandAllBtn.addEventListener('click', () => {
                if (this.treeView) this.treeView.expandAll();
            });
        }

        const collapseAllBtn = document.getElementById('collapse-all-btn');
        if (collapseAllBtn) {
            collapseAllBtn.addEventListener('click', () => {
                if (this.treeView) this.treeView.collapseAll();
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }
    }
    
    /**
     * Setup component communication events
     */
    setupComponentEvents() {
        // Prompt events
        window.addEventListener('prompt-created', (e) => {
            this.handlePromptCreated(e.detail);
        });
        
        window.addEventListener('prompt-updated', (e) => {
            this.handlePromptUpdated(e.detail);
        });
        
        window.addEventListener('prompt-deleted', (e) => {
            this.handlePromptDeleted(e.detail);
        });
        
        window.addEventListener('prompt-moved', (e) => {
            this.handlePromptMoved(e.detail);
        });
        
        // Search events
        window.addEventListener('search-performed', (e) => {
            this.handleSearchPerformed(e.detail);
        });
        
        // Theme events
        window.addEventListener('themechange', (e) => {
            this.handleThemeChange(e.detail);
        });
    }
    
    /**
     * Setup window events
     */
    setupWindowEvents() {
        // Resize handling
        window.addEventListener('resize', DOMUtils.throttle(() => {
            this.handleWindowResize();
        }, 250));
        
        // Before unload
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });
        
        // Online/offline status
        window.addEventListener('online', () => {
            DOMUtils.showToast('Connessione ripristinata', 'success');
        });
        
        window.addEventListener('offline', () => {
            DOMUtils.showToast('Modalità offline attiva', 'warning');
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }
    
    /**
     * Setup storage events
     */
    setupStorageEvents() {
        window.addEventListener('storagechange', (e) => {
            this.handleStorageChange(e.detail);
        });
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if user is typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.createNewPrompt();
                        break;
                        
                    case 's':
                        e.preventDefault();
                        this.saveCurrentState();
                        break;
                        
                    case 'o':
                        e.preventDefault();
                        this.importData();
                        break;
                        
                    case 'e':
                        if (e.shiftKey) {
                            e.preventDefault();
                            this.exportData();
                        }
                        break;
                        
                    case ',':
                        e.preventDefault();
                        this.showSettings();
                        break;
                }
            } else {
                switch (e.key) {
                    case 'F5':
                        e.preventDefault();
                        this.refreshApplication();
                        break;
                        
                    case 'F1':
                        e.preventDefault();
                        this.showHelp();
                        break;
                }
            }
        });
    }
    
    /**
     * Initialize sample data if storage is empty
     */
    initializeSampleData() {
        if (this.storage.prompts.size === 0) {
            this.createSamplePrompts();
        }
    }
    
    /**
     * Create sample prompts
     */
    createSamplePrompts() {
        const samplePrompts = [
            {
                title: 'AI Code Review',
                type: 'text_generation',
                prompt: 'Esegui una code review dettagliata del seguente codice Java, suggerendo miglioramenti di stile, performance e sicurezza:\n<inserisci qui il codice>',
                model: 'Claude Sonnet 3.7, GPT-4',
                author: 'Non specificato',
                tags: ['java', 'code-review', 'programming'],
                notes: 'Prompt per revisione del codice con focus su best practices',
                version: '1.0',
                category: 'linguaggi/java',
                isFavorite: true
            },
            {
                title: 'Recruiter',
                type: 'text_generation',
                prompt: 'Agisci come un recruiter esperto. Analizza il seguente CV e fornisci feedback costruttivo sui punti di forza e le aree di miglioramento.',
                model: 'claude sonnet',
                author: 'Non specificato',
                tags: ['recruiting', 'hr', 'cv-review'],
                notes: 'Utile per valutazione CV e feedback candidati',
                version: '1.0',
                category: 'productivity',
                isFavorite: false
            },
            {
                title: 'Furry 2D Art generator',
                type: 'image_generation',
                prompt: 'Create a cute anthropomorphic fox character in 2D anime style, wearing casual clothes, friendly expression',
                negative_prompt: 'realistic, 3d, human, scary, dark',
                model: 'Stable Diffusion',
                author: 'Non specificato',
                tags: ['furry', 'anime', 'character-design'],
                notes: 'Per generazione personaggi furry in stile anime',
                version: '1.0',
                category: 'immagini',
                isFavorite: false
            }
        ];
        
        samplePrompts.forEach(promptData => {
            try {
                const prompt = new Prompt(promptData);
                this.storage.prompts.set(prompt.id, prompt);
                
                if (prompt.isFavorite) {
                    this.storage.favorites.add(prompt.id);
                }
            } catch (error) {
                console.warn('Failed to create sample prompt:', error);
            }
        });
        
        // Save to storage
        this.storage.savePrompts();
        this.storage.saveFavorites();
        
        // Refresh tree view
        if (this.treeView) {
            this.treeView.refresh();
        }
        
        DOMUtils.showToast('Dati di esempio caricati', 'info');
    }
    
    /**
     * Create new prompt
     * @param {string} category - Default category
     */
    createNewPrompt(category = '') {
        if (this.promptEditor) {
            this.promptEditor.newPrompt(category);
        }
    }
    
    /**
     * Create new folder
     */
    createNewFolder() {
        const folderName = prompt('Inserisci il nome della nuova cartella:');
        if (!folderName) return;
        
        const safeName = folderName.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
        if (!safeName) {
            DOMUtils.showToast('Nome cartella non valido', 'error');
            return;
        }
        
        // Check if folder already exists
        if (this.storage.categories.has(safeName)) {
            DOMUtils.showToast('Cartella già esistente', 'warning');
            return;
        }
        
        // Create new category
        this.storage.categories.set(safeName, {
            name: folderName,
            icon: 'folder',
            color: '#6b7280'
        });
        
        this.storage.saveCategories();
        
        // Refresh tree view
        if (this.treeView) {
            this.treeView.refresh();
        }
        
        DOMUtils.showToast('Cartella creata con successo', 'success');
    }
    
    /**
     * Import data
     */
    importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,.yaml,.yml';
        input.multiple = false;
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const format = file.name.endsWith('.json') ? 'json' : 'yaml';
                
                const result = this.storage.importData(text, format, true);
                
                // Refresh components
                this.refreshComponents();
                
                const message = `Importazione completata: ${result.imported} elementi importati, ${result.skipped} saltati`;
                DOMUtils.showToast(message, 'success');
                
                if (result.errors.length > 0) {
                    console.warn('Import errors:', result.errors);
                    DOMUtils.showToast(`${result.errors.length} errori durante l'importazione`, 'warning');
                }
                
            } catch (error) {
                console.error('Import failed:', error);
                DOMUtils.showToast(`Errore durante l'importazione: ${error.message}`, 'error');
            }
        };
        
        input.click();
    }
    
    /**
     * Export data
     */
    exportData() {
        try {
            const data = this.storage.exportData('json');
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `prompt-collection-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            DOMUtils.showToast('Dati esportati con successo', 'success');
            
        } catch (error) {
            console.error('Export failed:', error);
            DOMUtils.showToast(`Errore durante l'esportazione: ${error.message}`, 'error');
        }
    }
    
    /**
     * Show settings
     */
    showSettings() {
        // Create simple settings dialog
        const settings = this.storage.settings;
        const stats = this.storage.getStorageStats();
        
        const settingsHtml = `
            <div class="settings-dialog">
                <h3>Impostazioni</h3>
                <div class="settings-section">
                    <h4>Statistiche</h4>
                    <p>Prompt: ${stats.prompts}</p>
                    <p>Categorie: ${stats.categories}</p>
                    <p>Preferiti: ${stats.favorites}</p>
                    <p>Spazio utilizzato: ${DOMUtils.formatFileSize(stats.totalSize)}</p>
                </div>
                <div class="settings-section">
                    <h4>Backup</h4>
                    <button class="btn btn--secondary" onclick="appController.createBackup()">Crea Backup</button>
                    <button class="btn btn--secondary" onclick="appController.restoreBackup()">Ripristina Backup</button>
                </div>
                <div class="settings-section">
                    <h4>Dati</h4>
                    <button class="btn btn--danger" onclick="appController.clearAllData()">Cancella Tutti i Dati</button>
                </div>
            </div>
        `;
        
        // Show in modal (simplified)
        alert('Impostazioni:\n\n' + 
              `Prompt: ${stats.prompts}\n` +
              `Categorie: ${stats.categories}\n` +
              `Preferiti: ${stats.favorites}\n` +
              `Spazio: ${DOMUtils.formatFileSize(stats.totalSize)}`);
    }
    
    /**
     * Create backup
     */
    createBackup() {
        this.storage.createBackup();
        DOMUtils.showToast('Backup creato', 'success');
    }
    
    /**
     * Restore backup
     */
    restoreBackup() {
        if (confirm('Sei sicuro di voler ripristinare l\'ultimo backup? Tutti i dati correnti saranno sostituiti.')) {
            const success = this.storage.restoreFromBackup(0);
            if (success) {
                this.refreshComponents();
                DOMUtils.showToast('Backup ripristinato', 'success');
            } else {
                DOMUtils.showToast('Errore durante il ripristino', 'error');
            }
        }
    }
    
    /**
     * Clear all data
     */
    clearAllData() {
        if (confirm('Sei sicuro di voler cancellare tutti i dati? Questa azione non può essere annullata.')) {
            this.storage.clearAll();
            this.refreshComponents();
            DOMUtils.showToast('Tutti i dati sono stati cancellati', 'success');
        }
    }
    
    /**
     * Save current state
     */
    saveCurrentState() {
        this.storage.saveAll();
        DOMUtils.showToast('Stato salvato', 'success');
    }
    
    /**
     * Refresh application
     */
    refreshApplication() {
        this.refreshComponents();
        DOMUtils.showToast('Applicazione aggiornata', 'success');
    }
    
    /**
     * Refresh all components
     */
    refreshComponents() {
        if (this.treeView) {
            this.treeView.refresh();
        }
        
        if (this.promptViewer) {
            this.promptViewer.refresh();
        }
    }
    
    /**
     * Show help
     */
    showHelp() {
        const helpText = `
Prompt Collection Manager - Guida Rapida

Scorciatoie da Tastiera:
• Ctrl+N: Nuovo prompt
• Ctrl+F: Cerca
• Ctrl+S: Salva stato
• Ctrl+O: Importa dati
• Ctrl+Shift+E: Esporta dati
• F5: Aggiorna
• F1: Mostra questa guida

Navigazione:
• Clicca su un prompt per visualizzarlo
• Doppio click per modificare
• Tasto destro per menu contestuale
• Trascina prompt per spostarli

Ricerca:
• Cerca per titolo, contenuto, tag, autore
• Usa Esc per cancellare la ricerca
• Freccia giù per navigare nei risultati
        `;
        
        alert(helpText);
    }
    
    /**
     * Handle prompt created
     * @param {Object} detail - Event detail
     */
    handlePromptCreated(detail) {
        if (this.treeView) {
            this.treeView.refresh();
            this.treeView.selectPromptById(detail.promptId);
        }
    }
    
    /**
     * Handle prompt updated
     * @param {Object} detail - Event detail
     */
    handlePromptUpdated(detail) {
        if (this.treeView) {
            this.treeView.refresh();
        }
    }
    
    /**
     * Handle prompt deleted
     * @param {Object} detail - Event detail
     */
    handlePromptDeleted(detail) {
        if (this.treeView) {
            this.treeView.refresh();
        }
    }
    
    /**
     * Handle prompt moved
     * @param {Object} detail - Event detail
     */
    handlePromptMoved(detail) {
        if (this.treeView) {
            this.treeView.refresh();
        }
    }
    
    /**
     * Handle search performed
     * @param {Object} detail - Event detail
     */
    handleSearchPerformed(detail) {
        // Update UI based on search results
        console.log(`Search: "${detail.query}" - ${detail.results} results`);
    }
    
    /**
     * Handle theme change
     * @param {Object} detail - Event detail
     */
    handleThemeChange(detail) {
        console.log(`Theme changed to: ${detail.theme}`);
    }
    
    /**
     * Handle window resize
     */
    handleWindowResize() {
        // Update layout if needed
        if (this.treeView) {
            // Tree view handles its own resize
        }
    }
    
    /**
     * Handle before unload
     * @param {Event} e - Before unload event
     */
    handleBeforeUnload(e) {
        // Save current state
        this.storage.saveAll();
        
        // Create final backup
        this.storage.createBackup();
    }
    
    /**
     * Handle visibility change
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden, save state
            this.storage.saveAll();
        } else {
            // Page is visible, check for updates
            this.refreshComponents();
        }
    }
    
    /**
     * Handle storage change
     * @param {Object} detail - Event detail
     */
    handleStorageChange(detail) {
        // Handle changes from other tabs
        this.refreshComponents();
        DOMUtils.showToast('Dati aggiornati da altra scheda', 'info');
    }
    
    /**
     * Get application status
     * @returns {Object} Application status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            components: {
                storage: !!this.storage,
                treeView: !!this.treeView,
                promptViewer: !!this.promptViewer,
                promptEditor: !!this.promptEditor,
                searchController: !!this.searchController
            },
            stats: this.storage ? this.storage.getStorageStats() : null
        };
    }
    
    /**
     * Destroy application
     */
    destroy() {
        // Cleanup components
        if (this.searchController) {
            this.searchController.destroy();
        }
        
        // Save final state
        if (this.storage) {
            this.storage.saveAll();
            this.storage.createBackup();
        }
        
        this.isInitialized = false;
    }
}

// Export for global access
window.AppController = AppController;

