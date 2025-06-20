/**
 * AI Strategy Display Component
 * Renders comprehensive AI-generated strategies with phases, risk assessment, and market analysis
 */

class AIStrategyDisplay {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error(`[AIStrategyDisplay] Container not found: ${containerId}`);
            return;
        }
        
        this.currentStrategy = null;
        this.expandedSections = new Set(['overview']); // Default expanded sections
        
        this.init();
    }

    init() {
        // Create the display structure
        this.container.innerHTML = `
            <div class="ai-strategy-display">
                <div class="strategy-header">
                    <h3>AI-Generated Investment Strategy</h3>
                    <div class="strategy-actions">
                        <button class="btn btn-sm btn-outline" onclick="aiStrategyDisplay.regenerate()">
                            <i class="fas fa-redo"></i> Regenerate
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="aiStrategyDisplay.exportStrategy()">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>
                
                <div class="strategy-content" id="strategyContent">
                    <div class="empty-state">
                        <i class="fas fa-robot fa-3x"></i>
                        <p>Enter your investment goal to generate an AI strategy</p>
                    </div>
                </div>
            </div>
        `;

        // Add styles
        this.injectStyles();
    }

    /**
     * Display a comprehensive strategy
     */
    displayStrategy(strategy, goal) {
        this.currentStrategy = strategy;
        const content = document.getElementById('strategyContent');
        
        if (!strategy || !strategy.success) {
            content.innerHTML = this.renderError(strategy?.error || 'Failed to generate strategy');
            return;
        }

        const data = strategy.data;
        
        // Render the complete strategy
        content.innerHTML = `
            ${this.renderConfidenceBar(data.confidenceScore)}
            ${this.renderBadges(data.badges)}
            ${this.renderOverview(data, goal)}
            ${this.renderPhases(data.phases)}
            ${this.renderRiskAssessment(data.riskAssessment)}
            ${this.renderMarketAnalysis(data.marketAnalysis)}
            ${this.renderFinancingRecommendations(data.financingRecommendations)}
            ${this.renderAlternativeStrategies(data.alternativeStrategies)}
            ${data.explanation ? this.renderExplanation(data.explanation) : ''}
        `;

        // Add event listeners for collapsible sections
        this.attachEventListeners();
        
        // Animate entrance
        this.animateEntrance();
    }

    /**
     * Render confidence bar
     */
    renderConfidenceBar(score) {
        if (!score) return '';
        
        const percentage = Math.round(score * 100);
        const color = score > 0.8 ? 'success' : score > 0.6 ? 'warning' : 'danger';
        
        return `
            <div class="confidence-bar">
                <div class="confidence-label">
                    <span>AI Confidence</span>
                    <span class="confidence-value">${percentage}%</span>
                </div>
                <div class="progress">
                    <div class="progress-bar bg-${color}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }

    /**
     * Render strategy badges
     */
    renderBadges(badges) {
        if (!badges || badges.length === 0) return '';
        
        return `
            <div class="strategy-badges">
                ${badges.map(badge => `
                    <span class="badge badge-${badge.color}">
                        ${badge.label}
                    </span>
                `).join('')}
            </div>
        `;
    }

    /**
     * Render strategy overview
     */
    renderOverview(data, goal) {
        const keyMetrics = [];
        
        if (data.targetMonthlyIncome) {
            keyMetrics.push({
                icon: 'fas fa-dollar-sign',
                label: 'Target Income',
                value: `$${data.targetMonthlyIncome.toLocaleString()}/mo`
            });
        }
        
        if (data.timeHorizon) {
            keyMetrics.push({
                icon: 'fas fa-clock',
                label: 'Time Horizon',
                value: `${data.timeHorizon} months`
            });
        }
        
        if (data.startingCapital) {
            keyMetrics.push({
                icon: 'fas fa-piggy-bank',
                label: 'Starting Capital',
                value: `$${data.startingCapital.toLocaleString()}`
            });
        }
        
        if (data.constraints?.totalProperties) {
            keyMetrics.push({
                icon: 'fas fa-home',
                label: 'Properties',
                value: data.constraints.totalProperties
            });
        }
        
        return `
            <div class="strategy-section ${this.expandedSections.has('overview') ? 'expanded' : ''}" data-section="overview">
                <div class="section-header" onclick="aiStrategyDisplay.toggleSection('overview')">
                    <h4><i class="fas fa-chart-line"></i> Strategy Overview</h4>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
                <div class="section-content">
                    <div class="goal-display">
                        <strong>Your Goal:</strong> ${goal}
                    </div>
                    <div class="key-metrics">
                        ${keyMetrics.map(metric => `
                            <div class="metric-card">
                                <i class="${metric.icon}"></i>
                                <div class="metric-details">
                                    <span class="metric-label">${metric.label}</span>
                                    <span class="metric-value">${metric.value}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render investment phases
     */
    renderPhases(phases) {
        if (!phases || phases.length === 0) return '';
        
        return `
            <div class="strategy-section ${this.expandedSections.has('phases') ? 'expanded' : ''}" data-section="phases">
                <div class="section-header" onclick="aiStrategyDisplay.toggleSection('phases')">
                    <h4><i class="fas fa-tasks"></i> Investment Phases</h4>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
                <div class="section-content">
                    <div class="phases-timeline">
                        ${phases.map((phase, index) => `
                            <div class="phase-card">
                                <div class="phase-number">Phase ${phase.phaseNumber || index + 1}</div>
                                <div class="phase-details">
                                    <h5>${phase.displayName || phase.focus}</h5>
                                    <div class="phase-timeline">${phase.timeline}</div>
                                    ${phase.description ? `<p>${phase.description}</p>` : ''}
                                    <div class="phase-metrics">
                                        ${phase.targetProperties ? `
                                            <span class="metric">
                                                <i class="fas fa-home"></i> ${phase.targetProperties} properties
                                            </span>
                                        ` : ''}
                                        ${phase.expectedCost ? `
                                            <span class="metric">
                                                <i class="fas fa-coins"></i> $${phase.expectedCost.toLocaleString()}
                                            </span>
                                        ` : ''}
                                        ${phase.expectedRevenue ? `
                                            <span class="metric">
                                                <i class="fas fa-chart-up"></i> $${phase.expectedRevenue.toLocaleString()}
                                            </span>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render risk assessment
     */
    renderRiskAssessment(riskAssessment) {
        if (!riskAssessment) return '';
        
        const riskColors = {
            low: 'success',
            medium: 'warning',
            high: 'danger'
        };
        
        return `
            <div class="strategy-section ${this.expandedSections.has('risk') ? 'expanded' : ''}" data-section="risk">
                <div class="section-header" onclick="aiStrategyDisplay.toggleSection('risk')">
                    <h4><i class="fas fa-shield-alt"></i> Risk Assessment</h4>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
                <div class="section-content">
                    <div class="risk-level">
                        <span class="risk-label">Overall Risk Level:</span>
                        <span class="badge badge-${riskColors[riskAssessment.level]}">
                            ${riskAssessment.level.toUpperCase()}
                        </span>
                    </div>
                    
                    ${riskAssessment.factors && riskAssessment.factors.length > 0 ? `
                        <div class="risk-factors">
                            <h5>Risk Factors:</h5>
                            <ul>
                                ${riskAssessment.factors.map(factor => `<li>${factor}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${riskAssessment.mitigation && riskAssessment.mitigation.length > 0 ? `
                        <div class="risk-mitigation">
                            <h5>Mitigation Strategies:</h5>
                            <ul>
                                ${riskAssessment.mitigation.map(strategy => `<li>${strategy}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render market analysis
     */
    renderMarketAnalysis(marketAnalysis) {
        if (!marketAnalysis) return '';
        
        return `
            <div class="strategy-section ${this.expandedSections.has('market') ? 'expanded' : ''}" data-section="market">
                <div class="section-header" onclick="aiStrategyDisplay.toggleSection('market')">
                    <h4><i class="fas fa-chart-bar"></i> Market Analysis</h4>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
                <div class="section-content">
                    <div class="market-overview">
                        <div class="market-metric">
                            <span class="label">Target Market:</span>
                            <span class="value">${marketAnalysis.targetMarket}</span>
                        </div>
                        <div class="market-metric">
                            <span class="label">Market Conditions:</span>
                            <span class="value">${marketAnalysis.currentConditions} market</span>
                        </div>
                        ${marketAnalysis.priceRange ? `
                            <div class="market-metric">
                                <span class="label">Price Range:</span>
                                <span class="value">$${marketAnalysis.priceRange.min.toLocaleString()} - $${marketAnalysis.priceRange.max.toLocaleString()}</span>
                            </div>
                        ` : ''}
                        ${marketAnalysis.expectedAppreciation !== undefined ? `
                            <div class="market-metric">
                                <span class="label">Expected Appreciation:</span>
                                <span class="value">${marketAnalysis.expectedAppreciation}% annually</span>
                            </div>
                        ` : ''}
                        <div class="market-metric">
                            <span class="label">Rental Demand:</span>
                            <span class="value">${marketAnalysis.rentalDemand}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render financing recommendations
     */
    renderFinancingRecommendations(financing) {
        if (!financing) return '';
        
        return `
            <div class="strategy-section ${this.expandedSections.has('financing') ? 'expanded' : ''}" data-section="financing">
                <div class="section-header" onclick="aiStrategyDisplay.toggleSection('financing')">
                    <h4><i class="fas fa-university"></i> Financing Recommendations</h4>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
                <div class="section-content">
                    <div class="financing-primary">
                        <h5>Recommended Financing:</h5>
                        <div class="financing-method">${this.formatFinancingMethod(financing.primaryMethod)}</div>
                    </div>
                    
                    ${financing.estimatedRates ? `
                        <div class="financing-rates">
                            <span>Estimated Interest Rates: ${financing.estimatedRates.min}% - ${financing.estimatedRates.max}%</span>
                        </div>
                    ` : ''}
                    
                    ${financing.alternativeMethods && financing.alternativeMethods.length > 0 ? `
                        <div class="financing-alternatives">
                            <h5>Alternative Options:</h5>
                            <ul>
                                ${financing.alternativeMethods.map(method => 
                                    `<li>${this.formatFinancingMethod(method)}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render alternative strategies
     */
    renderAlternativeStrategies(alternatives) {
        if (!alternatives || alternatives.length === 0) return '';
        
        return `
            <div class="strategy-section ${this.expandedSections.has('alternatives') ? 'expanded' : ''}" data-section="alternatives">
                <div class="section-header" onclick="aiStrategyDisplay.toggleSection('alternatives')">
                    <h4><i class="fas fa-lightbulb"></i> Alternative Strategies</h4>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
                <div class="section-content">
                    ${alternatives.map(alt => `
                        <div class="alternative-strategy">
                            <h5>${alt.name}</h5>
                            <p>${alt.description}</p>
                            <div class="pros-cons">
                                <div class="pros">
                                    <h6>Pros:</h6>
                                    <ul>
                                        ${alt.pros.map(pro => `<li>${pro}</li>`).join('')}
                                    </ul>
                                </div>
                                <div class="cons">
                                    <h6>Cons:</h6>
                                    <ul>
                                        ${alt.cons.map(con => `<li>${con}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render AI explanation
     */
    renderExplanation(explanation) {
        return `
            <div class="strategy-section ${this.expandedSections.has('explanation') ? 'expanded' : ''}" data-section="explanation">
                <div class="section-header" onclick="aiStrategyDisplay.toggleSection('explanation')">
                    <h4><i class="fas fa-info-circle"></i> AI Explanation</h4>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
                <div class="section-content">
                    <div class="explanation-text">${explanation}</div>
                </div>
            </div>
        `;
    }

    /**
     * Render error state
     */
    renderError(error) {
        return `
            <div class="strategy-error">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${error}</p>
                <button class="btn btn-primary" onclick="aiStrategyDisplay.retry()">
                    Try Again
                </button>
            </div>
        `;
    }

    /**
     * Format financing method name
     */
    formatFinancingMethod(method) {
        const methods = {
            'cash': 'Cash Purchase',
            'conventional': 'Conventional Loan',
            'hard-money': 'Hard Money Loan',
            'private': 'Private Lender',
            'seller-financing': 'Seller Financing'
        };
        return methods[method] || method;
    }

    /**
     * Toggle section expansion
     */
    toggleSection(sectionId) {
        if (this.expandedSections.has(sectionId)) {
            this.expandedSections.delete(sectionId);
        } else {
            this.expandedSections.add(sectionId);
        }
        
        const section = document.querySelector(`[data-section="${sectionId}"]`);
        if (section) {
            section.classList.toggle('expanded');
        }
    }

    /**
     * Regenerate strategy
     */
    async regenerate() {
        const goalInput = document.getElementById('goalInput');
        if (goalInput && goalInput.value) {
            // Trigger strategy generation
            const event = new CustomEvent('regenerateStrategy', { 
                detail: { goal: goalInput.value }
            });
            document.dispatchEvent(event);
        }
    }

    /**
     * Export strategy
     */
    exportStrategy() {
        if (!this.currentStrategy || !this.currentStrategy.data) {
            alert('No strategy to export');
            return;
        }

        const data = this.currentStrategy.data;
        const exportData = {
            generatedAt: new Date().toISOString(),
            strategy: data
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `investment-strategy-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Retry failed generation
     */
    retry() {
        this.regenerate();
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Already attached inline
    }

    /**
     * Animate entrance
     */
    animateEntrance() {
        const sections = document.querySelectorAll('.strategy-section');
        sections.forEach((section, index) => {
            setTimeout(() => {
                section.classList.add('animated');
            }, index * 100);
        });
    }

    /**
     * Inject component styles
     */
    injectStyles() {
        if (document.getElementById('ai-strategy-display-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'ai-strategy-display-styles';
        styles.textContent = `
            .ai-strategy-display {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin-top: 20px;
            }
            
            .strategy-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .strategy-header h3 {
                margin: 0;
                color: #333;
            }
            
            .strategy-actions {
                display: flex;
                gap: 10px;
            }
            
            .confidence-bar {
                margin-bottom: 20px;
            }
            
            .confidence-label {
                display: flex;
                justify-content: space-between;
                margin-bottom: 5px;
                font-size: 14px;
            }
            
            .confidence-value {
                font-weight: bold;
            }
            
            .progress {
                height: 8px;
                background: #e9ecef;
                border-radius: 4px;
                overflow: hidden;
            }
            
            .progress-bar {
                height: 100%;
                transition: width 0.3s ease;
            }
            
            .strategy-badges {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-bottom: 20px;
            }
            
            .badge {
                padding: 4px 12px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .badge-blue { background: #e3f2fd; color: #1976d2; }
            .badge-green { background: #e8f5e9; color: #388e3c; }
            .badge-yellow { background: #fff3e0; color: #f57c00; }
            .badge-red { background: #ffebee; color: #d32f2f; }
            .badge-purple { background: #f3e5f5; color: #7b1fa2; }
            .badge-gray { background: #f5f5f5; color: #616161; }
            
            .strategy-section {
                background: white;
                border-radius: 8px;
                margin-bottom: 15px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                overflow: hidden;
                transition: all 0.3s ease;
            }
            
            .strategy-section.animated {
                animation: slideIn 0.3s ease;
            }
            
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            .section-header {
                padding: 15px 20px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: #f8f9fa;
                transition: background 0.2s ease;
            }
            
            .section-header:hover {
                background: #e9ecef;
            }
            
            .section-header h4 {
                margin: 0;
                font-size: 16px;
                color: #333;
            }
            
            .section-header i {
                margin-right: 8px;
            }
            
            .toggle-icon {
                transition: transform 0.3s ease;
            }
            
            .strategy-section.expanded .toggle-icon {
                transform: rotate(180deg);
            }
            
            .section-content {
                max-height: 0;
                overflow: hidden;
                transition: max-height 0.3s ease;
            }
            
            .strategy-section.expanded .section-content {
                max-height: 2000px;
                padding: 20px;
            }
            
            .goal-display {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 20px;
                font-size: 14px;
            }
            
            .key-metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
            }
            
            .metric-card {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 6px;
            }
            
            .metric-card i {
                font-size: 24px;
                color: #6c757d;
            }
            
            .metric-details {
                display: flex;
                flex-direction: column;
            }
            
            .metric-label {
                font-size: 12px;
                color: #6c757d;
            }
            
            .metric-value {
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            
            .phases-timeline {
                position: relative;
            }
            
            .phase-card {
                display: flex;
                gap: 20px;
                margin-bottom: 20px;
                padding-bottom: 20px;
                border-bottom: 1px solid #e9ecef;
            }
            
            .phase-card:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }
            
            .phase-number {
                background: #007bff;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-weight: bold;
                font-size: 14px;
                height: fit-content;
            }
            
            .phase-details h5 {
                margin: 0 0 5px 0;
                color: #333;
            }
            
            .phase-timeline {
                font-size: 14px;
                color: #6c757d;
                margin-bottom: 10px;
            }
            
            .phase-metrics {
                display: flex;
                gap: 15px;
                margin-top: 10px;
            }
            
            .phase-metrics .metric {
                font-size: 14px;
                color: #6c757d;
            }
            
            .phase-metrics .metric i {
                margin-right: 5px;
            }
            
            .risk-level {
                display: flex;
                align-items: center;
                gap: 10px;
                margin-bottom: 20px;
                font-size: 16px;
            }
            
            .risk-factors, .risk-mitigation {
                margin-top: 20px;
            }
            
            .risk-factors h5, .risk-mitigation h5 {
                margin-bottom: 10px;
                color: #333;
            }
            
            .risk-factors ul, .risk-mitigation ul {
                margin: 0;
                padding-left: 20px;
            }
            
            .market-overview {
                display: grid;
                gap: 15px;
            }
            
            .market-metric {
                display: flex;
                justify-content: space-between;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 6px;
            }
            
            .market-metric .label {
                color: #6c757d;
            }
            
            .market-metric .value {
                font-weight: 500;
                color: #333;
            }
            
            .financing-method {
                font-size: 18px;
                font-weight: 500;
                color: #007bff;
                margin-bottom: 10px;
            }
            
            .financing-rates {
                background: #e3f2fd;
                padding: 10px 15px;
                border-radius: 6px;
                margin: 15px 0;
            }
            
            .pros-cons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-top: 15px;
            }
            
            .pros h6, .cons h6 {
                color: #333;
                margin-bottom: 10px;
            }
            
            .pros ul, .cons ul {
                margin: 0;
                padding-left: 20px;
                font-size: 14px;
            }
            
            .explanation-text {
                line-height: 1.6;
                color: #555;
            }
            
            .empty-state {
                text-align: center;
                padding: 60px 20px;
                color: #6c757d;
            }
            
            .empty-state i {
                margin-bottom: 20px;
                opacity: 0.3;
            }
            
            .strategy-error {
                text-align: center;
                padding: 40px 20px;
                color: #dc3545;
            }
            
            .strategy-error i {
                font-size: 48px;
                margin-bottom: 20px;
            }
            
            .strategy-error p {
                margin-bottom: 20px;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Create global instance
window.aiStrategyDisplay = new AIStrategyDisplay('aiStrategyContainer');