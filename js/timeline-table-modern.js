/**
 * Modern Timeline Table JavaScript
 * Handles scroll indicators, responsive behavior, and enhanced interactions
 */

(function() {
    'use strict';
    
    class TimelineTableManager {
        constructor() {
            this.container = null;
            this.scrollWrapper = null;
            this.table = null;
            this.isInitialized = false;
            
            // Bind methods
            this.handleScroll = this.handleScroll.bind(this);
            this.handleResize = this.handleResize.bind(this);
            this.checkScrollPosition = this.checkScrollPosition.bind(this);
        }
        
        /**
         * Initialize the table manager
         */
        init() {
            // Wait for DOM ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.setup());
            } else {
                this.setup();
            }
        }
        
        /**
         * Setup the table enhancement
         */
        setup() {
            // Find table first
            this.table = document.getElementById('timelineTable');
            
            if (!this.table) {
                console.warn('Timeline table not found');
                return;
            }
            
            // Check if already wrapped
            this.container = document.querySelector('.timeline-table-container');
            this.scrollWrapper = document.querySelector('.timeline-table-scroll-wrapper');
            
            // If not wrapped, wrap the table
            if (!this.container || !this.scrollWrapper) {
                this.wrapTable();
            }
            
            // Add modern table class
            this.table.classList.add('timeline-table')
            
            // Add scroll indicators
            this.addScrollIndicators();
            
            // Setup event listeners
            this.scrollWrapper.addEventListener('scroll', this.handleScroll);
            window.addEventListener('resize', this.handleResize);
            
            // Initial checks
            this.checkScrollPosition();
            this.updateScrolledState();
            
            // Watch for table content changes
            this.observeTableChanges();
            
            this.isInitialized = true;
        }
        
        /**
         * Wrap table in proper container structure
         */
        wrapTable() {
            const tableParent = this.table.parentElement;
            
            // Create container
            const container = document.createElement('div');
            container.className = 'timeline-table-container';
            
            // Create scroll wrapper
            const scrollWrapper = document.createElement('div');
            scrollWrapper.className = 'timeline-table-scroll-wrapper';
            
            // Insert container
            tableParent.insertBefore(container, this.table);
            container.appendChild(scrollWrapper);
            scrollWrapper.appendChild(this.table);
            
            // Update references
            this.container = container;
            this.scrollWrapper = scrollWrapper;
        }
        
        /**
         * Add scroll indicator elements
         */
        addScrollIndicators() {
            // Left indicator
            const leftIndicator = document.createElement('div');
            leftIndicator.className = 'scroll-indicator scroll-indicator-left';
            this.container.appendChild(leftIndicator);
            
            // Right indicator
            const rightIndicator = document.createElement('div');
            rightIndicator.className = 'scroll-indicator scroll-indicator-right';
            this.container.appendChild(rightIndicator);
        }
        
        /**
         * Handle scroll events
         */
        handleScroll() {
            // Throttle scroll events
            if (this.scrollTimeout) {
                cancelAnimationFrame(this.scrollTimeout);
            }
            
            this.scrollTimeout = requestAnimationFrame(() => {
                this.checkScrollPosition();
                this.updateScrolledState();
            });
        }
        
        /**
         * Check scroll position and update indicators
         */
        checkScrollPosition() {
            if (!this.scrollWrapper || !this.container) {
                return;
            }
            
            const scrollLeft = this.scrollWrapper.scrollLeft;
            const scrollWidth = this.scrollWrapper.scrollWidth;
            const clientWidth = this.scrollWrapper.clientWidth;
            
            // Can scroll left?
            const canScrollLeft = scrollLeft > 5;
            this.container.classList.toggle('can-scroll-left', canScrollLeft);
            
            // Can scroll right?
            const canScrollRight = scrollLeft < scrollWidth - clientWidth - 5;
            this.container.classList.toggle('can-scroll-right', canScrollRight);
        }
        
        /**
         * Update scrolled state for header shadow
         */
        updateScrolledState() {
            if (!this.scrollWrapper || !this.container) {
                return;
            }
            
            const scrollTop = this.scrollWrapper.scrollTop || window.pageYOffset;
            this.container.classList.toggle('scrolled', scrollTop > 0);
        }
        
        /**
         * Handle window resize
         */
        handleResize() {
            // Debounce resize events
            if (this.resizeTimeout) {
                clearTimeout(this.resizeTimeout);
            }
            
            this.resizeTimeout = setTimeout(() => {
                this.checkScrollPosition();
            }, 150);
        }
        
        /**
         * Observe table changes for dynamic content
         */
        observeTableChanges() {
            const observer = new MutationObserver(() => {
                // Recheck scroll position when content changes
                setTimeout(() => {
                    this.checkScrollPosition();
                }, 100);
            });
            
            // Observe tbody for row changes
            const tbody = this.table.querySelector('tbody');
            if (tbody) {
                observer.observe(tbody, {
                    childList: true,
                    subtree: true
                });
            }
        }
        
        /**
         * Enhance table structure for modern layout
         */
        enhanceTableStructure() {
            // Add numeric class to appropriate headers
            const numericColumns = [3, 4, 5, 6, 7, 9, 10, 11]; // 0-indexed
            const headers = this.table.querySelectorAll('thead th');
            
            headers.forEach((th, index) => {
                if (numericColumns.includes(index)) {
                    th.classList.add('numeric');
                }
            });
            
            // Add classes to tbody cells
            const rows = this.table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                cells.forEach((td, index) => {
                    if (numericColumns.includes(index)) {
                        td.classList.add('numeric');
                    }
                    
                    // Add currency class to specific columns
                    if ([5, 6, 9, 10, 11].includes(index)) {
                        const isCurrencyCell = !td.querySelector('input');
                        if (isCurrencyCell) {
                            td.classList.add('currency');
                        }
                    }
                });
            });
        }
        
        /**
         * Scroll to newly added row
         */
        scrollToNewRow(row) {
            if (!row) return;
            
            setTimeout(() => {
                const rowRect = row.getBoundingClientRect();
                const containerRect = this.container.getBoundingClientRect();
                
                // Check if row is outside viewport
                if (rowRect.bottom > containerRect.bottom || rowRect.top < containerRect.top) {
                    row.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 100);
        }
    }
    
    // Initialize on load
    const tableManager = new TimelineTableManager();
    tableManager.init();
    
    // Expose for external use
    window.TimelineTableManager = tableManager;
    
    // Override renderTimelineTable if it exists
    if (typeof window.renderTimelineTable === 'function') {
        const originalRender = window.renderTimelineTable;
        window.renderTimelineTable = function() {
            // Call original render
            originalRender.apply(this, arguments);
            
            // Enhance table after render
            setTimeout(() => {
                if (!tableManager.isInitialized) {
                    tableManager.setup();
                } else {
                    tableManager.enhanceTableStructure();
                    tableManager.checkScrollPosition();
                }
            }, 50);
        };
    }
    
    // Override addTimelineRow if it exists  
    if (typeof window.addTimelineRow === 'function') {
        const originalAdd = window.addTimelineRow;
        window.addTimelineRow = function() {
            // Call original add
            originalAdd.apply(this, arguments);
            
            // Scroll to new row
            setTimeout(() => {
                const rows = document.querySelectorAll('#timelineTable tbody tr');
                const newRow = rows[rows.length - 1];
                tableManager.scrollToNewRow(newRow);
            }, 100);
        };
    }
})();