/**
 * Enhanced toggle functions with smooth scrolling
 * Improves UX by scrolling to expanded sections automatically
 */

// Store original toggle functions
let originalToggleEquations = null;
let originalToggleInstructions = null;

/**
 * Enhanced toggle for equations panel with smooth scroll
 */
function enhancedToggleEquations() {
    const content = document.getElementById('equationContent');
    const toggle = document.getElementById('equationToggle');
    const panel = document.getElementById('equationPanel');
    
    // Toggle the content
    content.classList.toggle('active');
    toggle.className = content.classList.contains('active') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    
    // If expanding, scroll to the panel
    if (content.classList.contains('active') && panel) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
            scrollToElement(panel);
        }, 100);
    }
}

/**
 * Enhanced toggle for instructions panel with smooth scroll
 */
function enhancedToggleInstructions() {
    const content = document.getElementById('instructionsContent');
    const toggle = document.getElementById('instructionsToggle');
    const panel = document.getElementById('instructionsPanel');
    
    // Toggle the content
    content.classList.toggle('active');
    toggle.className = content.classList.contains('active') ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
    
    // If expanding, scroll to the panel
    if (content.classList.contains('active') && panel) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
            scrollToElement(panel);
        }, 100);
    }
}

/**
 * Smooth scroll to element with offset for fixed headers
 */
function scrollToElement(element) {
    if (!element) return;
    
    // Calculate offset for any fixed headers
    const headerHeight = calculateHeaderHeight();
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerHeight - 20; // 20px extra padding
    
    // Check if browser supports smooth scrolling
    if ('scrollBehavior' in document.documentElement.style) {
        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    } else {
        // Fallback for browsers without smooth scroll support
        smoothScrollPolyfill(offsetPosition);
    }
}

/**
 * Calculate total height of fixed headers
 */
function calculateHeaderHeight() {
    let totalHeight = 0;
    
    // Check for main header
    const header = document.querySelector('.header');
    if (header) {
        const headerStyle = window.getComputedStyle(header);
        if (headerStyle.position === 'fixed' || headerStyle.position === 'sticky') {
            totalHeight += header.offsetHeight;
        }
    }
    
    // Check for control panel
    const controlPanel = document.querySelector('.control-panel');
    if (controlPanel) {
        const panelStyle = window.getComputedStyle(controlPanel);
        if (panelStyle.position === 'fixed' || panelStyle.position === 'sticky') {
            totalHeight += controlPanel.offsetHeight;
        }
    }
    
    return totalHeight;
}

/**
 * Smooth scroll polyfill for older browsers
 */
function smoothScrollPolyfill(targetPosition) {
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 500; // 500ms scroll duration
    let start = null;
    
    function animation(currentTime) {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const progress = Math.min(timeElapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeInOutCubic = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        window.scrollTo(0, startPosition + (distance * easeInOutCubic));
        
        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    }
    
    requestAnimationFrame(animation);
}

/**
 * Initialize enhanced toggle functions
 */
function initializeEnhancedToggles() {
    // Wait for original functions to be available
    if (typeof window.toggleEquations === 'function' && typeof window.toggleInstructions === 'function') {
        // Store originals
        originalToggleEquations = window.toggleEquations;
        originalToggleInstructions = window.toggleInstructions;
        
        // Replace with enhanced versions
        window.toggleEquations = enhancedToggleEquations;
        window.toggleInstructions = enhancedToggleInstructions;
        
        console.log('Toggle functions enhanced with smooth scrolling');
        
        // Also enhance click handlers on the panels themselves
        enhancePanelClickHandlers();
    } else {
        // Try again in 100ms
        setTimeout(initializeEnhancedToggles, 100);
    }
}

/**
 * Enhance panel header click handlers
 */
function enhancePanelClickHandlers() {
    // Equation panel header
    const equationHeader = document.querySelector('#equationPanel .equation-header');
    if (equationHeader) {
        equationHeader.onclick = enhancedToggleEquations;
    }
    
    // Instructions panel header
    const instructionsHeader = document.querySelector('#instructionsPanel .instructions-header');
    if (instructionsHeader) {
        instructionsHeader.onclick = enhancedToggleInstructions;
    }
}

/**
 * Handle keyboard accessibility
 */
document.addEventListener('keydown', (event) => {
    // Allow Enter/Space to toggle when focused
    if (event.key === 'Enter' || event.key === ' ') {
        const activeElement = document.activeElement;
        
        if (activeElement && (
            activeElement.onclick === enhancedToggleEquations ||
            activeElement.onclick === enhancedToggleInstructions
        )) {
            event.preventDefault();
            activeElement.click();
        }
    }
});

/**
 * Ensure smooth scrolling is applied even after dynamic content changes
 */
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            // Re-apply enhanced handlers if panels are re-rendered
            enhancePanelClickHandlers();
        }
    });
});

// Start observing once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.main-container') || document.body;
    observer.observe(container, { childList: true, subtree: true });
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEnhancedToggles);
} else {
    initializeEnhancedToggles();
}

// Export for testing
window.enhancedToggleEquations = enhancedToggleEquations;
window.enhancedToggleInstructions = enhancedToggleInstructions;
window.scrollToElement = scrollToElement;