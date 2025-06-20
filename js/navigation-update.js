/**
 * Navigation Update Script
 * Updates all navigation bars to include all pages consistently
 */

// Standard navigation items for all pages
const navigationItems = [
    { href: 'index.html', text: 'Home' },
    { href: 'affordable-housing.html', text: 'Properties' },
    { href: 'property-finder.html', text: 'Deal Finder' },
    {
        text: 'Simulators',
        dropdown: true,
        items: [
            { href: 'portfolio-simulator.html', text: 'Simulator V1' },
            { href: 'portfolio-simulator-v2.html', text: 'Simulator V2' },
            { href: 'portfolio-simulator-v3.html', text: 'Simulator V3' },
            { href: 'portfolio-simulator-v4-ai.html', text: 'AI Simulator V4', badge: 'NEW' }
        ]
    },
    { href: 'market-analysis.html', text: 'Market Analysis' },
    { href: '#contact', text: 'Contact' }
];

// Function to update standard navigation (nav-menu style)
function updateStandardNavigation() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    
    // Clear existing items
    navMenu.innerHTML = '';
    
    navigationItems.forEach(item => {
        if (item.dropdown) {
            // Create dropdown menu
            const li = document.createElement('li');
            li.innerHTML = `
                <a href="#" class="nav-link dropdown-toggle">${item.text}</a>
                <ul class="dropdown-menu">
                    ${item.items.map(subItem => `
                        <li><a href="${subItem.href}">${subItem.text}${subItem.badge ? ` <span class="badge">${subItem.badge}</span>` : ''}</a></li>
                    `).join('')}
                </ul>
            `;
            navMenu.appendChild(li);
        } else {
            // Create regular menu item
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = item.href;
            a.className = 'nav-link';
            a.textContent = item.text;
            li.appendChild(a);
            navMenu.appendChild(li);
        }
    });
}

// Function to update header navigation (simulator style)
function updateHeaderNavigation() {
    const headerNav = document.querySelector('.header-nav');
    if (!headerNav) return;
    
    headerNav.innerHTML = `
        <a href="index.html">Home</a>
        <a href="affordable-housing.html">Properties</a>
        <a href="property-finder.html">Deal Finder</a>
        <div class="dropdown">
            <a href="#" class="dropdown-toggle">Simulators</a>
            <div class="dropdown-content">
                <a href="portfolio-simulator.html">Simulator V1</a>
                <a href="portfolio-simulator-v2.html">Simulator V2</a>
                <a href="portfolio-simulator-v3.html">Simulator V3</a>
                <a href="portfolio-simulator-v4-ai.html">AI Simulator V4 <span class="new-badge">NEW</span></a>
            </div>
        </div>
        <a href="market-analysis.html">Market Analysis</a>
    `;
}

// Function to update Bootstrap navigation (V4 style)
function updateBootstrapNavigation() {
    const navbarNav = document.querySelector('#navbarNav .navbar-nav');
    if (!navbarNav) return;
    
    navbarNav.innerHTML = `
        <li class="nav-item">
            <a class="nav-link" href="index.html">Home</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="affordable-housing.html">Properties</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="property-finder.html">Deal Finder</a>
        </li>
        <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="simulatorDropdown" role="button" data-bs-toggle="dropdown">
                Simulators
            </a>
            <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="portfolio-simulator.html">Simulator V1</a></li>
                <li><a class="dropdown-item" href="portfolio-simulator-v2.html">Simulator V2</a></li>
                <li><a class="dropdown-item" href="portfolio-simulator-v3.html">Simulator V3</a></li>
                <li><hr class="dropdown-divider"></li>
                <li><a class="dropdown-item" href="portfolio-simulator-v4-ai.html">
                    AI Simulator V4 <span class="badge bg-danger ms-2">NEW</span>
                </a></li>
            </ul>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="market-analysis.html">Market Analysis</a>
        </li>
        <li class="nav-item">
            <a class="nav-link" href="#contact">Contact</a>
        </li>
    `;
}

// Auto-detect and update navigation on page load
document.addEventListener('DOMContentLoaded', function() {
    // Try all navigation update methods
    updateStandardNavigation();
    updateHeaderNavigation();
    updateBootstrapNavigation();
    
    // Add CSS for new badges if not already present
    if (!document.querySelector('#nav-update-styles')) {
        const styles = document.createElement('style');
        styles.id = 'nav-update-styles';
        styles.textContent = `
            .badge, .new-badge {
                background: #ff4444;
                color: white;
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 3px;
                margin-left: 5px;
                vertical-align: super;
            }
            .dropdown {
                position: relative;
                display: inline-block;
            }
            .dropdown-content {
                display: none;
                position: absolute;
                background-color: #f9f9f9;
                min-width: 200px;
                box-shadow: 0 8px 16px rgba(0,0,0,0.2);
                z-index: 1000;
            }
            .dropdown:hover .dropdown-content {
                display: block;
            }
            .dropdown-content a {
                display: block;
                padding: 12px 16px;
                text-decoration: none;
                color: #333;
            }
            .dropdown-content a:hover {
                background-color: #f1f1f1;
            }
        `;
        document.head.appendChild(styles);
    }
});