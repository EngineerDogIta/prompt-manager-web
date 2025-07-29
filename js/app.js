/**
 * Main Application Entry Point
 * Initializes and starts the Prompt Collection Manager
 */

// Global application instance
let appController = null;

/**
 * Initialize application when DOM is ready
 */
function initializeApp() {
    try {
        console.log('Initializing Prompt Collection Manager...');
        
        // Check for required dependencies
        if (!window.jsyaml) {
            throw new Error('js-yaml library not loaded');
        }
        
        // Check for required DOM elements
        const requiredElements = [
            'app',
            'tree-view',
            'content-area',
            'prompt-editor-modal',
            'search-input'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        if (missingElements.length > 0) {
            throw new Error(`Missing required DOM elements: ${missingElements.join(', ')}`);
        }
        
        // Initialize application controller
        appController = new AppController();
        
        // Make it globally accessible for debugging
        window.appController = appController;
        
        // Setup error handling
        setupErrorHandling();
        
        // Setup performance monitoring
        setupPerformanceMonitoring();
        
        console.log('Prompt Collection Manager initialization started');
        
    } catch (error) {
        console.error('Failed to initialize application:', error);
        showInitializationError(error);
    }
}

/**
 * Setup global error handling
 */
function setupErrorHandling() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        console.error('Uncaught error:', event.error);
        
        if (window.DOMUtils) {
            DOMUtils.showToast(
                'Si è verificato un errore imprevisto. Controlla la console per i dettagli.',
                'error',
                5000
            );
        }
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        if (window.DOMUtils) {
            DOMUtils.showToast(
                'Errore durante un\'operazione asincrona. Controlla la console per i dettagli.',
                'error',
                5000
            );
        }
        
        // Prevent the default browser behavior
        event.preventDefault();
    });
}

/**
 * Setup performance monitoring
 */
function setupPerformanceMonitoring() {
    // Monitor page load performance
    window.addEventListener('load', () => {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            
            console.log(`Page load time: ${loadTime}ms`);
            
            // Log performance metrics
            const metrics = {
                domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                domComplete: timing.domComplete - timing.navigationStart,
                loadComplete: loadTime
            };
            
            console.log('Performance metrics:', metrics);
        }
    });
    
    // Monitor memory usage (if available)
    if (window.performance && window.performance.memory) {
        setInterval(() => {
            const memory = window.performance.memory;
            const memoryInfo = {
                used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
            };
            
            // Log memory usage every 5 minutes
            console.log('Memory usage (MB):', memoryInfo);
            
            // Warn if memory usage is high
            if (memoryInfo.used > memoryInfo.limit * 0.8) {
                console.warn('High memory usage detected');
                
                if (window.DOMUtils) {
                    DOMUtils.showToast(
                        'Utilizzo memoria elevato. Considera di ricaricare la pagina.',
                        'warning'
                    );
                }
            }
        }, 5 * 60 * 1000); // 5 minutes
    }
}

/**
 * Show initialization error
 * @param {Error} error - Error object
 */
function showInitializationError(error) {
    const app = document.getElementById('app');
    if (app) {
        app.innerHTML = `
            <div class="error-screen">
                <div class="error-screen__content">
                    <h1>Errore di Inizializzazione</h1>
                    <p>Si è verificato un errore durante l'avvio dell'applicazione:</p>
                    <pre class="error-screen__details">${error.message}</pre>
                    <div class="error-screen__actions">
                        <button class="btn btn--primary" onclick="location.reload()">
                            Ricarica Pagina
                        </button>
                        <button class="btn btn--secondary" onclick="clearApplicationData()">
                            Cancella Dati e Ricarica
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Add error screen styles
        const style = document.createElement('style');
        style.textContent = `
            .error-screen {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                padding: 2rem;
                background-color: var(--bg-primary, #ffffff);
                color: var(--text-primary, #1a1a1a);
            }
            
            .error-screen__content {
                text-align: center;
                max-width: 600px;
            }
            
            .error-screen__content h1 {
                color: var(--error-color, #d93025);
                margin-bottom: 1rem;
            }
            
            .error-screen__content p {
                margin-bottom: 1rem;
                color: var(--text-secondary, #5f6368);
            }
            
            .error-screen__details {
                background-color: var(--bg-secondary, #f8f9fa);
                border: 1px solid var(--border-color, #dadce0);
                border-radius: 4px;
                padding: 1rem;
                margin: 1rem 0;
                text-align: left;
                overflow-x: auto;
                font-family: monospace;
                font-size: 0.875rem;
            }
            
            .error-screen__actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                margin-top: 2rem;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Clear application data and reload
 */
function clearApplicationData() {
    try {
        // Clear localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('prompt-manager-')) {
                localStorage.removeItem(key);
            }
        });
        
        console.log('Application data cleared');
        location.reload();
        
    } catch (error) {
        console.error('Failed to clear application data:', error);
        alert('Errore durante la cancellazione dei dati. Prova a cancellare manualmente i dati del browser.');
    }
}

/**
 * Check browser compatibility
 */
function checkBrowserCompatibility() {
    const requiredFeatures = [
        'localStorage',
        'JSON',
        'Promise',
        'fetch',
        'addEventListener',
        'querySelector',
        'classList'
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => {
        switch (feature) {
            case 'localStorage':
                return !window.localStorage;
            case 'JSON':
                return !window.JSON;
            case 'Promise':
                return !window.Promise;
            case 'fetch':
                return !window.fetch;
            case 'addEventListener':
                return !document.addEventListener;
            case 'querySelector':
                return !document.querySelector;
            case 'classList':
                return !document.createElement('div').classList;
            default:
                return false;
        }
    });
    
    if (missingFeatures.length > 0) {
        const message = `Il tuo browser non supporta alcune funzionalità richieste: ${missingFeatures.join(', ')}. 
                        Aggiorna il browser o usa una versione più recente.`;
        
        alert(message);
        return false;
    }
    
    return true;
}

/**
 * Show browser compatibility warning
 */
function showCompatibilityWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff6b6b;
        color: white;
        padding: 1rem;
        text-align: center;
        z-index: 9999;
        font-family: Arial, sans-serif;
    `;
    warning.innerHTML = `
        <strong>Browser non supportato</strong> - 
        Alcune funzionalità potrebbero non funzionare correttamente. 
        Aggiorna il tuo browser per un'esperienza ottimale.
        <button onclick="this.parentElement.remove()" style="margin-left: 1rem; background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.25rem 0.5rem; border-radius: 3px; cursor: pointer;">
            Chiudi
        </button>
    `;
    document.body.insertBefore(warning, document.body.firstChild);
}

/**
 * Initialize when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Check browser compatibility
        if (!checkBrowserCompatibility()) {
            showCompatibilityWarning();
        }
        
        // Initialize app
        initializeApp();
    });
} else {
    // DOM is already ready
    if (!checkBrowserCompatibility()) {
        showCompatibilityWarning();
    }
    
    initializeApp();
}

document.getElementById('welcome-add-prompt-btn').addEventListener('click', () => {
    document.getElementById('add-prompt-btn').click();
});

// Export for debugging
window.initializeApp = initializeApp;
window.clearApplicationData = clearApplicationData;

// Service Worker registration (if available)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Note: Service worker would be implemented separately
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered:', registration))
        //     .catch(error => console.log('SW registration failed:', error));
    });
}

// Analytics and monitoring (placeholder)
function trackEvent(eventName, properties = {}) {
    console.log('Event tracked:', eventName, properties);
    
    // Here you could integrate with analytics services like:
    // - Google Analytics
    // - Mixpanel
    // - Custom analytics endpoint
}

// Export tracking function
window.trackEvent = trackEvent;

// Track app initialization
trackEvent('app_initialized', {
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    language: navigator.language,
    screen: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`
});

console.log('Prompt Collection Manager - Main script loaded');
console.log('Version: 1.0.0');
console.log('Build: Web Application');
console.log('Environment:', window.location.hostname === 'localhost' ? 'Development' : 'Production');

