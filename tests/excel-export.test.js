// Unit tests for Excel Export functionality
const fs = require('fs');
const path = require('path');

// Mock DOM environment
global.document = {
    createElement: (tag) => ({
        setAttribute: jest.fn(),
        style: {},
        click: jest.fn()
    }),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    }
};

global.window = {
    ExcelExporter: undefined,
    URL: {
        createObjectURL: jest.fn((blob) => {
            // Accept our mock blob
            if (blob && (blob instanceof MockBlob || blob.constructor.name === 'Blob')) {
                return 'blob:mock-url';
            }
            return 'blob:mock-url';
        })
    }
};

// Create a more realistic Blob mock
class MockBlob {
    constructor(content, options) {
        this.content = content;
        this.options = options;
    }
}
global.Blob = MockBlob;
global.URL = window.URL;

// Load the Excel export module
const excelExportCode = fs.readFileSync(
    path.join(__dirname, '../js/excel-export.js'), 
    'utf8'
);
eval(excelExportCode);

const ExcelExporter = window.ExcelExporter;

describe('ExcelExporter', () => {
    let exporter;
    let mockSimulation;
    let mockPhases;
    let mockStateManager;

    beforeEach(() => {
        exporter = new ExcelExporter();
        
        mockSimulation = {
            id: 1,
            name: 'Test Simulation',
            created_at: new Date().toISOString(),
            target_monthly_income: 5000,
            initial_capital: 100000,
            time_horizon_months: 60,
            strategy_type: 'balanced'
        };

        mockPhases = [
            {
                month_number: 0,
                action_type: 'buy',
                property_address: '123 Test St',
                purchase_price: 200000,
                monthly_rental_income: 2000,
                down_payment_percent: 20,
                notes: ''
            },
            {
                month_number: 6,
                action_type: 'buy',
                property_address: '456 Demo Ave',
                purchase_price: 250000,
                monthly_rental_income: 2500,
                down_payment_percent: 25,
                notes: ''
            }
        ];

        mockStateManager = {
            getMonthState: jest.fn((month) => ({
                cashReserves: 50000 + (month * 1000),
                monthlyIncome: 2000 + (month > 6 ? 2500 : 0),
                mortgagePayments: 1000 + (month > 6 ? 1200 : 0),
                summary: {
                    totalProperties: month > 6 ? 2 : 1,
                    monthlyIncome: 2000 + (month > 6 ? 2500 : 0)
                },
                totalEquity: 40000 + (month * 500),
                totalDebt: 160000 + (month > 6 ? 187500 : 0)
            })),
            getCurrentState: jest.fn(() => ({
                properties: {
                    'prop1': {
                        address: '123 Test St',
                        purchaseDate: '2024-01-01',
                        purchasePrice: 200000,
                        currentValue: 210000,
                        monthlyRent: 2000,
                        mortgageBalance: 160000
                    },
                    'prop2': {
                        address: '456 Demo Ave',
                        purchaseDate: '2024-06-01',
                        purchasePrice: 250000,
                        currentValue: 255000,
                        monthlyRent: 2500,
                        mortgageBalance: 187500
                    }
                },
                totalEquity: 117500,
                summary: {
                    monthlyIncome: 4500
                }
            }))
        };
    });

    describe('Constructor', () => {
        test('should initialize with default worksheet name', () => {
            expect(exporter.worksheetName).toBe('Portfolio Analysis');
        });
    });

    describe('createSummarySheet', () => {
        test('should create summary sheet with simulation data', () => {
            const sheet = exporter.createSummarySheet(mockSimulation);
            
            expect(sheet).toBeInstanceOf(Array);
            expect(sheet[0][0]).toBe('Portfolio Simulation Summary');
            expect(sheet[2]).toEqual(['Simulation Name', 'Test Simulation']);
            expect(sheet[4]).toEqual(['Target Monthly Income', '$5000']);
            expect(sheet[5]).toEqual(['Initial Capital', '$100000']);
        });

        test('should include key formulas in summary', () => {
            const sheet = exporter.createSummarySheet(mockSimulation);
            
            const formulaRows = sheet.slice(9);
            expect(formulaRows).toContainEqual(['Total ROI', '=((Total_Equity-Initial_Capital)/Initial_Capital)*100']);
            expect(formulaRows).toContainEqual(['Cash-on-Cash Return', '=(Annual_Cash_Flow/Total_Cash_Invested)*100']);
            expect(formulaRows).toContainEqual(['Cap Rate', '=(Net_Operating_Income/Total_Property_Value)*100']);
        });
    });

    describe('createTimelineSheet', () => {
        test('should create timeline sheet with headers', () => {
            const sheet = exporter.createTimelineSheet(mockPhases, mockStateManager);
            
            const headers = sheet[0];
            expect(headers).toContain('Month');
            expect(headers).toContain('Action Type');
            expect(headers).toContain('Purchase Price');
            expect(headers).toContain('Monthly Payment');
            expect(headers).toContain('ROI %');
        });

        test('should include initial state row', () => {
            const sheet = exporter.createTimelineSheet(mockPhases, mockStateManager);
            
            const initialRow = sheet[1];
            expect(initialRow[0]).toBe(0); // Month
            expect(initialRow[2]).toBe('Initial'); // Action Type
            expect(initialRow[15]).toBe(50000); // Cash reserves from mock
        });

        test('should process phases with formulas', () => {
            const sheet = exporter.createTimelineSheet(mockPhases, mockStateManager);
            
            // First property row (row 3 in Excel, index 2 in array)
            const firstPropertyRow = sheet[2];
            expect(firstPropertyRow[0]).toBe(0); // Month
            expect(firstPropertyRow[2]).toBe('buy'); // Action type
            expect(firstPropertyRow[3]).toBe('123 Test St'); // Address
            expect(firstPropertyRow[4]).toBe(200000); // Purchase price
            expect(firstPropertyRow[6]).toBe('=E3*F3/100'); // Down payment formula
            expect(firstPropertyRow[7]).toBe('=E3-G3'); // Loan amount formula
        });

        test('should include PMT formula for monthly payment', () => {
            const sheet = exporter.createTimelineSheet(mockPhases, mockStateManager);
            
            const propertyRow = sheet[2];
            expect(propertyRow[10]).toBe('=IF(H3>0,PMT(I3/100/12,J3*12,-H3),0)');
        });

        test('should calculate cumulative cash flow', () => {
            const sheet = exporter.createTimelineSheet(mockPhases, mockStateManager);
            
            const propertyRow = sheet[2];
            expect(propertyRow[13]).toBe('=L3-M3-K3'); // Net cash flow
            expect(propertyRow[14]).toBe('=N3+O2'); // Cumulative cash flow
        });

        test('should add totals row with SUM formulas', () => {
            const sheet = exporter.createTimelineSheet(mockPhases, mockStateManager);
            
            const totalsRow = sheet[sheet.length - 1];
            expect(totalsRow[0]).toBe('TOTALS');
            expect(totalsRow[4]).toMatch(/=SUM\(E2:E\d+\)/); // Total invested
            expect(totalsRow[6]).toMatch(/=SUM\(G2:G\d+\)/); // Total down payments
            expect(totalsRow[11]).toMatch(/=SUM\(L2:L\d+\)/); // Total monthly rent
        });
    });

    describe('createPropertiesSheet', () => {
        test('should create properties sheet with all properties', () => {
            const sheet = exporter.createPropertiesSheet(mockStateManager);
            
            expect(sheet[0]).toContain('Address');
            expect(sheet[0]).toContain('Purchase Price');
            expect(sheet[0]).toContain('Current Value');
            expect(sheet[0]).toContain('Cap Rate');
            
            // Should have 2 properties plus header
            expect(sheet.length).toBe(3);
        });

        test('should calculate property metrics with formulas', () => {
            const sheet = exporter.createPropertiesSheet(mockStateManager);
            
            const firstProperty = sheet[1];
            expect(firstProperty[1]).toBe('123 Test St');
            expect(firstProperty[3]).toBe(200000); // Purchase price
            expect(firstProperty[5]).toBe('=(E2-D2)/D2*100'); // Appreciation formula
            expect(firstProperty[7]).toBe('=G2*12'); // Annual rent formula
            expect(firstProperty[9]).toBe('=H2-I2'); // NOI formula
        });
    });

    describe('createCashFlowSheet', () => {
        test('should create cash flow projections', () => {
            const sheet = exporter.createCashFlowSheet(mockStateManager);
            
            const headers = sheet[0];
            expect(headers).toContain('Month');
            expect(headers).toContain('Rental Income');
            expect(headers).toContain('Net Cash Flow');
            expect(headers).toContain('Cumulative Cash Flow');
        });

        test('should calculate expenses as percentage of rent', () => {
            const sheet = exporter.createCashFlowSheet(mockStateManager);
            
            const monthRow = sheet[1]; // First month
            expect(monthRow[5]).toBe('=B2*0.01'); // Property taxes
            expect(monthRow[6]).toBe('=B2*0.005'); // Insurance
            expect(monthRow[7]).toBe('=B2*0.05'); // Maintenance
            expect(monthRow[8]).toBe('=B2*0.08'); // Property management
        });
    });

    describe('createROISheet', () => {
        test('should create ROI analysis sheet', () => {
            const sheet = exporter.createROISheet(mockSimulation, mockStateManager);
            
            expect(sheet[0][0]).toBe('ROI Analysis');
            expect(sheet[2]).toEqual(['Initial Investment', 100000]);
            expect(sheet[3]).toEqual(['Current Portfolio Value', 117500]);
            expect(sheet[4]).toEqual(['Total Return', '=B4-B3']);
            expect(sheet[5]).toEqual(['ROI %', '=B5/B3*100']);
        });

        test('should include annualized returns calculation', () => {
            const sheet = exporter.createROISheet(mockSimulation, mockStateManager);
            
            const annualizedSection = sheet.slice(7, 10);
            expect(annualizedSection[1][0]).toBe('Years Invested');
            expect(annualizedSection[1][1]).toBe('=60/12'); // 60 months / 12
            expect(annualizedSection[2][0]).toBe('Annualized ROI');
            expect(annualizedSection[2][1]).toBe('=POWER((B4/B3), 1/B9)-1');
        });
    });

    describe('convertToCSV', () => {
        test('should convert array to CSV format', () => {
            const data = [
                ['Name', 'Value', 'Formula'],
                ['Test', 100, '=A2*2'],
                ['Demo, Inc', 200, '=B3+100']
            ];
            
            const csv = exporter.convertToCSV(data);
            
            expect(csv).toContain('Name,Value,Formula');
            expect(csv).toContain('Test,100,"=A2*2"'); // Formula quoted
            expect(csv).toContain('"Demo, Inc",200,"=B3+100"'); // String with comma quoted
        });

        test('should preserve Excel formulas', () => {
            const data = [['=SUM(A1:A10)', '=IF(B1>0,B1*2,0)', '=PMT(0.04/12,360,-200000)']];
            const csv = exporter.convertToCSV(data);
            
            expect(csv).toContain('"=SUM(A1:A10)"');
            expect(csv).toContain('"=IF(B1>0,B1*2,0)"');
            expect(csv).toContain('"=PMT(0.04/12,360,-200000)"');
        });
    });

    describe('extractPhaseData', () => {
        test('should extract basic phase data', () => {
            const phase = {
                property_address: '789 Test Blvd',
                purchase_price: 300000,
                down_payment_percent: 30,
                monthly_rental_income: 3000
            };
            
            const data = exporter.extractPhaseData(phase, {});
            
            expect(data.address).toBe('789 Test Blvd');
            expect(data.purchasePrice).toBe(300000);
            expect(data.downPaymentPercent).toBe(30);
            expect(data.monthlyRent).toBe(3000);
        });

        test('should parse JSON notes for additional data', () => {
            const phase = {
                property_address: '789 Test Blvd',
                purchase_price: 300000,
                notes: JSON.stringify({
                    interestRate: 3.5,
                    loanTerm: 15,
                    customField: 'test'
                })
            };
            
            const data = exporter.extractPhaseData(phase, {});
            
            expect(data.interestRate).toBe(3.5);
            expect(data.loanTerm).toBe(15);
        });

        test('should handle non-JSON notes gracefully', () => {
            const phase = {
                property_address: '789 Test Blvd',
                notes: 'Regular text note'
            };
            
            const data = exporter.extractPhaseData(phase, {});
            
            expect(data.interestRate).toBe(4.5); // Default
            expect(data.loanTerm).toBe(30); // Default
        });
    });

    describe('calculateMonthlyMortgage', () => {
        test('should return formula for mortgage calculation', () => {
            const property = {
                mortgageBalance: 200000,
                interestRate: 4.5,
                loanTerm: 30
            };
            
            const formula = exporter.calculateMonthlyMortgage(property);
            
            expect(formula).toContain('200000');
            expect(formula).toContain('0.00375'); // 4.5% / 12
            expect(formula).toContain('360'); // 30 * 12
        });

        test('should return 0 for no mortgage', () => {
            const property = { mortgageBalance: 0 };
            const result = exporter.calculateMonthlyMortgage(property);
            expect(result).toBe(0);
        });
    });

    describe('exportToExcel', () => {
        test('should trigger file download', () => {
            const mockLink = {
                setAttribute: jest.fn(),
                click: jest.fn(),
                style: {}
            };
            
            document.createElement = jest.fn(() => mockLink);
            document.body.appendChild = jest.fn();
            document.body.removeChild = jest.fn();
            
            const result = exporter.exportToExcel(mockSimulation, mockPhases, mockStateManager);
            
            expect(result).toBe(true);
            expect(mockLink.setAttribute).toHaveBeenCalledWith('download', expect.stringContaining('portfolio_Test Simulation_'));
            expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url');
            expect(mockLink.click).toHaveBeenCalled();
        });

        test('should create CSV file with correct filename format', () => {
            const mockLink = {
                setAttribute: jest.fn(),
                click: jest.fn(),
                style: {}
            };
            
            document.createElement = jest.fn(() => mockLink);
            
            exporter.exportToExcel(mockSimulation, mockPhases, mockStateManager);
            
            const downloadCall = mockLink.setAttribute.mock.calls.find(call => call[0] === 'download');
            expect(downloadCall[1]).toMatch(/portfolio_Test Simulation_\d{4}-\d{2}-\d{2}\.csv/);
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty phases array', () => {
            const sheet = exporter.createTimelineSheet([], mockStateManager);
            expect(sheet.length).toBeGreaterThan(2); // Headers, initial, totals
            expect(sheet[0][0]).toBe('Month'); // Headers present
        });

        test('should handle missing state manager data', () => {
            mockStateManager.getMonthState = jest.fn(() => null);
            mockStateManager.getCurrentState = jest.fn(() => null);
            
            const sheet = exporter.createTimelineSheet(mockPhases, mockStateManager);
            expect(sheet).toBeDefined();
            expect(sheet.length).toBeGreaterThan(0);
        });

        test('should handle special characters in property names', () => {
            const phase = {
                property_address: '123 "Test" & O\'Brien, Suite #5',
                purchase_price: 200000
            };
            
            const data = exporter.extractPhaseData(phase, {});
            expect(data.address).toBe('123 "Test" & O\'Brien, Suite #5');
        });
    });
});