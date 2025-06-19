/**
 * Table Scroll Handler
 * Manages scroll indicators and table navigation improvements
 */

(function() {
    'use strict';
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTableScrollHandler);
    } else {
        initTableScrollHandler();
    }
    
    function initTableScrollHandler() {
        const tableWrapper = document.querySelector('.table-wrapper');
        if (!tableWrapper) return;
        
        // Update scroll indicators
        function updateScrollIndicators() {
            const scrollLeft = tableWrapper.scrollLeft;
            const scrollWidth = tableWrapper.scrollWidth;
            const clientWidth = tableWrapper.clientWidth;
            
            // Check if content is scrollable
            if (scrollWidth <= clientWidth) {
                tableWrapper.classList.remove('has-scroll-left', 'has-scroll-right');
                return;
            }
            
            // Update classes based on scroll position
            tableWrapper.classList.toggle('has-scroll-left', scrollLeft > 10);
            tableWrapper.classList.toggle('has-scroll-right', 
                scrollLeft < scrollWidth - clientWidth - 10);
        }
        
        // Add scroll listener
        tableWrapper.addEventListener('scroll', updateScrollIndicators);
        
        // Update on window resize
        window.addEventListener('resize', updateScrollIndicators);
        
        // Initial check
        updateScrollIndicators();
        
        // Handle table updates
        const timelineTable = document.getElementById('timelineTable');
        if (timelineTable) {
            // Create mutation observer to detect table changes
            const observer = new MutationObserver((mutations) => {
                // Add updating class
                timelineTable.classList.add('updating');
                
                // Remove updating class after a short delay
                setTimeout(() => {
                    timelineTable.classList.remove('updating');
                    updateScrollIndicators();
                }, 300);
            });
            
            // Observe table body for changes
            const tbody = document.getElementById('timelineBody');
            if (tbody) {
                observer.observe(tbody, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: ['value']
                });
            }
        }
        
        // Smooth scroll to newly added rows
        window.addEventListener('rowAdded', (event) => {
            const newRow = event.detail.row;
            if (newRow) {
                setTimeout(() => {
                    newRow.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 100);
            }
        });
    }
    
    // Expose function to trigger manual updates
    window.updateTableScrollIndicators = function() {
        const tableWrapper = document.querySelector('.table-wrapper');
        if (tableWrapper) {
            const event = new Event('scroll');
            tableWrapper.dispatchEvent(event);
        }
    };
})();