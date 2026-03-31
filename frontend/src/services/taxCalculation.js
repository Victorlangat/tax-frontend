import TAX_CONSTANTS from '../utils/constants.js';

/**
 * Accurate Kenya Vehicle Import Tax Calculator - 2025 KRA Guidelines
 */

const { VAT_RATE, IDF_PCT, RDL_PCT, DEPRECIATION, CATEGORIES } = TAX_CONSTANTS;

// All functions using const declarations with proper hoisting
const getDepreciationRate = (type, age) => {
  if (age === 0) return 0;
  
  const table = type === 'direct' ? DEPRECIATION.DIRECT_IMPORTS : DEPRECIATION.PREV_REGISTERED;
  
  let rate = 100;
  
  if (type === 'prev') {
    const entry = table.find(entry => entry.years === (age <= 15 ? age : 'over15'));
    if (entry) rate = entry.rate;
  } else {
    const entry = table.find(entry => age > entry.min && age <= entry.max);
    if (entry) rate = entry.rate;
  }
  
  return rate;
};

const getRetentionPct = (type, age) => (100 - getDepreciationRate(type, age)) / 100;

const getVehicleCategory = (engineCC, fuelType, hsCode, flags = {}) => {
  if (flags.isElectric || hsCode?.includes('8702.40') || hsCode?.includes('8703.80')) return CATEGORIES.find(c => c.isElectric);
  if (flags.isSchoolBus) return CATEGORIES.find(c => c.isSchoolBus);
  if (flags.isPrimeMover) return CATEGORIES.find(c => c.isPrimeMover);
  if (flags.isTrailer) return CATEGORIES.find(c => c.isTrailer);
  if (flags.isAmbulance) return CATEGORIES.find(c => c.isAmbulance);
  if (flags.isMotorcycle) return CATEGORIES.find(c => c.isMotorcycle);
  if (flags.isSpecialPurpose || flags.isHeavyMachinery) return CATEGORIES.find(c => c.isSpecialPurpose || c.isHeavyMachinery);
  
  if (engineCC <= 1500) return CATEGORIES.find(c => c.engineMax === 1500);
  if (engineCC >= 1501) {
    const medium = CATEGORIES.find(c => c.engineMin === 1501);
    if (!hsCode || !medium.hsExclude.some(ex => hsCode.includes(ex))) return medium;
    return CATEGORIES.find(c => c.id === 'large_engine_special');
  }
  
  return CATEGORIES.find(c => c.id === 'small_engine');
};

const calculateCustomsValue = (retailPrice, type, age, category) => {
  const baseCustoms = retailPrice * category.baseCustomsPct;
  const retention = getRetentionPct(type, age);
  return Math.round(baseCustoms * retention * 100) / 100;
};

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
    customsValue,
    taxes,
    summary: {
      totalTax: taxes.totalTax,
      totalLandedCost,
      effectiveTaxRate: ((taxes.totalTax / crspRetailPrice) * 100)
    }
  };
};

export { getDepreciationRate, getRetentionPct, getVehicleCategory, calculateCustomsValue, calculateTaxes };
export { calculateVehicleTax };
export const testExample = (categoryId, retail = 1000, age = 0, isDirect = true) => {
  const category = CATEGORIES.find(c => c.id === categoryId);
  return calculateVehicleTax({
    crspRetailPrice: retail,
    age,
    engineCC: category.engineMax || 1000,
    isDirectImport: isDirect
  });
};

export default calculateVehicleTax;

