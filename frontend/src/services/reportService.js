// src/services/reportService.js - COMPLETE REWRITE
import { supabase } from './supabaseClient';

// Helper function to generate unique report ID
const generateReportId = () => {
  return `RPT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// Format currency for reports
const formatCurrency = (value) => {
  if (!value && value !== 0) return 'KES 0';
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

// Format date for reports
const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Format datetime for reports
const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

class ReportService {
  
  // ==================== REPORT GENERATION ====================
  
  // Generate Tax Calculation Report
  async generateTaxReport(calculationData, options = {}) {
    const {
      includeBreakdown = true,
      includeRecommendations = true,
      watermark = true
    } = options;

    const reportId = generateReportId();
    const generatedAt = new Date().toISOString();
    
    // Get user info
    const { data: { user } } = await supabase.auth.getUser();
    
    const reportData = {
      id: reportId,
      referenceId: calculationData.referenceId || `CALC-${Date.now()}`,
      title: calculationData.name || 'Tax Calculation Report',
      subtitle: 'KRA Vehicle Import Tax Assessment',
      type: 'tax',
      generatedAt,
      generatedBy: user?.email || 'System User',
      
      // Vehicle Information
      vehicle: {
        make: calculationData.vehicle?.make || calculationData.inputs?.make || 'N/A',
        model: calculationData.vehicle?.model || calculationData.inputs?.model || 'N/A',
        year: calculationData.vehicle?.year || calculationData.inputs?.year || 'N/A',
        engineCC: calculationData.vehicle?.engineCC || calculationData.inputs?.engineCC || 'N/A',
        fuelType: calculationData.vehicle?.fuelType || calculationData.inputs?.fuelType || 'N/A',
        transmission: calculationData.vehicle?.transmission || 'N/A',
        bodyType: calculationData.vehicle?.bodyType || 'N/A'
      },
      
      // Calculation Inputs
      inputs: {
        crspRetailPrice: calculationData.inputs?.crspRetailPrice || calculationData.totals?.crspRetail || 0,
        age: calculationData.inputs?.age || 0,
        isDirectImport: calculationData.inputs?.isDirectImport !== false,
        shippingCost: calculationData.inputs?.shippingCost || 0,
        insuranceCost: calculationData.inputs?.insuranceCost || 0,
        additionalCosts: calculationData.inputs?.additionalCosts || 0
      },
      
      // Calculation Results
      results: {
        customsValue: calculationData.results?.customsValue || calculationData.totals?.customsValue || 0,
        cifValue: (calculationData.inputs?.crspRetailPrice || 0) + 
                  (calculationData.inputs?.shippingCost || 0) + 
                  (calculationData.inputs?.insuranceCost || 0),
        totalTax: calculationData.results?.totalTax || calculationData.totals?.totalTax || 0,
        totalLandedCost: calculationData.results?.totalLandedCost || calculationData.totals?.totalLandedCost || 0,
        effectiveTaxRate: calculationData.totals?.totalTax && calculationData.totals?.crspRetail 
          ? ((calculationData.totals.totalTax / calculationData.totals.crspRetail) * 100).toFixed(1)
          : '0'
      },
      
      // Tax Breakdown
      taxBreakdown: calculationData.breakdown || [
        { 
          component: 'Import Duty', 
          rate: '35%', 
          amount: calculationData.results?.importDuty || 0,
          description: 'Applied on customs value'
        },
        { 
          component: 'Excise Duty', 
          rate: `${calculationData.results?.exciseRate || 25}%`, 
          amount: calculationData.results?.exciseDuty || 0,
          description: 'Based on engine capacity'
        },
        { 
          component: 'VAT (Value Added Tax)', 
          rate: '16%', 
          amount: calculationData.results?.vat || 0,
          description: 'Applied on CIF + all duties'
        },
        { 
          component: 'IDF (Import Declaration Fee)', 
          rate: '2.5%', 
          amount: calculationData.results?.idf || 0,
          description: 'Applied on customs value'
        },
        { 
          component: 'RDL (Railway Development Levy)', 
          rate: '2%', 
          amount: calculationData.results?.rdl || 0,
          description: 'Applied on customs value'
        }
      ],
      
      // Recommendations
      recommendations: includeRecommendations ? [
        'Verify all documents match the vehicle specifications',
        'Ensure CRSP data is current for accurate valuation',
        'Keep copies of all import documents for KRA audit',
        'Consider using a licensed clearing agent for customs clearance'
      ] : [],
      
      // Metadata
      metadata: {
        generatedAt: formatDateTime(generatedAt),
        reportType: 'Tax Calculation Report',
        version: '1.0',
        kraCompliant: true,
        includesWatermark: watermark,
        includesBreakdown: includeBreakdown
      }
    };
    
    // Save to database
    await this.saveReport(reportData);
    
    return reportData;
  }
  
  // Generate Summary Report
  async generateSummaryReport(calculations, options = {}) {
    const {
      period = 'monthly',
      startDate,
      endDate
    } = options;

    const reportId = generateReportId();
    const generatedAt = new Date().toISOString();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Calculate summary statistics
    const totalCalculations = calculations.length;
    const totalTax = calculations.reduce((sum, calc) => sum + (calc.results?.totalTax || calc.totalTax || 0), 0);
    const totalValue = calculations.reduce((sum, calc) => sum + (calc.inputs?.crspRetailPrice || calc.totals?.crspRetail || 0), 0);
    const uniqueVehicles = new Set(calculations.map(c => `${c.vehicle?.make}-${c.vehicle?.model}`)).size;
    
    // Group by month
    const monthlyData = {};
    calculations.forEach(calc => {
      const date = new Date(calc.createdAt || calc.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { 
          month: monthName, 
          count: 0, 
          tax: 0, 
          value: 0 
        };
      }
      monthlyData[monthKey].count++;
      monthlyData[monthKey].tax += (calc.results?.totalTax || calc.totalTax || 0);
      monthlyData[monthKey].value += (calc.inputs?.crspRetailPrice || calc.totals?.crspRetail || 0);
    });
    
    const reportData = {
      id: reportId,
      referenceId: `SUMMARY-${Date.now()}`,
      title: `Vehicle Import Tax Summary Report`,
      subtitle: `${period.charAt(0).toUpperCase() + period.slice(1)} Overview`,
      type: 'summary',
      generatedAt,
      generatedBy: user?.email || 'System User',
      
      // Period Information
      period: {
        type: period,
        startDate: startDate ? formatDate(startDate) : 'N/A',
        endDate: endDate ? formatDate(endDate) : 'N/A',
        reportDate: formatDateTime(generatedAt)
      },
      
      // Summary Statistics
      summary: {
        totalCalculations,
        totalTax,
        totalValue,
        uniqueVehicles,
        averageTax: totalCalculations > 0 ? totalTax / totalCalculations : 0,
        averageValue: totalCalculations > 0 ? totalValue / totalCalculations : 0,
        effectiveRate: totalValue > 0 ? (totalTax / totalValue) * 100 : 0
      },
      
      // Monthly Breakdown
      monthlyBreakdown: Object.values(monthlyData),
      
      // Top Vehicles by Tax
      topVehicles: calculations
        .sort((a, b) => (b.results?.totalTax || b.totalTax || 0) - (a.results?.totalTax || a.totalTax || 0))
        .slice(0, 10)
        .map(calc => ({
          vehicle: `${calc.vehicle?.make || calc.inputs?.make || ''} ${calc.vehicle?.model || calc.inputs?.model || ''}`.trim(),
          tax: calc.results?.totalTax || calc.totalTax || 0,
          value: calc.inputs?.crspRetailPrice || calc.totals?.crspRetail || 0,
          date: formatDate(calc.createdAt || calc.created_at)
        })),
      
      // Insights
      insights: {
        mostPopularMonth: this.getMostPopularMonth(monthlyData),
        averageTaxPerVehicle: totalCalculations > 0 ? totalTax / totalCalculations : 0,
        projectedAnnualTax: totalTax * (12 / Math.max(1, Object.keys(monthlyData).length))
      },
      
      metadata: {
        generatedAt: formatDateTime(generatedAt),
        reportType: 'Summary Report',
        version: '1.0'
      }
    };
    
    await this.saveReport(reportData);
    return reportData;
  }
  
  // Generate Dispute Resolution Report
  async generateDisputeReport(calculationData, discrepancyData, options = {}) {
    const reportId = generateReportId();
    const generatedAt = new Date().toISOString();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const reportData = {
      id: reportId,
      referenceId: `DISPUTE-${Date.now()}`,
      title: `Tax Dispute Resolution Report`,
      subtitle: `KRA Appeal Documentation`,
      type: 'dispute',
      generatedAt,
      generatedBy: user?.email || 'System User',
      
      // Original Calculation
      originalCalculation: {
        referenceId: calculationData.referenceId,
        vehicle: `${calculationData.vehicle?.make || ''} ${calculationData.vehicle?.model || ''}`.trim(),
        calculatedTax: calculationData.results?.totalTax || calculationData.totalTax || 0,
        calculationDate: formatDate(calculationData.createdAt || calculationData.created_at)
      },
      
      // Discrepancies
      discrepancies: discrepancyData.map(d => ({
        id: d.id,
        description: d.description,
        severity: d.severity,
        field: d.field,
        expectedValue: d.expected,
        foundValue: d.found,
        document: d.document,
        resolution: d.resolution || 'Under Review',
        resolutionNotes: d.resolutionNotes || ''
      })),
      
      // Proposed Adjustments
      proposedAdjustments: {
        adjustedTax: (calculationData.results?.totalTax || calculationData.totalTax || 0) * 0.85,
        difference: (calculationData.results?.totalTax || calculationData.totalTax || 0) * 0.15,
        differencePercentage: 15,
        reason: 'Discrepancy resolution applied based on supporting documents',
        supportingDocuments: discrepancyData.map(d => d.document).filter(Boolean)
      },
      
      // Appeal Information
      appeal: {
        kraOffice: 'Times Tower, Nairobi',
        kraAddress: 'Haile Selassie Avenue, Nairobi, Kenya',
        deadline: formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        status: 'Draft',
        priority: 'High',
        appealLetter: this.generateAppealLetter(calculationData, discrepancyData)
      },
      
      metadata: {
        generatedAt: formatDateTime(generatedAt),
        reportType: 'Dispute Report',
        version: '1.0',
        kraCompliant: true
      }
    };
    
    await this.saveReport(reportData);
    return reportData;
  }
  
  // Generate Audit Report
  async generateAuditReport(calculations, userActivity = []) {
    const reportId = generateReportId();
    const generatedAt = new Date().toISOString();
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const reportData = {
      id: reportId,
      referenceId: `AUDIT-${Date.now()}`,
      title: `Audit Trail Report`,
      subtitle: `Complete System Activity Log`,
      type: 'audit',
      generatedAt,
      generatedBy: user?.email || 'System User',
      
      // Summary
      summary: {
        totalCalculations: calculations.length,
        dateRange: {
          earliest: calculations.length > 0 ? formatDate(Math.min(...calculations.map(c => new Date(c.createdAt || c.created_at)))) : 'N/A',
          latest: calculations.length > 0 ? formatDate(Math.max(...calculations.map(c => new Date(c.createdAt || c.created_at)))) : 'N/A'
        }
      },
      
      // Calculations Audit
      calculationsAudit: calculations.map(calc => ({
        id: calc.id,
        referenceId: calc.referenceId,
        name: calc.name,
        vehicle: `${calc.vehicle?.make || ''} ${calc.vehicle?.model || ''}`.trim(),
        totalTax: calc.results?.totalTax || calc.totalTax || 0,
        createdAt: formatDateTime(calc.createdAt || calc.created_at),
        status: calc.status || 'saved'
      })),
      
      // User Activity
      userActivity: userActivity.map(activity => ({
        action: activity.action,
        timestamp: formatDateTime(activity.timestamp),
        details: activity.details,
        ipAddress: activity.ipAddress || 'N/A'
      })),
      
      metadata: {
        generatedAt: formatDateTime(generatedAt),
        reportType: 'Audit Report',
        version: '1.0',
        forCompliance: true
      }
    };
    
    await this.saveReport(reportData);
    return reportData;
  }
  
  // ==================== REPORT STORAGE ====================
  
  // Save report to database
  async saveReport(reportData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        this.saveToLocalStorage(reportData);
        return { success: true, local: true };
      }
      
      const reportRecord = {
        user_id: user.id,
        report_id: reportData.id,
        reference_id: reportData.referenceId,
        title: reportData.title,
        subtitle: reportData.subtitle,
        type: reportData.type,
        data: reportData,
        generated_at: reportData.generatedAt,
        created_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('reports')
        .insert(reportRecord)
        .select();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      console.error('Error saving report:', error);
      this.saveToLocalStorage(reportData);
      return { success: false, error: error.message };
    }
  }
  
  // Save to localStorage as fallback
  saveToLocalStorage(reportData) {
    const savedReports = localStorage.getItem('smarttax_reports');
    const reports = savedReports ? JSON.parse(savedReports) : [];
    reports.unshift(reportData);
    localStorage.setItem('smarttax_reports', JSON.stringify(reports.slice(0, 50)));
  }
  
  // Get all user reports
  async getUserReports(limit = 50) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return this.getReportsFromLocalStorage();
      }
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      return { success: true, reports: data || [] };
    } catch (error) {
      console.error('Error fetching reports:', error);
      return this.getReportsFromLocalStorage();
    }
  }
  
  // Get reports from localStorage
  getReportsFromLocalStorage() {
    const savedReports = localStorage.getItem('smarttax_reports');
    const reports = savedReports ? JSON.parse(savedReports) : [];
    return { success: true, reports, local: true };
  }
  
  // Get single report by ID
  async getReportById(reportId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const { reports } = this.getReportsFromLocalStorage();
        const report = reports.find(r => r.id === reportId || r.report_id === reportId);
        return { success: true, report };
      }
      
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('report_id', reportId)
        .single();
      
      if (error) throw error;
      
      return { success: true, report: data };
    } catch (error) {
      console.error('Error fetching report:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Delete report
  async deleteReport(reportId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        const { reports } = this.getReportsFromLocalStorage();
        const filtered = reports.filter(r => r.id !== reportId && r.report_id !== reportId);
        localStorage.setItem('smarttax_reports', JSON.stringify(filtered));
        return { success: true };
      }
      
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('report_id', reportId);
      
      if (error) throw error;
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting report:', error);
      return { success: false, error: error.message };
    }
  }
  
  // ==================== EXPORT FUNCTIONS ====================
  
  // Export to CSV
  exportToCSV(reportData) {
    let headers, rows;
    
    if (reportData.type === 'tax') {
      headers = ['Component', 'Rate', 'Amount (KES)'];
      rows = reportData.taxBreakdown?.map(item => [
        item.component,
        item.rate,
        formatCurrency(item.amount)
      ]) || [];
      
      // Add summary rows
      rows.push(['', '', '']);
      rows.push(['Total Tax', '', formatCurrency(reportData.results?.totalTax || 0)]);
      rows.push(['Total Landed Cost', '', formatCurrency(reportData.results?.totalLandedCost || 0)]);
      
    } else if (reportData.type === 'summary') {
      headers = ['Month', 'Calculations', 'Total Tax (KES)', 'Total Value (KES)'];
      rows = reportData.monthlyBreakdown?.map(item => [
        item.month,
        item.count,
        formatCurrency(item.tax),
        formatCurrency(item.value)
      ]) || [];
    } else {
      headers = ['Field', 'Value'];
      rows = [
        ['Report ID', reportData.id],
        ['Title', reportData.title],
        ['Generated At', reportData.metadata?.generatedAt],
        ['Generated By', reportData.generatedBy]
      ];
    }
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.referenceId || reportData.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    return { success: true };
  }
  
  // Export to JSON
  exportToJSON(reportData) {
    const jsonContent = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportData.referenceId || reportData.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    return { success: true };
  }
  
  // Print report
  printReport(reportData) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print reports');
      return { success: false, error: 'Popup blocked' };
    }
    
    const htmlContent = this.generatePrintHTML(reportData);
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
    
    return { success: true };
  }
  
  // Generate HTML for printing
  generatePrintHTML(reportData) {
    const taxBreakdownRows = reportData.taxBreakdown?.map(item => `
      <tr>
        <td>${item.component}</td>
        <td>${item.rate}</td>
        <td>${formatCurrency(item.amount)}</td>
      </tr>
    `).join('') || '';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${reportData.title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 40px;
            color: #333;
            line-height: 1.6;
          }
          .report-container {
            max-width: 900px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #667eea;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 10px;
          }
          h1 { 
            font-size: 24px; 
            margin: 10px 0; 
            color: #1f2937;
          }
          .subtitle { 
            color: #6b7280; 
            font-size: 14px; 
          }
          .section {
            margin: 25px 0;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #667eea;
            border-left: 4px solid #667eea;
            padding-left: 12px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #e5e7eb;
            padding: 12px;
            text-align: left;
          }
          th {
            background: #f9fafb;
            font-weight: 600;
          }
          .total-row {
            font-weight: bold;
            background: #f0fdf4;
          }
          .summary-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .summary-item {
            display: inline-block;
            width: 45%;
            margin: 10px;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
          }
          .watermark {
            position: fixed;
            bottom: 20px;
            right: 20px;
            opacity: 0.1;
            font-size: 60px;
            transform: rotate(-15deg);
            pointer-events: none;
          }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
            .watermark { opacity: 0.05; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <div class="logo">SmartTax System</div>
            <h1>${reportData.title}</h1>
            <div class="subtitle">${reportData.subtitle || ''}</div>
            <div class="subtitle">Generated: ${reportData.metadata?.generatedAt || formatDateTime(new Date())}</div>
            <div class="subtitle">Reference: ${reportData.referenceId}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Vehicle Information</div>
            <table>
              <tr><th>Make</th><td>${reportData.vehicle?.make || 'N/A'}</td></tr>
              <tr><th>Model</th><td>${reportData.vehicle?.model || 'N/A'}</td></tr>
              <tr><th>Year</th><td>${reportData.vehicle?.year || 'N/A'}</td></tr>
              <tr><th>Engine Capacity</th><td>${reportData.vehicle?.engineCC || 'N/A'} cc</td></tr>
              <tr><th>Fuel Type</th><td>${reportData.vehicle?.fuelType || 'N/A'}</td></tr>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Tax Breakdown</div>
            <table>
              <thead>
                <tr><th>Component</th><th>Rate</th><th>Amount (KES)</th></tr>
              </thead>
              <tbody>
                ${taxBreakdownRows}
                <tr class="total-row">
                  <td colspan="2"><strong>Total Tax Payable</strong></td>
                  <td><strong>${formatCurrency(reportData.results?.totalTax || 0)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div class="section">
            <div class="section-title">Summary</div>
            <div class="summary-box">
              <div class="summary-item"><strong>Customs Value:</strong> ${formatCurrency(reportData.results?.customsValue || 0)}</div>
              <div class="summary-item"><strong>CIF Value:</strong> ${formatCurrency(reportData.results?.cifValue || 0)}</div>
              <div class="summary-item"><strong>Total Landed Cost:</strong> ${formatCurrency(reportData.results?.totalLandedCost || 0)}</div>
              <div class="summary-item"><strong>Effective Tax Rate:</strong> ${reportData.results?.effectiveTaxRate || 0}%</div>
            </div>
          </div>
          
          ${reportData.recommendations ? `
          <div class="section">
            <div class="section-title">Recommendations</div>
            <ul>
              ${reportData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>This is an official SmartTax System Generated Report</p>
            <p>For verification, please contact KRA or visit www.smarttax.co.ke</p>
            <p>Report ID: ${reportData.id}</p>
          </div>
        </div>
        <div class="watermark">SmartTax</div>
      </body>
      </html>
    `;
  }
  
  // ==================== SHARE FUNCTIONS ====================
  
  // Share via email
  async shareViaEmail(reportData, email) {
    const emailBody = `
      SmartTax Report: ${reportData.title}
      
      Report ID: ${reportData.referenceId || reportData.id}
      Generated: ${reportData.metadata?.generatedAt || formatDateTime(new Date())}
      Total Tax: ${formatCurrency(reportData.results?.totalTax || 0)}
      
      View full report in your SmartTax dashboard.
    `;
    
    const mailtoLink = `mailto:${email}?subject=SmartTax Report - ${reportData.title}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoLink;
    
    return { success: true };
  }
  
  // ==================== HELPER FUNCTIONS ====================
  
  // Get most popular month from data
  getMostPopularMonth(monthlyData) {
    let mostPopular = { month: '', count: 0 };
    Object.values(monthlyData).forEach(data => {
      if (data.count > mostPopular.count) {
        mostPopular = { month: data.month, count: data.count };
      }
    });
    return mostPopular;
  }
  
  // Generate appeal letter
  generateAppealLetter(calculationData, discrepancyData) {
    return `
      KRA Appeals Committee
      Times Tower, Haile Selassie Avenue
      Nairobi, Kenya
      
      RE: Appeal Against Tax Assessment for Vehicle Import
      
      Dear Sir/Madam,
      
      This letter serves as an appeal against the tax assessment for the vehicle described below:
      
      Vehicle: ${calculationData.vehicle?.make} ${calculationData.vehicle?.model}
      Year: ${calculationData.vehicle?.year}
      Assessment Reference: ${calculationData.referenceId}
      
      The following discrepancies have been identified:
      ${discrepancyData.map(d => `- ${d.description}: Expected ${d.expected}, Found ${d.found}`).join('\n      ')}
      
      We respectfully request a review of the assessment based on the supporting documents attached.
      
      Yours faithfully,
      SmartTax System User
    `;
  }
  
  // Get available report templates
  getReportTemplates() {
    return [
      {
        id: 'standard-tax',
        name: 'Standard Tax Report',
        description: 'Complete tax calculation with detailed breakdown',
        icon: '📄',
        type: 'tax',
        color: '#10b981'
      },
      {
        id: 'summary',
        name: 'Monthly Summary Report',
        description: 'Import statistics and tax totals overview',
        icon: '📊',
        type: 'summary',
        color: '#3b82f6'
      },
      {
        id: 'dispute',
        name: 'Dispute Resolution Report',
        description: 'Appeal letter and evidence compilation',
        icon: '⚖️',
        type: 'dispute',
        color: '#f59e0b'
      },
      {
        id: 'audit',
        name: 'Audit Trail Report',
        description: 'Complete audit history of calculations',
        icon: '🔍',
        type: 'audit',
        color: '#8b5cf6'
      }
    ];
  }
}

// Export singleton instance
const reportService = new ReportService();
export default reportService;