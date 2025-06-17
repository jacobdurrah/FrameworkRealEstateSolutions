// Excel Export Module for Portfolio Simulator
// Generates Excel/CSV files with formulas for real estate investment analysis

class ExcelExporter {
    constructor() {
        this.worksheetName = 'Portfolio Analysis';
    }

    // Export simulation to Excel format with formulas
    exportToExcel(simulation, phases, stateManager) {
        // Create workbook structure
        const workbook = {
            sheets: {
                'Summary': this.createSummarySheet(simulation),
                'Timeline': this.createTimelineSheet(phases, stateManager),
                'Properties': this.createPropertiesSheet(stateManager),
                'Cash Flow': this.createCashFlowSheet(stateManager),
                'ROI Analysis': this.createROISheet(simulation, stateManager)
            }
        };

        // Convert to CSV with formula preservation
        const csvContent = this.convertToCSV(workbook.sheets['Timeline']);
        
        // Download the file
        this.downloadFile(csvContent, `portfolio_${simulation.name}_${new Date().toISOString().split('T')[0]}.csv`);
        
        return true;
    }

    // Create summary sheet with key metrics
    createSummarySheet(simulation) {
        const rows = [
            ['Portfolio Simulation Summary'],
            [''],
            ['Simulation Name', simulation.name],
            ['Created Date', new Date(simulation.created_at).toLocaleDateString()],
            ['Target Monthly Income', `$${simulation.target_monthly_income}`],
            ['Initial Capital', `$${simulation.initial_capital}`],
            ['Time Horizon', `${simulation.time_horizon_months} months`],
            ['Strategy Type', simulation.strategy_type],
            [''],
            ['Key Formulas:'],
            ['Total ROI', '=((Total_Equity-Initial_Capital)/Initial_Capital)*100'],
            ['Cash-on-Cash Return', '=(Annual_Cash_Flow/Total_Cash_Invested)*100'],
            ['Cap Rate', '=(Net_Operating_Income/Total_Property_Value)*100']
        ];
        
        return rows;
    }

    // Create timeline sheet with all transactions and formulas
    createTimelineSheet(phases, stateManager) {
        const headers = [
            'Month',
            'Date',
            'Action Type',
            'Property Address',
            'Purchase Price',
            'Down Payment %',
            'Down Payment $',
            'Loan Amount',
            'Interest Rate',
            'Loan Term',
            'Monthly Payment',
            'Monthly Rent',
            'Operating Expenses',
            'Net Cash Flow',
            'Cumulative Cash Flow',
            'Cash Reserves',
            'Total Properties',
            'Total Equity',
            'Total Debt',
            'ROI %',
            'Notes'
        ];

        const rows = [headers];
        let rowNum = 2; // Excel row numbering starts at 1, headers at row 1

        // Add initial state
        const initialState = stateManager.getMonthState(0);
        rows.push([
            0,
            new Date().toLocaleDateString(),
            'Initial',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            0,
            0,
            initialState?.cashReserves || 0,
            0,
            0,
            0,
            0,
            'Starting position'
        ]);
        rowNum++;

        // Process each phase
        phases.sort((a, b) => a.month_number - b.month_number).forEach(phase => {
            const monthState = stateManager.getMonthState(phase.month_number);
            const monthData = this.extractPhaseData(phase, monthState);
            
            // Build row with formulas
            const row = [
                phase.month_number,
                `=DATE(${new Date().getFullYear()},${new Date().getMonth() + 1 + phase.month_number},1)`,
                phase.action_type,
                monthData.address || '',
                monthData.purchasePrice || '',
                monthData.downPaymentPercent || '',
                phase.action_type === 'buy' ? `=E${rowNum}*F${rowNum}/100` : '', // Down payment calculation
                phase.action_type === 'buy' ? `=E${rowNum}-G${rowNum}` : '', // Loan amount
                monthData.interestRate || '',
                monthData.loanTerm || '',
                phase.action_type === 'buy' ? `=IF(H${rowNum}>0,PMT(I${rowNum}/100/12,J${rowNum}*12,-H${rowNum}),0)` : '', // Monthly payment
                monthData.monthlyRent || '',
                monthData.operatingExpenses || `=L${rowNum}*0.35`, // 35% operating expense ratio
                `=L${rowNum}-M${rowNum}-K${rowNum}`, // Net cash flow
                `=N${rowNum}+O${rowNum-1}`, // Cumulative cash flow
                monthState?.cashReserves || '',
                monthState?.summary?.totalProperties || '',
                monthState?.totalEquity || '',
                monthState?.totalDebt || '',
                `=IF(E2>0,(R${rowNum}-E2)/E2*100,0)`, // ROI calculation
                phase.notes || ''
            ];
            
            rows.push(row);
            rowNum++;
        });

        // Add summary row with totals
        const lastRow = rowNum - 1;
        rows.push([
            'TOTALS',
            '',
            '',
            '',
            `=SUM(E2:E${lastRow})`, // Total invested
            '',
            `=SUM(G2:G${lastRow})`, // Total down payments
            `=SUM(H2:H${lastRow})`, // Total loans
            '',
            '',
            `=SUM(K2:K${lastRow})`, // Total monthly payments
            `=SUM(L2:L${lastRow})`, // Total monthly rent
            `=SUM(M2:M${lastRow})`, // Total expenses
            `=SUM(N2:N${lastRow})`, // Total net cash flow
            '',
            '',
            '',
            '',
            '',
            '',
            ''
        ]);

        return rows;
    }

    // Create properties sheet with detailed property analysis
    createPropertiesSheet(stateManager) {
        const headers = [
            'Property ID',
            'Address',
            'Purchase Date',
            'Purchase Price',
            'Current Value',
            'Appreciation',
            'Monthly Rent',
            'Annual Rent',
            'Operating Expenses',
            'NOI',
            'Mortgage Balance',
            'Equity',
            'Cash Flow',
            'Cap Rate',
            'Cash-on-Cash Return'
        ];

        const rows = [headers];
        let rowNum = 2;

        const currentState = stateManager.getCurrentState();
        if (currentState && currentState.properties) {
            Object.entries(currentState.properties).forEach(([propId, property]) => {
                const row = [
                    propId,
                    property.address,
                    property.purchaseDate,
                    property.purchasePrice,
                    property.currentValue || property.purchasePrice,
                    `=(E${rowNum}-D${rowNum})/D${rowNum}*100`, // Appreciation %
                    property.monthlyRent,
                    `=G${rowNum}*12`, // Annual rent
                    `=H${rowNum}*0.35`, // Operating expenses (35% of rent)
                    `=H${rowNum}-I${rowNum}`, // NOI
                    property.mortgageBalance || 0,
                    `=E${rowNum}-K${rowNum}`, // Equity
                    `=G${rowNum}-I${rowNum}/12-${this.calculateMonthlyMortgage(property)}`, // Monthly cash flow
                    `=J${rowNum}/D${rowNum}*100`, // Cap rate
                    `=M${rowNum}*12/(D${rowNum}*0.25)*100` // Cash-on-cash return
                ];
                rows.push(row);
                rowNum++;
            });
        }

        return rows;
    }

    // Create cash flow projection sheet
    createCashFlowSheet(stateManager) {
        const headers = [
            'Month',
            'Rental Income',
            'Other Income',
            'Total Income',
            'Mortgage Payments',
            'Property Taxes',
            'Insurance',
            'Maintenance',
            'Property Management',
            'Total Expenses',
            'Net Cash Flow',
            'Cumulative Cash Flow'
        ];

        const rows = [headers];
        let rowNum = 2;

        // Generate monthly projections
        for (let month = 0; month <= 60; month++) {
            const monthState = stateManager.getMonthState(month);
            if (!monthState) continue;

            const row = [
                month,
                monthState.monthlyIncome || 0,
                0, // Other income
                `=B${rowNum}+C${rowNum}`, // Total income
                monthState.mortgagePayments || 0,
                `=B${rowNum}*0.01`, // Property taxes (1% of rent)
                `=B${rowNum}*0.005`, // Insurance (0.5% of rent)
                `=B${rowNum}*0.05`, // Maintenance (5% of rent)
                `=B${rowNum}*0.08`, // Property management (8% of rent)
                `=E${rowNum}+F${rowNum}+G${rowNum}+H${rowNum}+I${rowNum}`, // Total expenses
                `=D${rowNum}-J${rowNum}`, // Net cash flow
                month === 0 ? `=K${rowNum}` : `=K${rowNum}+L${rowNum-1}` // Cumulative
            ];
            
            rows.push(row);
            rowNum++;
        }

        return rows;
    }

    // Create ROI analysis sheet
    createROISheet(simulation, stateManager) {
        const currentState = stateManager.getCurrentState();
        const totalInvested = simulation.initial_capital;
        const currentValue = currentState?.totalEquity || 0;
        
        const rows = [
            ['ROI Analysis'],
            [''],
            ['Initial Investment', totalInvested],
            ['Current Portfolio Value', currentValue],
            ['Total Return', `=B4-B3`],
            ['ROI %', `=B5/B3*100`],
            [''],
            ['Annualized Returns'],
            ['Years Invested', `=${simulation.time_horizon_months}/12`],
            ['Annualized ROI', `=POWER((B4/B3), 1/B9)-1`],
            [''],
            ['Cash Flow Analysis'],
            ['Monthly Cash Flow', currentState?.summary?.monthlyIncome || 0],
            ['Annual Cash Flow', `=B13*12`],
            ['Cash-on-Cash Return', `=B14/B3*100`],
            [''],
            ['Break-Even Analysis'],
            ['Monthly Target Income', simulation.target_monthly_income],
            ['Current Monthly Income', currentState?.summary?.monthlyIncome || 0],
            ['Income Gap', `=B18-B19`],
            ['Months to Target', `=IF(B20>0,B20/(B19/B9),0)`]
        ];

        return rows;
    }

    // Extract phase data with proper formatting
    extractPhaseData(phase, monthState) {
        let data = {
            address: phase.property_address || '',
            purchasePrice: phase.purchase_price || 0,
            downPaymentPercent: phase.down_payment_percent || 20,
            monthlyRent: phase.monthly_rental_income || 0,
            operatingExpenses: 0,
            interestRate: 4.5, // Default
            loanTerm: 30 // Default
        };

        // Try to parse additional data from notes
        if (phase.notes) {
            try {
                const notesData = JSON.parse(phase.notes);
                data = { ...data, ...notesData };
            } catch (e) {
                // Notes might not be JSON
            }
        }

        return data;
    }

    // Calculate monthly mortgage payment for a property
    calculateMonthlyMortgage(property) {
        if (!property.mortgageBalance || property.mortgageBalance === 0) return 0;
        
        const principal = property.mortgageBalance;
        const rate = (property.interestRate || 4.5) / 100 / 12;
        const term = (property.loanTerm || 30) * 12;
        
        return `${principal}*${rate}*(1+${rate})^${term}/((1+${rate})^${term}-1)`;
    }

    // Convert sheet data to CSV format
    convertToCSV(sheetData) {
        return sheetData.map(row => 
            row.map(cell => {
                // Preserve formulas
                if (typeof cell === 'string' && cell.startsWith('=')) {
                    return `"${cell}"`;
                }
                // Quote strings with commas
                if (typeof cell === 'string' && cell.includes(',')) {
                    return `"${cell}"`;
                }
                return cell;
            }).join(',')
        ).join('\\n');
    }

    // Download file
    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Export to Google Sheets format (future enhancement)
    exportToGoogleSheets(simulation, phases, stateManager) {
        // This would integrate with Google Sheets API
        // For now, users can import the CSV into Google Sheets
        console.log('Google Sheets export will maintain all formulas from CSV import');
        return this.exportToExcel(simulation, phases, stateManager);
    }
}

// Export for use in portfolio simulator
window.ExcelExporter = ExcelExporter;