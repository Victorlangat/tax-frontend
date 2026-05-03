// src/services/taxCalculation.js
import TAX_CONSTANTS from '../utils/constants.js';

/**
 * Accurate Kenya Vehicle Import Tax Calculator - 2025 KRA Guidelines
 */

const { VAT_RATE, IDF_PCT, RDL_PCT, DEPRECIATION, CATEGORIES } = TAX_CONSTANTS;

// Get depreciation rate based on age and import type
const getDepreciationRate = (type, age) => {
  if (age === 0) return 0;
  
  const table = type === 'direct' ? DEPRECIATION.DIRECT_IMPORTS : DEPRECIATION.PREV_REGISTERED;
  
  if (type === 'prev') {
    // For previously registered, find exact year match
    let entry = table.find(entry => entry.years === age);
    if (!entry && age > 15) {
      entry = table.find(entry => entry.years === 'over15');
    }
    return entry?.rate || 95;
  } else {
    // For direct imports, find age range
    let entry = table.find(entry => age > entry.min && age <= entry.max);
    if (!entry && age > 8) {
      entry = { rate: 65 }; // Max depreciation for older vehicles
    }
    return entry?.rate || 65;
  }
};

// Get retention percentage (value retained after depreciation)
const getRetentionPct = (type, age) => {
  const depreciationRate = getDepreciationRate(type, age);
  return (100 - depreciationRate) / 100;
};

// Get vehicle category based on engine CC and fuel type
const getVehicleCategory = (engineCC, fuelType, hsCode, flags = {}) => {
  if (flags.isElectric || hsCode?.includes('8702.40') || hsCode?.includes('8703.80')) {
    return CATEGORIES.find(c => c.isElectric);
  }
  if (flags.isSchoolBus) return CATEGORIES.find(c => c.isSchoolBus);
  if (flags.isPrimeMover) return CATEGORIES.find(c => c.isPrimeMover);
  if (flags.isTrailer) return CATEGORIES.find(c => c.isTrailer);
  if (flags.isAmbulance) return CATEGORIES.find(c => c.isAmbulance);
  if (flags.isMotorcycle) return CATEGORIES.find(c => c.isMotorcycle);
  
  if (fuelType === 'hybrid') {
    return CATEGORIES.find(c => c.id === 'hybrid') || CATEGORIES.find(c => c.engineMax === 1500);
  }
  
  if (engineCC <= 1500) {
    return CATEGORIES.find(c => c.engineMax === 1500);
  }
  
  if (engineCC >= 1501) {
    const medium = CATEGORIES.find(c => c.engineMin === 1501);
    if (!hsCode || !medium.hsExclude?.some(ex => hsCode.includes(ex))) {
      return medium;
    }
    return CATEGORIES.find(c => c.id === 'large_engine_special');
  }
  
  return CATEGORIES.find(c => c.id === 'small_engine');
};

// Calculate customs value with depreciation
const calculateCustomsValue = (retailPrice, type, age, category) => {
  const baseCustoms = retailPrice * category.baseCustomsPct;
  const retention = getRetentionPct(type, age);
  const customsValue = Math.round(baseCustoms * retention * 100) / 100;
  return customsValue > 0 ? customsValue : baseCustoms * 0.2; // Minimum 20% of base if age is very high
};

// Calculate all taxes
const calculateTaxes = (customsValue, category) => {
  const importDuty = customsValue * (category.importDuty / 100);
  const exciseBase = customsValue + importDuty;
  const exciseDuty = exciseBase * (category.exciseDuty / 100);
  const vatBase = exciseBase + exciseDuty;
  const vat = vatBase * (VAT_RATE / 100);
  const idf = customsValue * (IDF_PCT / 100);
  const rdl = customsValue * (RDL_PCT / 100);
  const totalTax = importDuty + exciseDuty + vat + idf + rdl;

  return {
    customsValue,
    importDuty: Math.round(importDuty * 100) / 100,
    exciseDuty: Math.round(exciseDuty * 100) / 100,
    vat: Math.round(vat * 100) / 100,
    idf: Math.round(idf * 100) / 100,
    rdl: Math.round(rdl * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    rates: {
      importDuty: category.importDuty,
      exciseDuty: category.exciseDuty,
      vat: VAT_RATE,
      idf: IDF_PCT,
      rdl: RDL_PCT
    }
  };
};

// Main calculation function
const calculateVehicleTax = (inputs) => {
  const {
    crspRetailPrice,
    age = 0,
    engineCC = 1500,
    fuelType = 'petrol',
    isDirectImport = true,
    hsCode = '',
    shippingCost = 0,
    insuranceCost = 0,
    additionalCosts = 0
  } = inputs;

  const type = isDirectImport ? 'direct' : 'prev';
  const category = getVehicleCategory(engineCC, fuelType, hsCode, inputs.flags || {});
  
  if (!category) {
    throw new Error('Unable to determine vehicle category');
  }

  const depreciationRate = getDepreciationRate(type, age);
  const retentionPct = getRetentionPct(type, age);
  const customsValue = calculateCustomsValue(crspRetailPrice, type, age, category);
  const taxes = calculateTaxes(customsValue, category);
  
  const cifAdditional = shippingCost + insuranceCost + additionalCosts;
  const totalLandedCost = customsValue + taxes.totalTax + cifAdditional;

  return {
    inputs: {
      crspRetailPrice,
      age,
      engineCC,
      type,
      category: category.name,
      shippingCost,
      insuranceCost,
      additionalCosts,
      cifAdditional
    },
    category,
    depreciationRate,
    retentionPct,
    customsValue,
    taxes,
    summary: {
      totalTax: taxes.totalTax,
      totalLandedCost,
      effectiveTaxRate: ((taxes.totalTax / crspRetailPrice) * 100).toFixed(1)
    }
  };
};

export { 
  getDepreciationRate, 
  getRetentionPct, 
  getVehicleCategory, 
  calculateCustomsValue, 
  calculateTaxes 
};

export { calculateVehicleTax };

export default calculateVehicleTax;