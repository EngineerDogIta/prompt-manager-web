/**
 * Tree View Component
 * Handles hierarchical navigation of prompts and categories
 */

class TreeView {
    constructor(container, storageManager) {
        this.container = container;
        this.storage = storageManager;
        this.selectedNode = null;
        this.expandedNodes = new Set();
        this.draggedNode = null;
        this.searchQuery = '';
        this.filteredNodes = new Set();
        
        this.init();
    }
    
    /**
     * Initialize tree view
     */
    init() {
        this.container.innerHTML = '';
        this.container.className = 'tree-view';
        
        this.setupEventListeners();
        this.render();
        
        // Load expanded state from storage
        this.loadExpandedState();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Click handling
        this.container.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        // Double click handling
        this.container.addEventListener('dblclick', (e) => {
            this.handleDoubleClick(e);
        });
        
        // Context menu
        this.container.addEventListener('contextmenu', (e) => {
            this.handleContextMenu(e);
        });
        
        // Drag and drop
        this.container.addEventListener('dragstart', (e) => {
            this.handleDragStart(e);
        });
        
        this.container.addEventListener('dragover', (e) => {
            this.handleDragOver(e);
        });
        
        this.container.addEventListener('drop', (e) => {
            this.handleDrop(e);
        });
        
        // Keyboard navigation
        this.container.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        // Storage changes
        window.addEventListener('storagechange', () => {
            this.render();
        });
    }
    
    /**
     * Render tree structure
     */
    render() {
        this.container.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        // Build tree structure
        const tree = this.buildTreeStructure();
        
        // Render favorites first
        if (tree.favorites && tree.favorites.length > 0) {
            const favoritesNode = this.renderCategoryNode('favorites', {
                name: '⭐ Favorites',
                icon: 'starFilled',
                color: '#fbbf24'
            }, tree.favorites);
            fragment.appendChild(favoritesNode);
        }
        
        // Render other categories
        Object.entries(tree.categories).forEach(([categoryPath, data]) => {
            if (categoryPath !== 'favorites') {
                const categoryNode = this.renderCategoryNode(categoryPath, data.info, data.items);
                fragment.appendChild(categoryNode);
            }
        });
        
        // Render uncategorized prompts
        if (tree.uncategorized && tree.uncategorized.length > 0) {
            const uncategorizedNode = this.renderCategoryNode('uncategorized', {
                name: 'Senza Categoria',
                icon: 'folder',
                color: '#6b7280'
            }, tree.uncategorized);
            fragment.appendChild(uncategorizedNode);
        }
        
        this.container.appendChild(fragment);
        
        // Restore expanded state
        this.restoreExpandedState();
        
        // Apply search filter if active
        if (this.searchQuery) {
            this.applySearchFilter(this.searchQuery);
        }
    }
    
    /**
     * Build tree structure from prompts and categories
     * @returns {Object} Tree structure
     */
    buildTreeStructure() {
        const tree = {
            categories: {},
            favorites: [],
            uncategorized: []
        };
        
        // Initialize all categories from storage
        this.storage.categories.forEach((info, path) => {
            if (path !== 'favorites') {
                tree.categories[path] = {
                    info,
                    items: [],
                    parent: path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : null,
                    children: []
                };
            }
        });
        
        // Populate children arrays
        Object.keys(tree.categories).forEach(path => {
            const parentPath = tree.categories[path].parent;
            if (parentPath && tree.categories[parentPath]) {
                if (!tree.categories[parentPath].children.includes(path)) {
                    tree.categories[parentPath].children.push(path);
                }
            }
        });

        // Get all prompts
        const prompts = Array.from(this.storage.prompts.values());
        
        // Group prompts by category and handle favorites/uncategorized
        prompts.forEach(prompt => {
            if (prompt.isFavorite) {
                tree.favorites.push(prompt);
            }
            
            const category = prompt.category || 'uncategorized';
            
            if (tree.categories[category]) {
                tree.categories[category].items.push(prompt);
            } else if (category === 'uncategorized' && !prompt.isFavorite) {
                tree.uncategorized.push(prompt);
            }
        });
        
        return tree;
    }
    
    /**
     * Render category node
     * @param {string} categoryPath - Category path
     * @param {Object} categoryInfo - Category information
     * @param {Array} items - Items in category
     * @returns {Element} Category node element
     */
    renderCategoryNode(categoryPath, categoryInfo, items) {
        const isExpanded = this.expandedNodes.has(categoryPath);
        const hasChildren = items.length > 0;
        
        const node = DOMUtils.createElement('div', {
            className: 'tree-node',
            dataset: { type: 'category', path: categoryPath }
        });
        
        // Category header
        const content = DOMUtils.createElement('div', {
            className: 'tree-node__content',
            tabindex: '0',
            role: 'treeitem',
            'aria-expanded': hasChildren ? isExpanded : undefined
        });
        
        // Toggle button
        if (hasChildren) {
            const toggle = DOMUtils.createElement('button', {
                className: `tree-node__toggle ${isExpanded ? 'tree-node__toggle--expanded' : ''}`,
                'aria-label': isExpanded ? 'Comprimi' : 'Espandi'
            });
            toggle.appendChild(DOMUtils.createIcon('chevronRight'));
            content.appendChild(toggle);
        } else {
            content.appendChild(DOMUtils.createElement('span', {
                className: 'tree-node__toggle'
            }));
        }
        
        // Category icon
        const icon = DOMUtils.createIcon(categoryInfo.icon || 'folder');
        icon.setAttribute('class', 'tree-node__icon');
        icon.style.color = categoryInfo.color || '#6b7280';
        content.appendChild(icon);
        
        // Category label
        const label = DOMUtils.createElement('span', {
            className: 'tree-node__label'
        }, categoryInfo.name);
        content.appendChild(label);
        
        // Item count badge
        if (items.length > 0) {
            const badge = DOMUtils.createElement('span', {
                className: 'tree-node__badge'
            }, items.length.toString());
            content.appendChild(badge);
        }
        
        node.appendChild(content);
        
        // Children container
        if (hasChildren) {
            const children = DOMUtils.createElement('div', {
                className: `tree-node__children ${!isExpanded ? 'tree-node__children--hidden' : ''}`
            });
            
            // Sort items: folders first, then prompts
            const sortedItems = [...items].sort((a, b) => {
                // If both are prompts, sort by title
                return a.title.localeCompare(b.title);
            });
            
            sortedItems.forEach(item => {
                const itemNode = this.renderPromptNode(item);
                children.appendChild(itemNode);
            });
            
            node.appendChild(children);
        }
        
        return node;
    }
    
    /**
     * Render prompt node
     * @param {Prompt} prompt - Prompt object
     * @returns {Element} Prompt node element
     */
    renderPromptNode(prompt) {
        const node = DOMUtils.createElement('div', {
            className: 'tree-node',
            dataset: { type: 'prompt', id: prompt.id },
            draggable: 'true'
        });
        
        const content = DOMUtils.createElement('div', {
            className: 'tree-node__content',
            tabindex: '0',
            role: 'treeitem'
        });
        
        // Empty toggle space for alignment
        content.appendChild(DOMUtils.createElement('span', {
            className: 'tree-node__toggle'
        }));
        
        // Prompt icon based on type
        const iconName = this.getPromptIcon(prompt.type);
        const icon = DOMUtils.createIcon(iconName);
        icon.setAttribute('class', 'tree-node__icon');
        content.appendChild(icon);
        
        // Prompt title
        const label = DOMUtils.createElement('span', {
            className: 'tree-node__label'
        }, prompt.title);
        content.appendChild(label);
        
        // Model badge
        if (prompt.model) {
            const badge = DOMUtils.createElement('span', {
                className: 'tree-node__badge'
            }, prompt.model);
            content.appendChild(badge);
        }
        
        // Favorite indicator
        if (prompt.isFavorite) {
            const favorite = DOMUtils.createIcon('starFilled');
            favorite.setAttribute('class', 'tree-node__favorite');
            content.appendChild(favorite);
        }
        
        node.appendChild(content);
        return node;
    }
    
    /**
     * Get icon for prompt type
     * @param {string} type - Prompt type
     * @returns {string} Icon name
     */
    getPromptIcon(type) {
        const icons = {
            'text_generation': 'file',
            'image_generation': 'file',
            'code': 'file',
            'other': 'file'
        };
        return icons[type] || 'file';
    }
    
    /**
     * Handle click events
     * @param {Event} e - Click event
     */
    handleClick(e) {
        const node = e.target.closest('.tree-node');
        if (!node) return;
        
        const toggle = e.target.closest('.tree-node__toggle');
        if (toggle) {
            this.toggleNode(node);
            return;
        }
        
        const content = e.target.closest('.tree-node__content');
        if (content) {
            this.selectNode(node);
        }
    }
    
    /**
     * Handle double click events
     * @param {Event} e - Double click event
     */
    handleDoubleClick(e) {
        const node = e.target.closest('.tree-node');
        if (!node) return;
        
        if (node.dataset.type === 'category') {
            this.toggleNode(node);
        } else if (node.dataset.type === 'prompt') {
            // Trigger edit event
            window.dispatchEvent(new CustomEvent('prompt-edit', {
                detail: { promptId: node.dataset.id }
            }));
        }
    }
    
    /**
     * Handle context menu events
     * @param {Event} e - Context menu event
     */
    handleContextMenu(e) {
        e.preventDefault();
        
        const node = e.target.closest('.tree-node');
        if (!node) return;
        
        this.selectNode(node);
        this.showContextMenu(e, node);
    }
    
    /**
     * Handle drag start events
     * @param {Event} e - Drag start event
     */
    handleDragStart(e) {
        const node = e.target.closest('.tree-node');
        if (!node || node.dataset.type !== 'prompt') {
            e.preventDefault();
            return;
        }
        
        this.draggedNode = node;
        node.classList.add('tree-node__content--dragging');
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', node.dataset.id);
    }
    
    /**
     * Handle drag over events
     * @param {Event} e - Drag over event
     */
    handleDragOver(e) {
        e.preventDefault();
        
        const node = e.target.closest('.tree-node');
        if (!node || node.dataset.type !== 'category') return;
        
        e.dataTransfer.dropEffect = 'move';
        node.classList.add('tree-node__content--drop-target');
    }
    
    /**
     * Handle drop events
     * @param {Event} e - Drop event
     */
    handleDrop(e) {
        e.preventDefault();
        
        const targetNode = e.target.closest('.tree-node');
        if (!targetNode || targetNode.dataset.type !== 'category') return;
        
        const promptId = e.dataTransfer.getData('text/plain');
        const prompt = this.storage.prompts.get(promptId);
        
        if (prompt && this.draggedNode) {
            // Update prompt category
            prompt.update({ category: targetNode.dataset.path });
            this.storage.savePrompts();
            
            // Re-render tree
            this.render();
            
            // Dispatch update event
            window.dispatchEvent(new CustomEvent('prompt-moved', {
                detail: { promptId, newCategory: targetNode.dataset.path }
            }));
        }
        
        // Cleanup
        this.cleanupDrag();
    }
    
    /**
     * Cleanup drag operation
     */
    cleanupDrag() {
        if (this.draggedNode) {
            this.draggedNode.classList.remove('tree-node__content--dragging');
            this.draggedNode = null;
        }
        
        // Remove drop target indicators
        this.container.querySelectorAll('.tree-node__content--drop-target').forEach(node => {
            node.classList.remove('tree-node__content--drop-target');
        });
    }
    
    /**
     * Handle keyboard navigation
     * @param {Event} e - Keyboard event
     */
    handleKeyDown(e) {
        const node = e.target.closest('.tree-node');
        if (!node) return;
        
        switch (e.key) {
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.selectNode(node);
                break;
                
            case 'ArrowRight':
                e.preventDefault();
                if (node.dataset.type === 'category') {
                    this.expandNode(node);
                }
                break;
                
            case 'ArrowLeft':
                e.preventDefault();
                if (node.dataset.type === 'category') {
                    this.collapseNode(node);
                }
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.navigateToNext(node);
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.navigateToPrevious(node);
                break;
                
            case 'Delete':
                if (node.dataset.type === 'prompt') {
                    this.deletePrompt(node.dataset.id);
                }
                break;
        }
    }
    
    /**
     * Toggle node expansion
     * @param {Element} node - Node element
     * @param {boolean} [forceExpand] - Force expansion state
     */
    toggleNode(node, forceExpand = null) {
        if (node.dataset.type !== 'category') return;
        
        const isExpanded = this.expandedNodes.has(node.dataset.path);
        const shouldExpand = forceExpand !== null ? forceExpand : !isExpanded;

        if (shouldExpand) {
            this.expandNode(node);
        } else {
            this.collapseNode(node);
        }
    }
    
    /**
     * Expand node
     * @param {Element} node - Node element
     */
    expandNode(node) {
        if (node.dataset.type !== 'category') return;
        
        const path = node.dataset.path;
        this.expandedNodes.add(path);
        
        const toggle = node.querySelector('.tree-node__toggle');
        const children = node.querySelector('.tree-node__children');
        
        if (toggle) {
            toggle.classList.add('tree-node__toggle--expanded');
        }
        
        if (children) {
            children.classList.remove('tree-node__children--hidden');
        }
        
        // Update aria-expanded
        const content = node.querySelector('.tree-node__content');
        if (content) {
            content.setAttribute('aria-expanded', 'true');
        }
        
        this.saveExpandedState();
    }
    
    /**
     * Collapse node
     * @param {Element} node - Node element
     */
    collapseNode(node) {
        if (node.dataset.type !== 'category') return;
        
        const path = node.dataset.path;
        this.expandedNodes.delete(path);
        
        const toggle = node.querySelector('.tree-node__toggle');
        const children = node.querySelector('.tree-node__children');
        
        if (toggle) {
            toggle.classList.remove('tree-node__toggle--expanded');
        }
        
        if (children) {
            children.classList.add('tree-node__children--hidden');
        }
        
        // Update aria-expanded
        const content = node.querySelector('.tree-node__content');
        if (content) {
            content.setAttribute('aria-expanded', 'false');
        }
        
        this.saveExpandedState();
    }
    
    /**
     * Select node
     * @param {Element} node - Node element
     */
    selectNode(node) {
        // Remove previous selection
        if (this.selectedNode) {
            this.selectedNode.querySelector('.tree-node__content')
                .classList.remove('tree-node__content--selected');
        }
        
        // Set new selection
        this.selectedNode = node;
        node.querySelector('.tree-node__content')
            .classList.add('tree-node__content--selected');
        
        // Focus the node
        node.querySelector('.tree-node__content').focus();
        
        // Dispatch selection event
        if (node.dataset.type === 'prompt') {
            window.dispatchEvent(new CustomEvent('prompt-selected', {
                detail: { promptId: node.dataset.id }
            }));
        } else if (node.dataset.type === 'category') {
            window.dispatchEvent(new CustomEvent('category-selected', {
                detail: { categoryPath: node.dataset.path }
            }));
        }
    }
    
    /**
     * Navigate to next node
     * @param {Element} currentNode - Current node
     */
    navigateToNext(currentNode) {
        const allNodes = Array.from(this.container.querySelectorAll('.tree-node__content'));
        const currentIndex = allNodes.indexOf(currentNode.querySelector('.tree-node__content'));
        
        if (currentIndex < allNodes.length - 1) {
            const nextNode = allNodes[currentIndex + 1].closest('.tree-node');
            this.selectNode(nextNode);
        }
    }
    
    /**
     * Navigate to previous node
     * @param {Element} currentNode - Current node
     */
    navigateToPrevious(currentNode) {
        const allNodes = Array.from(this.container.querySelectorAll('.tree-node__content'));
        const currentIndex = allNodes.indexOf(currentNode.querySelector('.tree-node__content'));
        
        if (currentIndex > 0) {
            const prevNode = allNodes[currentIndex - 1].closest('.tree-node');
            this.selectNode(prevNode);
        }
    }
    
    /**
     * Show context menu
     * @param {Event} e - Event object
     * @param {Element} node - Target node
     */
    showContextMenu(e, node) {
        const contextMenu = document.getElementById('context-menu');
        if (!contextMenu) return;
        
        // Clear existing menu
        contextMenu.innerHTML = '';
        
        if (node.dataset.type === 'prompt') {
            this.buildPromptContextMenu(contextMenu, node.dataset.id);
        } else if (node.dataset.type === 'category') {
            this.buildCategoryContextMenu(contextMenu, node.dataset.path);
        }
        
        // Position and show menu
        contextMenu.style.left = `${e.clientX}px`;
        contextMenu.style.top = `${e.clientY}px`;
        contextMenu.style.display = 'block';
        
        // Hide menu on outside click
        const hideMenu = (event) => {
            if (!contextMenu.contains(event.target)) {
                contextMenu.style.display = 'none';
                document.removeEventListener('click', hideMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', hideMenu);
        }, 0);
    }
    
    /**
     * Build context menu for prompt
     * @param {Element} menu - Menu container
     * @param {string} promptId - Prompt ID
     */
    buildPromptContextMenu(menu, promptId) {
        const prompt = this.storage.prompts.get(promptId);
        if (!prompt) return;
        
        const items = [
            {
                label: 'Modifica',
                icon: 'edit',
                action: () => window.dispatchEvent(new CustomEvent('prompt-edit', { detail: { promptId } }))
            },
            {
                label: 'Duplica',
                icon: 'copy',
                action: () => this.duplicatePrompt(promptId)
            },
            {
                label: prompt.isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti',
                icon: prompt.isFavorite ? 'star' : 'starFilled',
                action: () => this.toggleFavorite(promptId)
            },
            { separator: true },
            {
                label: 'Elimina',
                icon: 'trash',
                action: () => this.deletePrompt(promptId),
                danger: true
            }
        ];
        
        this.renderContextMenuItems(menu, items);
    }
    
    /**
     * Build context menu for category
     * @param {Element} menu - Menu container
     * @param {string} categoryPath - Category path
     */
    buildCategoryContextMenu(menu, categoryPath) {
        const items = [
            {
                label: 'Nuovo prompt',
                icon: 'plus',
                action: () => window.dispatchEvent(new CustomEvent('prompt-new', { detail: { category: categoryPath } }))
            },
            {
                label: 'Nuova sottocartella',
                icon: 'folder',
                action: () => this.createSubcategory(categoryPath)
            }
        ];
        
        if (categoryPath !== 'favorites') {
            items.push(
                { separator: true },
                {
                    label: 'Rinomina',
                    icon: 'edit',
                    action: () => this.renameCategory(categoryPath)
                }
            );
        }
        
        this.renderContextMenuItems(menu, items);
    }
    
    /**
     * Render context menu items
     * @param {Element} menu - Menu container
     * @param {Array} items - Menu items
     */
    renderContextMenuItems(menu, items) {
        items.forEach(item => {
            if (item.separator) {
                const separator = DOMUtils.createElement('div', {
                    className: 'context-menu__separator'
                });
                menu.appendChild(separator);
            } else {
                const menuItem = DOMUtils.createElement('button', {
                    className: `context-menu__item ${item.danger ? 'context-menu__item--danger' : ''}`,
                    onclick: item.action
                });
                
                if (item.icon) {
                    menuItem.appendChild(DOMUtils.createIcon(item.icon));
                }
                
                menuItem.appendChild(document.createTextNode(item.label));
                menu.appendChild(menuItem);
            }
        });
    }
    
    /**
     * Apply search filter
     * @param {string} query - Search query
     */
    applySearchFilter(query) {
        this.searchQuery = query.toLowerCase();
        this.filteredNodes.clear();
        
        if (!query) {
            // Show all nodes
            this.container.querySelectorAll('.tree-node').forEach(node => {
                node.style.display = '';
            });
            return;
        }
        
        // Find matching prompts
        const matchingPrompts = Array.from(this.storage.prompts.values())
            .filter(prompt => prompt.matchesSearch(query));
        
        matchingPrompts.forEach(prompt => {
            this.filteredNodes.add(prompt.id);
        });
        
        // Show/hide nodes based on filter
        this.container.querySelectorAll('.tree-node').forEach(node => {
            if (node.dataset.type === 'prompt') {
                const shouldShow = this.filteredNodes.has(node.dataset.id);
                node.style.display = shouldShow ? '' : 'none';
                
                // Highlight matching text
                if (shouldShow) {
                    const label = node.querySelector('.tree-node__label');
                    if (label) {
                        const prompt = this.storage.prompts.get(node.dataset.id);
                        label.innerHTML = DOMUtils.highlightText(prompt.title, query);
                    }
                }
            } else if (node.dataset.type === 'category') {
                // Show category if it has visible children
                const hasVisibleChildren = Array.from(node.querySelectorAll('.tree-node[data-type="prompt"]'))
                    .some(child => child.style.display !== 'none');
                
                node.style.display = hasVisibleChildren ? '' : 'none';
                
                // Auto-expand categories with matches
                if (hasVisibleChildren) {
                    this.expandNode(node);
                }
            }
        });
    }
    
    /**
     * Clear search filter
     */
    clearSearchFilter() {
        this.searchQuery = '';
        this.filteredNodes.clear();
        
        // Show all nodes and remove highlighting
        this.container.querySelectorAll('.tree-node').forEach(node => {
            node.style.display = '';
            
            const label = node.querySelector('.tree-node__label');
            if (label && node.dataset.type === 'prompt') {
                const prompt = this.storage.prompts.get(node.dataset.id);
                if (prompt) {
                    label.textContent = prompt.title;
                }
            }
        });
    }
    
    /**
     * Duplicate prompt
     * @param {string} promptId - Prompt ID to duplicate
     */
    duplicatePrompt(promptId) {
        const prompt = this.storage.prompts.get(promptId);
        if (!prompt) return;
        
        const duplicated = prompt.clone();
        this.storage.prompts.set(duplicated.id, duplicated);
        this.storage.savePrompts();
        
        this.render();
        
        DOMUtils.showToast('Prompt duplicato con successo', 'success');
    }
    
    /**
     * Toggle favorite status
     * @param {string} promptId - Prompt ID
     */
    toggleFavorite(promptId) {
        const prompt = this.storage.prompts.get(promptId);
        if (!prompt) return;
        
        prompt.update({ isFavorite: !prompt.isFavorite });
        
        if (prompt.isFavorite) {
            this.storage.favorites.add(promptId);
        } else {
            this.storage.favorites.delete(promptId);
        }
        
        this.storage.savePrompts();
        this.storage.saveFavorites();
        
        this.render();
        
        const message = prompt.isFavorite ? 'Aggiunto ai preferiti' : 'Rimosso dai preferiti';
        DOMUtils.showToast(message, 'success');
    }
    
    /**
     * Delete prompt
     * @param {string} promptId - Prompt ID to delete
     */
    deletePrompt(promptId) {
        const prompt = this.storage.prompts.get(promptId);
        if (!prompt) return;
        
        if (confirm(`Sei sicuro di voler eliminare il prompt "${prompt.title}"?`)) {
            this.storage.prompts.delete(promptId);
            this.storage.favorites.delete(promptId);
            
            this.storage.savePrompts();
            this.storage.saveFavorites();
            
            this.render();
            
            // Clear selection if deleted prompt was selected
            if (this.selectedNode && this.selectedNode.dataset.id === promptId) {
                this.selectedNode = null;
                window.dispatchEvent(new CustomEvent('prompt-deselected'));
            }
            
            DOMUtils.showToast('Prompt eliminato', 'success');
        }
    }
    
    /**
     * Save expanded state to storage
     */
    saveExpandedState() {
        const expandedArray = Array.from(this.expandedNodes);
        this.storage.settings.expandedNodes = expandedArray;
        this.storage.saveSettings();
    }
    
    /**
     * Load expanded state from storage
     */
    loadExpandedState() {
        const expandedArray = this.storage.settings.expandedNodes || [];
        this.expandedNodes = new Set(expandedArray);
    }
    
    /**
     * Restore expanded state after render
     */
    restoreExpandedState() {
        this.expandedNodes.forEach(path => {
            const node = this.container.querySelector(`[data-path="${path}"]`);
            if (node) {
                this.expandNode(node);
            }
        });
    }
    
    /**
     * Refresh tree view
     */
    refresh() {
        this.render();
    }

    expandAll() {
        this.container.querySelectorAll('.tree-node[data-type="category"]').forEach(folderNode => {
            this.toggleNode(folderNode, true);
        });
    }

    collapseAll() {
        this.container.querySelectorAll('.tree-node[data-type="category"]').forEach(folderNode => {
            if (folderNode.dataset.path !== 'favorites') { 
                this.toggleNode(folderNode, false);
            }
        });
    }
    
    /**
     * Get selected prompt ID
     * @returns {string|null} Selected prompt ID
     */
    getSelectedPromptId() {
        return this.selectedNode && this.selectedNode.dataset.type === 'prompt' 
            ? this.selectedNode.dataset.id 
            : null;
    }
    
    /**
     * Select prompt by ID
     * @param {string} promptId - Prompt ID to select
     */
    selectPromptById(promptId) {
        const node = this.container.querySelector(`[data-id="${promptId}"]`);
        if (node) {
            this.selectNode(node);
            
            // Ensure node is visible (expand parent categories)
            let parent = node.parentElement;
            while (parent && parent !== this.container) {
                if (parent.classList.contains('tree-node') && parent.dataset.type === 'category') {
                    this.expandNode(parent);
                }
                parent = parent.parentElement;
            }
            
            // Scroll into view
            DOMUtils.scrollIntoView(node);
        }
    }
}

// Export for use in other modules
window.TreeView = TreeView;

