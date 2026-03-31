/**
 * Kenya Vehicle Tax Constants - 2025 KRA Guidelines
 */

export const TAX_CONSTANTS = {
  VAT_RATE: 16,
  IDF_PCT: 2.5,  // approximate from examples ~2-2.5%
  RDL_PCT: 2,    // approximate ~2%
  
  // Depreciation rates (% depreciation, higher age = higher %)
  DEPRECIATION: {
    DIRECT_IMPORTS: [
      { min: 1, max: 2, rate: 20 },
      { min: 3, max: 3, rate: 30 },
      { min: 4, max: 4, rate: 40 },
      { min: 5, max: 5, rate: 50 },
      { min: 6, max: 6, rate: 55 },
      { min: 7, max: 7, rate: 60 },
      { min: 8, max: 8, rate: 65 },
    ],
    PREV_REGISTERED: [
      { years: 1, rate: 20 },
      { years: 2, rate: 35 },
      { years: 3, rate: 50 },
      { years: 4, rate: 60 },
      { years: 5, rate: 70 },
      { years: 6, rate: 75 },
      { years: 7, rate: 80 },
      { years: 8, rate: 83 },
      { years: 9, rate: 86 },
      { years: 10, rate: 89 },
      { years: 11, rate: 90 },
      { years: 12, rate: 91 },
      { years: 13, rate: 92 },
      { years: 14, rate: 93 },
      { years: 15, rate: 94 },
      { years: 'over15', rate: 95 },
    ]
  },

  // Vehicle categories with base customs % (from retail 1000 examples), rates
  CATEGORIES: [
    {
      id: 'small_engine',
      name: '≤1500cc (incl S/CAB pickups/lorries/buses, excl school public)',
      engineMax: 1500,
      baseCustomsPct: 0.426,
      importDuty: 35,
      exciseDuty: 20,
      hsExclude: [],
      specialNotes: 'excl school buses public schools'
    },
    {
      id: 'medium_engine',
      name: '>1500cc excl HS 8703.24.90 & 8703.33.90',
      engineMin: 1501,
      baseCustomsPct: 0.409,
      importDuty: 35,
      exciseDuty: 25,
      hsExclude: ['8703.24.90', '8703.33.90']
    },
    {
      id: 'large_engine_special',
      name: 'HS 8703.24.90 & 8703.33.90 >3000cc petrol / >2500cc diesel',
      enginePetrolMin: 3001,
      engineDieselMin: 2501,
      hsInclude: ['8703.24.90', '8703.33.90'],
      baseCustomsPct: 0.378,
      importDuty: 35,
      exciseDuty: 35
    },
    {
      id: 'electric',
      name: '100% Electric (specific HS 8702.40.xx, 8703.80.00)',
      isElectric: true,
      hsInclude: ['8702.40', '8703.80'],
      baseCustomsPct: 0.464,
      importDuty: 25,
      exciseDuty: 10
    },
    {
      id: 'school_bus',
      name: 'School Buses for Public Schools',
      isSchoolBus: true,
      baseCustomsPct: 0.409,
      importDuty: 35,
      exciseDuty: 25
    },
    {
      id: 'prime_mover',
      name: 'Prime Movers (no excise)',
      isPrimeMover: true,
      baseCustomsPct: 0.511,
      importDuty: 35,
      exciseDuty: 0
    },
    {
      id: 'trailer',
      name: 'Trailers (no excise)',
      isTrailer: true,
      baseCustomsPct: 0.511,
      importDuty: 35,
      exciseDuty: 0
    },
    {
      id: 'ambulance',
      name: 'Ambulance',
      isAmbulance: true,
      baseCustomsPct: 0.552,
      importDuty: 0,
      exciseDuty: 25
    },
    {
      id: 'motorcycle',
      name: 'Motor Cycles',
      isMotorcycle: true,
      baseCustomsPct: 0.552,
      importDuty: 25,
      exciseDuty: 18.77  // approx from example 12953/690 ~18.77%, note special formula?
    },
    {
      id: 'special_purpose',
      name: 'Special Purpose',
      isSpecialPurpose: true,
      baseCustomsPct: 0.690,
      importDuty: 0,
      exciseDuty: 0
    },
    {
      id: 'heavy_machinery',
      name: 'Heavy Machineries',
      isHeavyMachinery: true,
      baseCustomsPct: 0.690,
      importDuty: 0,
      exciseDuty: 0
    }
  ]
};

export default TAX_CONSTANTS;

