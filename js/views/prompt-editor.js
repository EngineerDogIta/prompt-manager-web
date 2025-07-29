/**
 * Prompt Editor Component
 * Handles creation and editing of prompts
 */

class PromptEditor {
    constructor(storageManager) {
        this.storage = storageManager;
        this.modal = null;
        this.form = null;
        this.currentPrompt = null;
        this.isEditing = false;
        this.isDirty = false;
        
        this.init();
    }
    
    /**
     * Initialize prompt editor
     */
    init() {
        this.modal = document.getElementById('prompt-editor-modal');
        this.form = document.getElementById('prompt-form');
        
        this.setupEventListeners();
        this.buildForm();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Modal events
        const closeBtn = document.getElementById('close-editor-btn');
        const cancelBtn = document.getElementById('cancel-editor-btn');
        const backdrop = this.modal?.querySelector('.modal__backdrop');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.close());
        }
        
        if (backdrop) {
            backdrop.addEventListener('click', () => this.close());
        }
        
        // Form events
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.save();
            });
            
            this.form.addEventListener('input', () => {
                this.markDirty();
            });
        }
        
        // Global events
        window.addEventListener('prompt-new', (e) => {
            this.newPrompt(e.detail?.category);
        });
        
        window.addEventListener('prompt-edit', (e) => {
            this.editPrompt(e.detail.promptId);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isOpen()) {
                this.handleKeyboardShortcuts(e);
            }
        });
        
        // Prevent accidental navigation
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty && this.isOpen()) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} e - Keyboard event
     */
    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.save();
                    break;
                case 'Enter':
                    e.preventDefault();
                    this.save();
                    break;
            }
        } else if (e.key === 'Escape') {
            this.close();
        }
    }
    
    /**
     * Build form structure
     */
    buildForm() {
        if (!this.form) return;
        
        this.form.innerHTML = '';
        
        // Title field
        this.form.appendChild(this.createFormGroup(
            'title',
            'Titolo *',
            'input',
            {
                type: 'text',
                required: true,
                maxlength: 200,
                placeholder: 'Inserisci il titolo del prompt'
            }
        ));
        
        // Type field
        this.form.appendChild(this.createFormGroup(
            'type',
            'Tipo *',
            'select',
            {
                required: true
            },
            [
                { value: 'text_generation', text: 'Generazione Testo' },
                { value: 'image_generation', text: 'Generazione Immagini' },
                { value: 'code', text: 'Codice' },
                { value: 'other', text: 'Altro' }
            ]
        ));
        
        // Model field
        this.form.appendChild(this.createFormGroup(
            'model',
            'Modello',
            'input',
            {
                type: 'text',
                placeholder: 'es. GPT-4, Claude Sonnet, etc.'
            }
        ));
        
        // Author field
        this.form.appendChild(this.createFormGroup(
            'author',
            'Autore',
            'input',
            {
                type: 'text',
                placeholder: 'Nome dell\'autore'
            }
        ));
        
        // Category field
        this.form.appendChild(this.createCategoryField());
        
        // Tags field
        this.form.appendChild(this.createTagsField());
        
        // Prompt content field
        this.form.appendChild(this.createFormGroup(
            'prompt',
            'Contenuto del Prompt *',
            'textarea',
            {
                required: true,
                rows: 8,
                placeholder: 'Inserisci il contenuto del prompt...'
            }
        ));
        
        // Negative prompt field (for image generation)
        this.form.appendChild(this.createFormGroup(
            'negative_prompt',
            'Prompt Negativo',
            'textarea',
            {
                rows: 3,
                placeholder: 'Prompt negativo (solo per generazione immagini)'
            }
        ));
        
        // Notes field
        this.form.appendChild(this.createFormGroup(
            'notes',
            'Note',
            'textarea',
            {
                rows: 3,
                placeholder: 'Note aggiuntive o descrizione'
            }
        ));
        
        // Version field
        this.form.appendChild(this.createFormGroup(
            'version',
            'Versione',
            'input',
            {
                type: 'text',
                pattern: '^\\d+\\.\\d+(\\.\\d+)?$',
                placeholder: '1.0'
            }
        ));
        
        // Favorite checkbox
        this.form.appendChild(this.createCheckboxGroup(
            'isFavorite',
            'Aggiungi ai preferiti'
        ));
        
        // Setup conditional field visibility
        this.setupConditionalFields();
    }
    
    /**
     * Create form group
     * @param {string} name - Field name
     * @param {string} label - Field label
     * @param {string} type - Field type
     * @param {Object} attributes - Field attributes
     * @param {Array} options - Select options
     * @returns {Element} Form group element
     */
    createFormGroup(name, label, type, attributes = {}, options = []) {
        const group = DOMUtils.createElement('div', {
            className: 'form-group'
        });
        
        const labelElement = DOMUtils.createElement('label', {
            className: 'form-label',
            for: name
        }, label);
        
        let input;
        if (type === 'textarea') {
            input = DOMUtils.createElement('textarea', {
                className: 'form-textarea',
                id: name,
                name: name,
                ...attributes
            });
        } else if (type === 'select') {
            input = DOMUtils.createElement('select', {
                className: 'form-select',
                id: name,
                name: name,
                ...attributes
            });
            
            options.forEach(option => {
                const optionElement = DOMUtils.createElement('option', {
                    value: option.value
                }, option.text);
                input.appendChild(optionElement);
            });
        } else {
            input = DOMUtils.createElement('input', {
                className: 'form-input',
                id: name,
                name: name,
                ...attributes
            });
        }
        
        group.appendChild(labelElement);
        group.appendChild(input);
        
        // Add help text if needed
        if (attributes.placeholder && type !== 'textarea') {
            const help = DOMUtils.createElement('div', {
                className: 'form-help'
            }, attributes.placeholder);
            group.appendChild(help);
        }
        
        return group;
    }
    
    /**
     * Create checkbox group
     * @param {string} name - Field name
     * @param {string} label - Field label
     * @returns {Element} Checkbox group element
     */
    createCheckboxGroup(name, label) {
        const group = DOMUtils.createElement('div', {
            className: 'form-group'
        });
        
        const wrapper = DOMUtils.createElement('div', {
            style: 'display: flex; align-items: center; gap: 8px;'
        });
        
        const input = DOMUtils.createElement('input', {
            type: 'checkbox',
            id: name,
            name: name
        });
        
        const labelElement = DOMUtils.createElement('label', {
            className: 'form-label',
            for: name,
            style: 'margin: 0; cursor: pointer;'
        }, label);
        
        wrapper.appendChild(input);
        wrapper.appendChild(labelElement);
        group.appendChild(wrapper);
        
        return group;
    }
    
    /**
     * Create category field with dropdown
     * @returns {Element} Category field element
     */
    createCategoryField() {
        const group = DOMUtils.createElement('div', {
            className: 'form-group'
        });
        
        const label = DOMUtils.createElement('label', {
            className: 'form-label',
            for: 'category'
        }, 'Categoria');
        
        const select = DOMUtils.createElement('select', {
            className: 'form-select',
            id: 'category',
            name: 'category'
        });
        
        // Add default option
        select.appendChild(DOMUtils.createElement('option', {
            value: ''
        }, 'Seleziona categoria...'));
        
        // Add categories from storage
        const categories = Array.from(this.storage.categories.entries())
            .filter(([path]) => path !== 'favorites')
            .sort(([a], [b]) => a.localeCompare(b));
        
        categories.forEach(([path, info]) => {
            const option = DOMUtils.createElement('option', {
                value: path
            }, `${info.name} (${path})`);
            select.appendChild(option);
        });
        
        group.appendChild(label);
        group.appendChild(select);
        
        return group;
    }
    
    /**
     * Create tags field with dynamic input
     * @returns {Element} Tags field element
     */
    createTagsField() {
        const group = DOMUtils.createElement('div', {
            className: 'form-group'
        });
        
        const label = DOMUtils.createElement('label', {
            className: 'form-label',
            for: 'tags'
        }, 'Tag');
        
        const input = DOMUtils.createElement('input', {
            className: 'form-input',
            id: 'tags',
            name: 'tags',
            type: 'text',
            placeholder: 'Inserisci tag separati da virgola'
        });
        
        const help = DOMUtils.createElement('div', {
            className: 'form-help'
        }, 'Separare i tag con virgole (es: java, programming, ai)');
        
        group.appendChild(label);
        group.appendChild(input);
        group.appendChild(help);
        
        return group;
    }
    
    /**
     * Setup conditional field visibility
     */
    setupConditionalFields() {
        const typeSelect = this.form.querySelector('#type');
        const negativePromptGroup = this.form.querySelector('#negative_prompt').closest('.form-group');
        
        if (typeSelect && negativePromptGroup) {
            const updateVisibility = () => {
                const isImageGeneration = typeSelect.value === 'image_generation';
                negativePromptGroup.style.display = isImageGeneration ? 'flex' : 'none';
            };
            
            typeSelect.addEventListener('change', updateVisibility);
            updateVisibility(); // Initial state
        }
    }
    
    /**
     * Open editor for new prompt
     * @param {string} category - Default category
     */
    newPrompt(category = '') {
        this.currentPrompt = null;
        this.isEditing = false;
        this.isDirty = false;
        
        // Update modal title
        const title = document.getElementById('editor-title');
        if (title) {
            title.textContent = 'Nuovo Prompt';
        }
        
        // Reset form
        this.resetForm();
        
        // Set default category if provided
        if (category) {
            const categorySelect = this.form.querySelector('#category');
            if (categorySelect) {
                categorySelect.value = category;
            }
        }
        
        // Set default values
        const versionInput = this.form.querySelector('#version');
        if (versionInput && !versionInput.value) {
            versionInput.value = '1.0';
        }
        
        this.open();
        
        // Focus title field
        const titleInput = this.form.querySelector('#title');
        if (titleInput) {
            titleInput.focus();
        }
    }
    
    /**
     * Open editor for existing prompt
     * @param {string} promptId - Prompt ID to edit
     */
    editPrompt(promptId) {
        const prompt = this.storage.prompts.get(promptId);
        if (!prompt) {
            DOMUtils.showToast('Prompt non trovato', 'error');
            return;
        }
        
        this.currentPrompt = prompt;
        this.isEditing = true;
        this.isDirty = false;
        
        // Update modal title
        const title = document.getElementById('editor-title');
        if (title) {
            title.textContent = 'Modifica Prompt';
        }
        
        // Populate form with prompt data
        this.populateForm(prompt);
        
        this.open();
        
        // Focus title field
        const titleInput = this.form.querySelector('#title');
        if (titleInput) {
            titleInput.focus();
            titleInput.select();
        }
    }
    
    /**
     * Populate form with prompt data
     * @param {Prompt} prompt - Prompt object
     */
    populateForm(prompt) {
        const fields = [
            'title', 'type', 'prompt', 'negative_prompt', 
            'model', 'author', 'notes', 'version', 'category'
        ];
        
        fields.forEach(field => {
            const input = this.form.querySelector(`#${field}`);
            if (input) {
                input.value = prompt[field] || '';
            }
        });
        
        // Handle tags (array to string)
        const tagsInput = this.form.querySelector('#tags');
        if (tagsInput) {
            tagsInput.value = prompt.tags.join(', ');
        }
        
        // Handle favorite checkbox
        const favoriteInput = this.form.querySelector('#isFavorite');
        if (favoriteInput) {
            favoriteInput.checked = prompt.isFavorite;
        }
    }
    
    /**
     * Reset form to default state
     */
    resetForm() {
        if (this.form) {
            this.form.reset();
            
            // Clear validation errors
            this.clearValidationErrors();
        }
    }
    
    /**
     * Open modal
     */
    open() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Trap focus in modal
            this.trapFocus();
        }
    }
    
    /**
     * Close modal
     */
    close() {
        if (this.isDirty && !confirm('Ci sono modifiche non salvate. Sei sicuro di voler chiudere?')) {
            return;
        }

        if (this.modal) {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
            
            this.currentPrompt = null;
            this.isEditing = false;
            this.isDirty = false;
            
            this.resetForm();
        }
    }
    
    /**
     * Check if modal is open
     * @returns {boolean} True if open
     */
    isOpen() {
        return this.modal && this.modal.style.display === 'flex';
    }
    
    /**
     * Mark form as dirty
     */
    markDirty() {
        this.isDirty = true;
    }
    
    /**
     * Save prompt
     */
    save() {
        try {
            // Validate form
            if (!this.validateForm()) {
                return;
            }
            
            // Collect form data
            const formData = this.collectFormData();
            
            if (this.isEditing && this.currentPrompt) {
                // Update existing prompt
                this.currentPrompt.update(formData);
                this.storage.savePrompts();
                
                // Update favorites if needed
                if (formData.isFavorite) {
                    this.storage.favorites.add(this.currentPrompt.id);
                } else {
                    this.storage.favorites.delete(this.currentPrompt.id);
                }
                this.storage.saveFavorites();
                
                DOMUtils.showToast('Prompt aggiornato con successo', 'success');
                
                // Dispatch update event
                window.dispatchEvent(new CustomEvent('prompt-updated', {
                    detail: { promptId: this.currentPrompt.id }
                }));
                
            } else {
                // Create new prompt
                const prompt = new Prompt(formData);
                this.storage.prompts.set(prompt.id, prompt);
                this.storage.savePrompts();
                
                // Add to favorites if needed
                if (formData.isFavorite) {
                    this.storage.favorites.add(prompt.id);
                    this.storage.saveFavorites();
                }
                
                DOMUtils.showToast('Prompt creato con successo', 'success');
                
                // Dispatch creation event
                window.dispatchEvent(new CustomEvent('prompt-created', {
                    detail: { promptId: prompt.id }
                }));
            }
            
            this.close();
            
        } catch (error) {
            console.error('Save failed:', error);
            DOMUtils.showToast(`Errore durante il salvataggio: ${error.message}`, 'error');
        }
    }
    
    /**
     * Validate form
     * @returns {boolean} True if valid
     */
    validateForm() {
        this.clearValidationErrors();
        
        let isValid = true;
        const errors = [];
        
        // Required fields
        const requiredFields = ['title', 'type', 'prompt'];
        requiredFields.forEach(field => {
            const input = this.form.querySelector(`#${field}`);
            if (input && !input.value.trim()) {
                this.showFieldError(input, 'Questo campo è obbligatorio');
                isValid = false;
            }
        });
        
        // Title length
        const titleInput = this.form.querySelector('#title');
        if (titleInput && titleInput.value.length > 200) {
            this.showFieldError(titleInput, 'Il titolo deve essere di massimo 200 caratteri');
            isValid = false;
        }
        
        // Prompt length
        const promptInput = this.form.querySelector('#prompt');
        if (promptInput && promptInput.value.length > 10000) {
            this.showFieldError(promptInput, 'Il prompt deve essere di massimo 10000 caratteri');
            isValid = false;
        }
        
        // Version format
        const versionInput = this.form.querySelector('#version');
        if (versionInput && versionInput.value && !/^\d+\.\d+(\.\d+)?$/.test(versionInput.value)) {
            this.showFieldError(versionInput, 'La versione deve essere nel formato X.Y o X.Y.Z');
            isValid = false;
        }
        
        // Tags count
        const tagsInput = this.form.querySelector('#tags');
        if (tagsInput && tagsInput.value) {
            const tags = this.parseTags(tagsInput.value);
            if (tags.length > 20) {
                this.showFieldError(tagsInput, 'Massimo 20 tag consentiti');
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    /**
     * Show field validation error
     * @param {Element} input - Input element
     * @param {string} message - Error message
     */
    showFieldError(input, message) {
        input.classList.add('form-input--error', 'form-textarea--error', 'form-select--error');
        
        // Remove existing error
        const existingError = input.parentNode.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Add error message
        const error = DOMUtils.createElement('div', {
            className: 'form-error'
        }, message);
        
        input.parentNode.appendChild(error);
    }
    
    /**
     * Clear validation errors
     */
    clearValidationErrors() {
        // Remove error classes
        this.form.querySelectorAll('.form-input--error, .form-textarea--error, .form-select--error')
            .forEach(input => {
                input.classList.remove('form-input--error', 'form-textarea--error', 'form-select--error');
            });
        
        // Remove error messages
        this.form.querySelectorAll('.form-error').forEach(error => {
            error.remove();
        });
    }
    
    /**
     * Collect form data
     * @returns {Object} Form data object
     */
    collectFormData() {
        const data = {};
        
        // Text fields
        const textFields = ['title', 'type', 'prompt', 'negative_prompt', 'model', 'author', 'notes', 'version', 'category'];
        textFields.forEach(field => {
            const input = this.form.querySelector(`#${field}`);
            if (input) {
                data[field] = input.value.trim();
            }
        });
        
        // Tags (string to array)
        const tagsInput = this.form.querySelector('#tags');
        if (tagsInput) {
            data.tags = this.parseTags(tagsInput.value);
        }
        
        // Favorite checkbox
        const favoriteInput = this.form.querySelector('#isFavorite');
        if (favoriteInput) {
            data.isFavorite = favoriteInput.checked;
        }
        
        return data;
    }
    
    /**
     * Parse tags from string
     * @param {string} tagsString - Tags string
     * @returns {Array} Tags array
     */
    parseTags(tagsString) {
        if (!tagsString) return [];
        
        return tagsString
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
            .slice(0, 20); // Limit to 20 tags
    }
    
    /**
     * Trap focus within modal
     */
    trapFocus() {
        const focusableElements = this.modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleTabKey = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };
        
        this.modal.addEventListener('keydown', handleTabKey);
    }
}

// Export for use in other modules
window.PromptEditor = PromptEditor;

