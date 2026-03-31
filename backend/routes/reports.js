const express = require('express');
const router = express.Router();
const Calculation = require('../models/Calculation');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// @route   POST /api/reports/generate
// @desc    Generate tax calculation report
// @access  Private
router.post('/generate', protect, async (req, res) => {
  try {
    const { calculationId, format = 'pdf', type = 'tax' } = req.body;
    
    const calculation = await Calculation.findById(calculationId)
      .populate('vehicle', 'make model year engineCC fuelType')
      .populate('crsp', 'month customsValue')
      .populate('user', 'name email company kraPin');
    
    if (!calculation) {
      return res.status(404).json({ 
        success: false, 
        message: 'Calculation not found' 
      });
    }
    
    // Check if user owns this calculation
    if (calculation.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to generate report for this calculation' 
      });
    }
    
    let reportData;
    
    switch (format) {
      case 'pdf':
        reportData = await generatePDFReport(calculation, type);
        break;
      case 'excel':
        reportData = await generateExcelReport(calculation, type);
        break;
      case 'csv':
        reportData = await generateCSVReport(calculation, type);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid report format' 
        });
    }
    
    res.json({
      success: true,
      message: 'Report generated successfully',
      report: {
        id: `REP-${Date.now().toString().slice(-8)}`,
        calculationId: calculation._id,
        referenceId: calculation.referenceId,
        format,
        type,
        generatedAt: new Date(),
        data: reportData
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   GET /api/reports/history
// @desc    Get user's report history
// @access  Private
router.get('/history', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // In a real app, you'd have a Report model
    // For now, we'll simulate with calculation history
    const calculations = await Calculation.find({ user: req.user.id })
      .select('referenceId inputs results summary createdAt')
      .populate('vehicle', 'make model year')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Transform calculations to report format
    const reports = calculations.map(calc => ({
      id: `REP-${calc.referenceId}`,
      title: `Tax Report - ${calc.vehicle.make} ${calc.vehicle.model}`,
      calculationId: calc._id,
      referenceId: calc.referenceId,
      date: calc.createdAt,
      vehicle: calc.vehicle,
      totalTax: calc.results.totalTax,
      format: 'pdf',
      status: 'generated'
    }));
    
    const total = await Calculation.countDocuments({ user: req.user.id });
    
    res.json({
      success: true,
      count: reports.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      reports
    });
  } catch (error) {
    console.error('Get report history error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// @route   POST /api/reports/export
// @desc    Export multiple calculations
// @access  Private
router.post('/export', protect, async (req, res) => {
  try {
    const { calculationIds, format = 'excel', type = 'summary' } = req.body;
    
    if (!calculationIds || calculationIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No calculation IDs provided' 
      });
    }
    
    const calculations = await Calculation.find({
      _id: { $in: calculationIds },
      user: req.user.id
    })
    .populate('vehicle', 'make model year')
    .populate('crsp', 'month customsValue');
    
    if (calculations.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No calculations found' 
      });
    }
    
    let exportData;
    
    switch (format) {
      case 'excel':
        exportData = await generateExportExcel(calculations, type);
        break;
      case 'csv':
        exportData = await generateExportCSV(calculations, type);
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid export format' 
        });
    }
    
    res.json({
      success: true,
      message: 'Export generated successfully',
      export: {
        id: `EXP-${Date.now().toString().slice(-8)}`,
        count: calculations.length,
        format,
        type,
        generatedAt: new Date(),
        calculations: calculations.map(c => c.referenceId)
      }
    });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Helper functions for report generation
async function generatePDFReport(calculation, type) {
  return new Promise((resolve) => {
    // Create a PDF document
    const doc = new PDFDocument();
    const buffers = [];
    
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData.toString('base64'));
    });
    
    // Add content to PDF
    doc.fontSize(20).text('SmartTax - Tax Calculation Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Report ID: REP-${calculation.referenceId}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    
    // Vehicle Information
    doc.fontSize(16).text('Vehicle Information');
    doc.fontSize(12).text(`Make: ${calculation.vehicle.make}`);
    doc.text(`Model: ${calculation.vehicle.model}`);
    doc.text(`Year: ${calculation.vehicle.year}`);
    doc.text(`Engine: ${calculation.vehicle.engineCC} cc`);
    doc.text(`Fuel Type: ${calculation.vehicle.fuelType}`);
    doc.moveDown();
    
    // Tax Breakdown
    doc.fontSize(16).text('Tax Breakdown');
    doc.fontSize(12);
    doc.text(`Customs Value: KES ${calculation.results.customsValue.toLocaleString()}`);
    doc.text(`Import Duty: KES ${calculation.results.importDuty.toLocaleString()} (${calculation.rates.importDuty}%)`);
    doc.text(`Excise Duty: KES ${calculation.results.exciseDuty.toLocaleString()} (${calculation.rates.exciseDuty}%)`);
    doc.text(`VAT: KES ${calculation.results.vat.toLocaleString()} (${calculation.rates.vat}%)`);
    doc.text(`IDF: KES ${calculation.results.idf.toLocaleString()} (${calculation.rates.idf}%)`);
    doc.text(`RDL: KES ${calculation.results.rdl.toLocaleString()} (${calculation.rates.rdl}%)`);
    doc.moveDown();
    
    // Summary
    doc.fontSize(16).text('Summary');
    doc.fontSize(12);
    doc.text(`Total Tax: KES ${calculation.results.totalTax.toLocaleString()}`);
    doc.text(`Total Cost: KES ${calculation.results.totalCost.toLocaleString()}`);
    doc.text(`Tax to Value Ratio: ${calculation.summary.taxToValueRatio}%`);
    doc.moveDown();
    
    // Footer
    doc.fontSize(10).text('Generated by SmartTax System', { align: 'center' });
    doc.text('This report is for informational purposes only', { align: 'center' });
    
    doc.end();
  });
}

async function generateExcelReport(calculation, type) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tax Calculation');
  
  // Add headers
  worksheet.columns = [
    { header: 'Item', key: 'item', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
  ];
  
  // Add data
  worksheet.addRow(['Report ID', `REP-${calculation.referenceId}`]);
  worksheet.addRow(['Date', new Date().toLocaleDateString()]);
  worksheet.addRow(['Vehicle', `${calculation.vehicle.make} ${calculation.vehicle.model}`]);
  worksheet.addRow(['Year', calculation.vehicle.year]);
  worksheet.addRow(['']);
  worksheet.addRow(['Tax Breakdown']);
  worksheet.addRow(['Customs Value', calculation.results.customsValue]);
  worksheet.addRow(['Import Duty', calculation.results.importDuty]);
  worksheet.addRow(['Excise Duty', calculation.results.exciseDuty]);
  worksheet.addRow(['VAT', calculation.results.vat]);
  worksheet.addRow(['IDF', calculation.results.idf]);
  worksheet.addRow(['RDL', calculation.results.rdl]);
  worksheet.addRow(['']);
  worksheet.addRow(['Total Tax', calculation.results.totalTax]);
  worksheet.addRow(['Total Cost', calculation.results.totalCost]);
  
  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer.toString('base64');
}

function generateCSVReport(calculation, type) {
  const rows = [
    ['Report ID', `REP-${calculation.referenceId}`],
    ['Date', new Date().toLocaleDateString()],
    ['Vehicle', `${calculation.vehicle.make} ${calculation.vehicle.model}`],
    ['Year', calculation.vehicle.year],
    [''],
    ['Tax Breakdown'],
    ['Customs Value', calculation.results.customsValue],
    ['Import Duty', calculation.results.importDuty],
    ['Excise Duty', calculation.results.exciseDuty],
    ['VAT', calculation.results.vat],
    ['IDF', calculation.results.idf],
    ['RDL', calculation.results.rdl],
    [''],
    ['Total Tax', calculation.results.totalTax],
    ['Total Cost', calculation.results.totalCost]
  ];
  
  const csv = rows.map(row => row.join(',')).join('\n');
  return Buffer.from(csv).toString('base64');
}

async function generateExportExcel(calculations, type) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tax Calculations Export');
  
  // Add headers
  worksheet.columns = [
    { header: 'Reference ID', key: 'referenceId', width: 15 },
    { header: 'Vehicle', key: 'vehicle', width: 25 },
    { header: 'Year', key: 'year', width: 10 },
    { header: 'Customs Value', key: 'customsValue', width: 15 },
    { header: 'Import Duty', key: 'importDuty', width: 15 },
    { header: 'Excise Duty', key: 'exciseDuty', width: 15 },
    { header: 'VAT', key: 'vat', width: 15 },
    { header: 'IDF', key: 'idf', width: 15 },
    { header: 'RDL', key: 'rdl', width: 15 },
    { header: 'Total Tax', key: 'totalTax', width: 15 },
    { header: 'Total Cost', key: 'totalCost', width: 15 },
    { header: 'Date', key: 'date', width: 12 }
  ];
  
  // Add data rows
  calculations.forEach(calc => {
    worksheet.addRow({
      referenceId: calc.referenceId,
      vehicle: `${calc.vehicle.make} ${calc.vehicle.model}`,
      year: calc.vehicle.year,
      customsValue: calc.results.customsValue,
      importDuty: calc.results.importDuty,
      exciseDuty: calc.results.exciseDuty,
      vat: calc.results.vat,
      idf: calc.results.idf,
      rdl: calc.results.rdl,
      totalTax: calc.results.totalTax,
      totalCost: calc.results.totalCost,
      date: calc.createdAt.toISOString().split('T')[0]
    });
  });
  
  // Add summary row
  worksheet.addRow({});
  const summaryRow = worksheet.addRow({
    referenceId: 'TOTAL',
    vehicle: '',
    year: '',
    customsValue: calculations.reduce((sum, c) => sum + c.results.customsValue, 0),
    importDuty: calculations.reduce((sum, c) => sum + c.results.importDuty, 0),
    exciseDuty: calculations.reduce((sum, c) => sum + c.results.exciseDuty, 0),
    vat: calculations.reduce((sum, c) => sum + c.results.vat, 0),
    idf: calculations.reduce((sum, c) => sum + c.results.idf, 0),
    rdl: calculations.reduce((sum, c) => sum + c.results.rdl, 0),
    totalTax: calculations.reduce((sum, c) => sum + c.results.totalTax, 0),
    totalCost: calculations.reduce((sum, c) => sum + c.results.totalCost, 0),
    date: ''
  });
  
  // Style the summary row
  summaryRow.font = { bold: true };
  
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer.toString('base64');
}

function generateExportCSV(calculations, type) {
  const headers = ['Reference ID,Vehicle,Year,Customs Value,Import Duty,Excise Duty,VAT,IDF,RDL,Total Tax,Total Cost,Date'];
  const rows = calculations.map(calc => 
    `${calc.referenceId},"${calc.vehicle.make} ${calc.vehicle.model}",${calc.vehicle.year},${calc.results.customsValue},${calc.results.importDuty},${calc.results.exciseDuty},${calc.results.vat},${calc.results.idf},${calc.results.rdl},${calc.results.totalTax},${calc.results.totalCost},${calc.createdAt.toISOString().split('T')[0]}`
  );
  
  // Add total row
  const totals = calculations.reduce((acc, calc) => ({
    customsValue: acc.customsValue + calc.results.customsValue,
    importDuty: acc.importDuty + calc.results.importDuty,
    exciseDuty: acc.exciseDuty + calc.results.exciseDuty,
    vat: acc.vat + calc.results.vat,
    idf: acc.idf + calc.results.idf,
    rdl: acc.rdl + calc.results.rdl,
    totalTax: acc.totalTax + calc.results.totalTax,
    totalCost: acc.totalCost + calc.results.totalCost
  }), {
    customsValue: 0,
    importDuty: 0,
    exciseDuty: 0,
    vat: 0,
    idf: 0,
    rdl: 0,
    totalTax: 0,
    totalCost: 0
  });
  
  rows.push(`TOTAL,,,${totals.customsValue},${totals.importDuty},${totals.exciseDuty},${totals.vat},${totals.idf},${totals.rdl},${totals.totalTax},${totals.totalCost},`);
  
  const csv = headers.concat(rows).join('\n');
  return Buffer.from(csv).toString('base64');
}

module.exports = router;