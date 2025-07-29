/**
 * DOM Utility Functions
 * Provides helper functions for DOM manipulation and event handling
 */

class DOMUtils {
    /**
     * Create an element with attributes and children
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {Array|string|Element} children - Child elements or text
     * @returns {Element} Created element
     */
    static createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else if (key.startsWith('on') && typeof value === 'function') {
                element.addEventListener(key.slice(2).toLowerCase(), value);
            } else {
                element.setAttribute(key, value);
            }
        });
        
        // Add children
        if (typeof children === 'string') {
            element.textContent = children;
        } else if (children instanceof Element) {
            element.appendChild(children);
        } else if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Element) {
                    element.appendChild(child);
                }
            });
        }
        
        return element;
    }
    
    /**
     * Create an SVG icon element
     * @param {string} iconName - Icon identifier
     * @param {Object} attributes - SVG attributes
     * @returns {Element} SVG element
     */
    static createIcon(iconName, attributes = {}) {
        const icons = {
            chevronRight: 'M9 18l6-6-6-6',
            folder: 'M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z',
            file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14,2 L14,8 L20,8',
            star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
            starFilled: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
            plus: 'M12 5v14m-7-7h14',
            edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
            trash: 'M3 6h18m-2 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2',
            copy: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2m8 0V2a2 2 0 00-2-2H8a2 2 0 00-2 2v2m8 0H8',
            search: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
            x: 'M18 6L6 18M6 6l12 12'
        };
        
        const path = icons[iconName] || '';
        const defaultAttrs = {
            width: '16',
            height: '16',
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: '2',
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
        };
        
        const svgAttrs = { ...defaultAttrs, ...attributes };
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        
        Object.entries(svgAttrs).forEach(([key, value]) => {
            svg.setAttribute(key, value);
        });
        
        if (path.includes('M')) {
            // Single path
            const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            pathElement.setAttribute('d', path);
            svg.appendChild(pathElement);
        } else {
            // Multiple elements (like file icon)
            const paths = path.split(' ');
            paths.forEach(p => {
                if (p.trim()) {
                    const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    pathElement.setAttribute('d', p);
                    svg.appendChild(pathElement);
                }
            });
        }
        
        return svg;
    }
    
    /**
     * Add event listener with automatic cleanup
     * @param {Element} element - Target element
     * @param {string} event - Event type
     * @param {Function} handler - Event handler
     * @param {Object} options - Event options
     * @returns {Function} Cleanup function
     */
    static addEventListener(element, event, handler, options = {}) {
        element.addEventListener(event, handler, options);
        return () => element.removeEventListener(event, handler, options);
    }
    
    /**
     * Debounce function calls
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Throttle function calls
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Get element position relative to viewport
     * @param {Element} element - Target element
     * @returns {Object} Position object with x, y, width, height
     */
    static getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom
        };
    }
    
    /**
     * Check if element is in viewport
     * @param {Element} element - Target element
     * @returns {boolean} True if element is visible
     */
    static isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    
    /**
     * Scroll element into view smoothly
     * @param {Element} element - Target element
     * @param {Object} options - Scroll options
     */
    static scrollIntoView(element, options = {}) {
        const defaultOptions = {
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
        };
        element.scrollIntoView({ ...defaultOptions, ...options });
    }
    
    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     * @returns {Promise<boolean>} Success status
     */
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const success = document.execCommand('copy');
                textArea.remove();
                return success;
            }
        } catch (error) {
            console.error('Failed to copy text:', error);
            return false;
        }
    }
    
    /**
     * Escape HTML special characters
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * Highlight search terms in text
     * @param {string} text - Original text
     * @param {string} searchTerm - Term to highlight
     * @returns {string} HTML with highlighted terms
     */
    static highlightText(text, searchTerm) {
        if (!searchTerm || !text) return this.escapeHtml(text);
        
        const escapedText = this.escapeHtml(text);
        const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedTerm})`, 'gi');
        
        return escapedText.replace(regex, '<span class="search-highlight">$1</span>');
    }
    
    /**
     * Generate unique ID
     * @param {string} prefix - ID prefix
     * @returns {string} Unique ID
     */
    static generateId(prefix = 'id') {
        return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Format file size
     * @param {number} bytes - Size in bytes
     * @returns {string} Formatted size
     */
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Format date
     * @param {Date|string} date - Date to format
     * @param {Object} options - Intl.DateTimeFormat options
     * @returns {string} Formatted date
     */
    static formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        const dateObj = date instanceof Date ? date : new Date(date);
        return new Intl.DateTimeFormat('it-IT', { ...defaultOptions, ...options }).format(dateObj);
    }
    
    /**
     * Show toast notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Display duration in milliseconds
     */
    static showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = this.createElement('div', {
            className: `toast toast--${type}`
        });
        
        const icon = this.createIcon(type === 'success' ? 'check' : type === 'error' ? 'x' : 'info');
        icon.setAttribute('class', 'toast__icon');
        
        const content = this.createElement('div', {
            className: 'toast__content'
        }, message);
        
        const closeBtn = this.createElement('button', {
            className: 'toast__close',
            onclick: () => toast.remove()
        }, [this.createIcon('x')]);
        
        toast.appendChild(icon);
        toast.appendChild(content);
        toast.appendChild(closeBtn);
        
        container.appendChild(toast);
        
        // Auto remove after duration
        if (duration > 0) {
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, duration);
        }
    }
}

// Export for use in other modules
window.DOMUtils = DOMUtils;

