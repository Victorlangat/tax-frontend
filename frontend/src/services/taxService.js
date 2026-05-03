// src/services/taxService.js
import { supabase } from './supabaseClient';
import { calculateVehicleTax } from './taxCalculation';

export const taxService = {
  async calculateAndSave(calculationData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate tax using the real calculation engine
      const calculation = calculateVehicleTax({
        crspRetailPrice: calculationData.crspRetailPrice,
        age: calculationData.age || 0,
        engineCC: calculationData.engineCC || 1500,
        fuelType: calculationData.fuelType || 'petrol',
        isDirectImport: calculationData.isDirectImport !== false,
        hsCode: calculationData.hsCode || '',
        shippingCost: calculationData.shippingCost || 0,
        insuranceCost: calculationData.insuranceCost || 0,
        additionalCosts: calculationData.additionalCosts || 0
      });

      const referenceId = `CALC-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;

      const { data, error } = await supabase
        .from('calculations')
        .insert({
          user_id: user.id,
          vehicle_id: calculationData.vehicleId,
          crsp_id: calculationData.crspId,
          reference_id: referenceId,
          name: calculationData.name || `${calculationData.make || ''} ${calculationData.model || ''} Tax Calculation`,
          description: calculationData.description || '',
          inputs: {
            crspRetailPrice: calculationData.crspRetailPrice,
            age: calculationData.age,
            engineCC: calculationData.engineCC,
            fuelType: calculationData.fuelType,
            isDirectImport: calculationData.isDirectImport,
            shippingCost: calculationData.shippingCost,
            insuranceCost: calculationData.insuranceCost,
            additionalCosts: calculationData.additionalCosts
          },
          results: {
            customsValue: calculation.customsValue,
            importDuty: calculation.taxes.importDuty,
            exciseDuty: calculation.taxes.exciseDuty,
            vat: calculation.taxes.vat,
            idf: calculation.taxes.idf,
            rdl: calculation.taxes.rdl,
            totalTax: calculation.summary.totalTax,
            totalCost: calculation.summary.totalLandedCost
          },
          rates: calculation.taxes.rates,
          summary: calculation.summary,
          status: 'calculated',
          is_saved: true,
          saved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'tax_calculation',
        entity: 'Calculation',
        entity_id: data.id,
        description: `Tax calculation for ${calculationData.make || 'vehicle'} ${calculationData.model || ''}`,
        status: 'success'
      });

      return { 
        success: true, 
        calculation: data,
        taxDetails: calculation
      };
    } catch (error) {
      console.error('Calculate and save error:', error);
      return { success: false, message: error.message };
    }
  },

  async getCalculations(filters = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('calculations')
        .select(`
          *,
          vehicle:vehicles(*),
          crsp:crsp(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, calculations: data || [] };
    } catch (error) {
      console.error('Get calculations error:', error);
      return { success: false, message: error.message, calculations: [] };
    }
  },

  async getCalculationById(id) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('calculations')
        .select(`
          *,
          vehicle:vehicles(*),
          crsp:crsp(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data.user_id !== user.id) {
        throw new Error('Not authorized to view this calculation');
      }

      return { success: true, calculation: data };
    } catch (error) {
      console.error('Get calculation by ID error:', error);
      return { success: false, message: error.message };
    }
  },

  async deleteCalculation(id) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('calculations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Delete calculation error:', error);
      return { success: false, message: error.message };
    }
  },

  async getStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { count: total, error: countError } = await supabase
        .from('calculations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) throw countError;

      const { data: recent, error: recentError } = await supabase
        .from('calculations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      const { data: totals, error: totalsError } = await supabase
        .from('calculations')
        .select('results')
        .eq('user_id', user.id);

      if (totalsError) throw totalsError;

      const totalTax = totals?.reduce((sum, calc) => sum + (calc.results?.totalTax || 0), 0) || 0;

      return {
        success: true,
        stats: {
          totalCalculations: total || 0,
          recentCalculations: recent || [],
          totalTaxEstimated: totalTax
        }
      };
    } catch (error) {
      console.error('Get calculation stats error:', error);
      return { success: false, stats: null };
    }
  }
};

export default taxService;