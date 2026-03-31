import React from 'react';
import Card from '../common/Card';
import '../../styles/pages/calculator.css';

const TaxBreakdown = ({ taxData }) => {
  if (!taxData) {
    return (
      <Card title="Tax Breakdown" icon="📊" padding>
        <div className="tax-breakdown-empty">
          <div className="empty-icon">🧮</div>
          <h3>No Tax Calculation</h3>
          <p>Use the tax calculator form to compute import duties and view the breakdown here.</p>
        </div>
      </Card>
    );
  }

  const {
    importDuty,
    exciseDuty,
    vat,
    idf,
    rdl,
    totalTax,
    customsValue,
    cifValue,
    calculations
  } = taxData;

  const taxComponents = [
    { label: 'Import Duty (35%)', value: importDuty, color: '#4caf50' },
    { label: 'Excise Duty', value: exciseDuty, color: '#2196f3' },
    { label: 'VAT (16%)', value: vat, color: '#ff9800' },
    { label: 'IDF (2.5%)', value: idf, color: '#9c27b0' },
    { label: 'RDL (2%)', value: rdl, color: '#f44336' }
  ];

  return (
    <Card title="Tax Breakdown" icon="📊" padding>
      <div className="tax-breakdown">
        {/* Summary Section */}
        <div className="tax-summary-section">
          <div className="summary-item total-tax">
            <span className="summary-label">Total Tax Payable</span>
            <span className="summary-value">KES {totalTax.toLocaleString()}</span>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">Customs Value</span>
              <span className="summary-value">KES {customsValue.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">CIF Value</span>
              <span className="summary-value">KES {cifValue.toLocaleString()}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Tax Ratio</span>
              <span className="summary-value">
                {((totalTax / cifValue) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="detailed-breakdown">
          <h4 className="breakdown-title">Detailed Calculation</h4>
          
          <div className="breakdown-steps">
            {calculations && calculations.map((step, index) => (
              <div key={index} className="calculation-step">
                <div className="step-number">{index + 1}</div>
                <div className="step-content">
                  <div className="step-description">{step.description}</div>
                  <div className="step-value">KES {step.value.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tax Components Chart */}
          <div className="tax-components-chart">
            <h4 className="chart-title">Tax Distribution</h4>
            <div className="chart-container">
              {taxComponents.map((component, index) => {
                const percentage = (component.value / totalTax) * 100;
                return (
                  <div key={index} className="chart-bar">
                    <div 
                      className="bar-fill"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: component.color
                      }}
                    ></div>
                    <div className="bar-label">
                      <span className="label-name">{component.label}</span>
                      <span className="label-value">KES {component.value.toLocaleString()}</span>
                      <span className="label-percentage">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tax Breakdown Table */}
          <div className="tax-breakdown-table">
            <table>
              <thead>
                <tr>
                  <th>Tax Component</th>
                  <th>Rate</th>
                  <th>Base Amount</th>
                  <th>Tax Amount</th>
                  <th>Cumulative Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Import Duty</td>
                  <td>35%</td>
                  <td>KES {customsValue.toLocaleString()}</td>
                  <td>KES {importDuty.toLocaleString()}</td>
                  <td>KES {(customsValue + importDuty).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Excise Duty</td>
                  <td>{exciseDuty / (customsValue + importDuty) * 100}%</td>
                  <td>KES {(customsValue + importDuty).toLocaleString()}</td>
                  <td>KES {exciseDuty.toLocaleString()}</td>
                  <td>KES {(customsValue + importDuty + exciseDuty).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>VAT</td>
                  <td>16%</td>
                  <td>KES {(customsValue + importDuty + exciseDuty).toLocaleString()}</td>
                  <td>KES {vat.toLocaleString()}</td>
                  <td>KES {(customsValue + importDuty + exciseDuty + vat).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Import Declaration Fee (IDF)</td>
                  <td>2.5%</td>
                  <td>KES {customsValue.toLocaleString()}</td>
                  <td>KES {idf.toLocaleString()}</td>
                  <td>KES {(customsValue + importDuty + exciseDuty + vat + idf).toLocaleString()}</td>
                </tr>
                <tr>
                  <td>Railway Development Levy (RDL)</td>
                  <td>2%</td>
                  <td>KES {customsValue.toLocaleString()}</td>
                  <td>KES {rdl.toLocaleString()}</td>
                  <td>KES {totalTax.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TaxBreakdown;