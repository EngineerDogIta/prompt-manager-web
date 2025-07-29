/**
 * Theme Utility Functions
 * Handles theme switching and persistence
 */

class ThemeUtils {
    static STORAGE_KEY = 'prompt-manager-theme';
    static THEMES = {
        LIGHT: 'light',
        DARK: 'dark'
    };
    
    /**
     * Initialize theme system
     */
    static init() {
        this.loadTheme();
        this.setupThemeToggle();
        this.detectSystemTheme();
    }
    
    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    static getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || this.THEMES.LIGHT;
    }
    
    /**
     * Set theme
     * @param {string} theme - Theme name
     */
    static setTheme(theme) {
        if (!Object.values(this.THEMES).includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }
        
        document.documentElement.setAttribute('data-theme', theme);
        this.saveTheme(theme);
        this.updateThemeToggle(theme);
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme }
        }));
    }
    
    /**
     * Toggle between light and dark theme
     */
    static toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === this.THEMES.LIGHT ? this.THEMES.DARK : this.THEMES.LIGHT;
        this.setTheme(newTheme);
    }
    
    /**
     * Load theme from storage
     */
    static loadTheme() {
        try {
            const savedTheme = localStorage.getItem(this.STORAGE_KEY);
            if (savedTheme && Object.values(this.THEMES).includes(savedTheme)) {
                this.setTheme(savedTheme);
            } else {
                // Use system preference if no saved theme
                const systemTheme = this.getSystemTheme();
                this.setTheme(systemTheme);
            }
        } catch (error) {
            console.warn('Failed to load theme from storage:', error);
            this.setTheme(this.THEMES.LIGHT);
        }
    }
    
    /**
     * Save theme to storage
     * @param {string} theme - Theme to save
     */
    static saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEY, theme);
        } catch (error) {
            console.warn('Failed to save theme to storage:', error);
        }
    }
    
    /**
     * Get system theme preference
     * @returns {string} System theme
     */
    static getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return this.THEMES.DARK;
        }
        return this.THEMES.LIGHT;
    }
    
    /**
     * Detect system theme changes
     */
    static detectSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            // Listen for changes in system theme preference
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a theme
                const savedTheme = localStorage.getItem(this.STORAGE_KEY);
                if (!savedTheme) {
                    const systemTheme = e.matches ? this.THEMES.DARK : this.THEMES.LIGHT;
                    this.setTheme(systemTheme);
                }
            });
        }
    }
    
    /**
     * Setup theme toggle button
     */
    static setupThemeToggle() {
        const toggleButton = document.getElementById('theme-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleTheme();
            });
            
            // Update initial state
            this.updateThemeToggle(this.getCurrentTheme());
        }
    }
    
    /**
     * Update theme toggle button appearance
     * @param {string} theme - Current theme
     */
    static updateThemeToggle(theme) {
        const toggleButton = document.getElementById('theme-toggle');
        if (!toggleButton) return;
        
        const lightIcon = toggleButton.querySelector('.theme-icon--light');
        const darkIcon = toggleButton.querySelector('.theme-icon--dark');
        
        if (theme === this.THEMES.DARK) {
            toggleButton.setAttribute('title', 'Passa al tema chiaro');
            toggleButton.setAttribute('aria-label', 'Passa al tema chiaro');
        } else {
            toggleButton.setAttribute('title', 'Passa al tema scuro');
            toggleButton.setAttribute('aria-label', 'Passa al tema scuro');
        }
    }
    
    /**
     * Get theme colors for dynamic styling
     * @param {string} theme - Theme name
     * @returns {Object} Theme color object
     */
    static getThemeColors(theme = null) {
        const currentTheme = theme || this.getCurrentTheme();
        
        const colors = {
            [this.THEMES.LIGHT]: {
                primary: '#ffffff',
                secondary: '#f8f9fa',
                tertiary: '#e9ecef',
                text: '#1a1a1a',
                textSecondary: '#5f6368',
                border: '#dadce0',
                accent: '#1a73e8'
            },
            [this.THEMES.DARK]: {
                primary: '#1a1a1a',
                secondary: '#2d2d2d',
                tertiary: '#404040',
                text: '#e8eaed',
                textSecondary: '#9aa0a6',
                border: '#5f6368',
                accent: '#8ab4f8'
            }
        };
        
        return colors[currentTheme] || colors[this.THEMES.LIGHT];
    }
    
    /**
     * Apply theme to dynamically created elements
     * @param {Element} element - Element to theme
     * @param {Object} styles - Style overrides
     */
    static applyThemeToElement(element, styles = {}) {
        const colors = this.getThemeColors();
        
        const defaultStyles = {
            backgroundColor: colors.primary,
            color: colors.text,
            borderColor: colors.border
        };
        
        const finalStyles = { ...defaultStyles, ...styles };
        
        Object.entries(finalStyles).forEach(([property, value]) => {
            element.style[property] = value;
        });
    }
    
    /**
     * Get CSS custom property value
     * @param {string} property - CSS custom property name (without --)
     * @returns {string} Property value
     */
    static getCSSCustomProperty(property) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(`--${property}`)
            .trim();
    }
    
    /**
     * Set CSS custom property value
     * @param {string} property - CSS custom property name (without --)
     * @param {string} value - Property value
     */
    static setCSSCustomProperty(property, value) {
        document.documentElement.style.setProperty(`--${property}`, value);
    }
    
    /**
     * Create theme-aware color palette
     * @returns {Object} Color palette object
     */
    static createColorPalette() {
        return {
            // Background colors
            bgPrimary: this.getCSSCustomProperty('bg-primary'),
            bgSecondary: this.getCSSCustomProperty('bg-secondary'),
            bgTertiary: this.getCSSCustomProperty('bg-tertiary'),
            bgHover: this.getCSSCustomProperty('bg-hover'),
            bgActive: this.getCSSCustomProperty('bg-active'),
            
            // Text colors
            textPrimary: this.getCSSCustomProperty('text-primary'),
            textSecondary: this.getCSSCustomProperty('text-secondary'),
            textTertiary: this.getCSSCustomProperty('text-tertiary'),
            textInverse: this.getCSSCustomProperty('text-inverse'),
            
            // Border colors
            borderColor: this.getCSSCustomProperty('border-color'),
            borderHover: this.getCSSCustomProperty('border-hover'),
            borderFocus: this.getCSSCustomProperty('border-focus'),
            
            // Accent colors
            accentColor: this.getCSSCustomProperty('accent-color'),
            accentColorHover: this.getCSSCustomProperty('accent-color-hover'),
            accentColorAlpha: this.getCSSCustomProperty('accent-color-alpha'),
            
            // Status colors
            successColor: this.getCSSCustomProperty('success-color'),
            warningColor: this.getCSSCustomProperty('warning-color'),
            errorColor: this.getCSSCustomProperty('error-color'),
            infoColor: this.getCSSCustomProperty('info-color')
        };
    }
    
    /**
     * Check if user prefers reduced motion
     * @returns {boolean} True if reduced motion is preferred
     */
    static prefersReducedMotion() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    
    /**
     * Check if user prefers high contrast
     * @returns {boolean} True if high contrast is preferred
     */
    static prefersHighContrast() {
        return window.matchMedia && window.matchMedia('(prefers-contrast: high)').matches;
    }
    
    /**
     * Get transition duration based on user preferences
     * @param {string} duration - Default duration (fast, normal, slow)
     * @returns {string} CSS transition duration
     */
    static getTransitionDuration(duration = 'normal') {
        if (this.prefersReducedMotion()) {
            return '0.01ms';
        }
        
        const durations = {
            fast: this.getCSSCustomProperty('transition-fast'),
            normal: this.getCSSCustomProperty('transition-normal'),
            slow: this.getCSSCustomProperty('transition-slow')
        };
        
        return durations[duration] || durations.normal;
    }
    
    /**
     * Export current theme settings
     * @returns {Object} Theme settings object
     */
    static exportThemeSettings() {
        return {
            theme: this.getCurrentTheme(),
            systemTheme: this.getSystemTheme(),
            prefersReducedMotion: this.prefersReducedMotion(),
            prefersHighContrast: this.prefersHighContrast(),
            colorPalette: this.createColorPalette()
        };
    }
    
    /**
     * Import theme settings
     * @param {Object} settings - Theme settings object
     */
    static importThemeSettings(settings) {
        if (settings.theme && Object.values(this.THEMES).includes(settings.theme)) {
            this.setTheme(settings.theme);
        }
    }
}

// Initialize theme system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        ThemeUtils.init();
    });
} else {
    ThemeUtils.init();
}

// Export for use in other modules
window.ThemeUtils = ThemeUtils;

