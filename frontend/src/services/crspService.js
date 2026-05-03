// src/services/crspService.js
import { supabase, storage } from './supabaseClient';
import * as XLSX from 'xlsx';

const parseNumber = (val) => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/[,$\sKES]/g, '').trim();
  return parseFloat(cleaned) || 0;
};

const normalizeFuelType = (value) => {
  if (!value) return 'petrol';
  const val = String(value).toLowerCase().trim();
  const mapping = {
    'gasoline': 'petrol', 'gas': 'petrol', 'petrol': 'petrol',
    'diesel': 'diesel', 'electric': 'electric', 'hybrid': 'hybrid',
    'plug-in hybrid': 'hybrid', 'phev': 'hybrid'
  };
  return mapping[val] || 'petrol';
};

const normalizeTransmission = (value) => {
  if (!value) return 'automatic';
  const val = String(value).toLowerCase().trim();
  const mapping = {
    'at': 'automatic', 'aut': 'automatic', 'auto': 'automatic',
    'mt': 'manual', 'man': 'manual', 'manual': 'manual',
    'cvt': 'CVT', 'semi-auto': 'semi-automatic'
  };
  return mapping[val] || 'automatic';
};

const normalizeBodyType = (value) => {
  if (!value) return 'sedan';
  const val = String(value).toLowerCase().trim();
  const mapping = {
    'sedan': 'sedan', 'saloon': 'sedan', 'suv': 'SUV', 'jeep': 'SUV',
    'hatchback': 'hatchback', 'van': 'van', 'pickup': 'truck',
    'bus': 'bus', 'truck': 'truck'
  };
  return mapping[val] || 'sedan';
};

export const crspService = {
  async getAllCRSP(limit = 500, month = null) {
    try {
      let query = supabase
        .from('crsp')
        .select(`
          *,
          vehicle:vehicles(*)
        `)
        .eq('is_active', true)
        .order('month', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);

      if (month) {
        query = query.eq('month', month);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        crspData: data || [],
        count: data?.length || 0,
        monthFilter: month || null
      };
    } catch (error) {
      console.error('Get all CRSP error:', error);
      return { success: false, message: error.message, crspData: [] };
    }
  },

  async getMyCRSP() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('crsp')
        .select(`
          *,
          vehicle:vehicles(*)
        `)
        .eq('owner_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return { success: true, crspData: data || [] };
    } catch (error) {
      console.error('Get my CRSP error:', error);
      return { success: false, message: error.message, crspData: [] };
    }
  },

  async getCRSPById(id) {
    try {
      const { data, error } = await supabase
        .from('crsp')
        .select(`
          *,
          vehicle:vehicles(*),
          uploaded_by:uploaded_by(id, name, email),
          owner:owner_id(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, crsp: data };
    } catch (error) {
      console.error('Get CRSP by ID error:', error);
      return { success: false, message: error.message };
    }
  },

  async getUniqueMakes() {
    try {
      const { data, error } = await supabase
        .from('crsp')
        .select('vehicle_details')
        .eq('is_active', true);

      if (error) throw error;

      const makesSet = new Set();
      data?.forEach(item => {
        if (item.vehicle_details?.make) {
          makesSet.add(item.vehicle_details.make);
        }
      });

      const makes = Array.from(makesSet).sort();
      return { success: true, makes, count: makes.length };
    } catch (error) {
      console.error('Get unique makes error:', error);
      return { success: false, makes: [], count: 0 };
    }
  },

  async getModelsForMake(make) {
    try {
      const { data, error } = await supabase
        .from('crsp')
        .select('vehicle_details')
        .eq('is_active', true);

      if (error) throw error;

      const modelsSet = new Set();
      data?.forEach(item => {
        if (item.vehicle_details?.make === make && item.vehicle_details?.model) {
          modelsSet.add(item.vehicle_details.model);
        }
      });

      const models = Array.from(modelsSet).sort();
      return { success: true, models };
    } catch (error) {
      console.error('Get models for make error:', error);
      return { success: false, models: [] };
    }
  },

  async saveCRSPData(vehicles) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Auth error:', userError);
        throw new Error('Not authenticated. Please login first.');
      }
      
      if (!user) {
        throw new Error('No user found. Please login first.');
      }

      console.log('Saving vehicles for user:', user.id, user.email);

      const results = { created: 0, updated: 0, skipped: 0 };
      const currentMonth = new Date().toISOString().slice(0, 7);

      for (const v of vehicles) {
        try {
          const normalizedFuel = normalizeFuelType(v.fuelType);
          const normalizedTrans = normalizeTransmission(v.transmission);
          const normalizedBody = normalizeBodyType(v.bodyType);
          const year = parseInt(v.year) || new Date().getFullYear();
          const retailPrice = parseNumber(v.retailPrice);
          
          if (retailPrice <= 0) {
            results.skipped++;
            continue;
          }

          // Check if profile exists
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (profileError || !profile) {
            console.warn('Profile not found for user:', user.id);
            const { error: insertProfileError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                email: user.email,
                name: user.user_metadata?.name || user.email?.split('@')[0],
                role: 'importer',
                is_active: true
              });
            
            if (insertProfileError) {
              console.error('Failed to create profile:', insertProfileError);
            }
          }

          // Find or create vehicle
          let { data: existingVehicle } = await supabase
            .from('vehicles')
            .select('id')
            .eq('make', v.make)
            .eq('model', v.model)
            .eq('year', year)
            .maybeSingle();

          let vehicleId;

          if (existingVehicle) {
            vehicleId = existingVehicle.id;
            results.updated++;
          } else {
            const { data: newVehicle, error: insertError } = await supabase
              .from('vehicles')
              .insert({
                make: v.make,
                model: v.model,
                year: year,
                engine_cc: parseInt(v.engineCC) || 1500,
                fuel_type: normalizedFuel,
                transmission: normalizedTrans,
                body_type: normalizedBody,
                created_by: user.id,
                last_updated_by: user.id,
                status: 'active'
              })
              .select()
              .single();

            if (insertError) {
              console.error('Insert vehicle error:', insertError);
              throw insertError;
            }
            vehicleId = newVehicle.id;
            results.created++;
          }

          // Insert CRSP data
          const month = v.month || currentMonth;
          const crspData = {
            vehicle_id: vehicleId,
            vehicle_details: {
              make: v.make,
              model: v.model,
              year: year,
              engineCC: parseInt(v.engineCC) || 1500,
              fuelType: normalizedFuel,
              transmission: normalizedTrans,
              bodyType: normalizedBody
            },
            month: month,
            retail_price: retailPrice,
            wholesale_price: retailPrice * 0.9,
            customs_value: v.customsValue || retailPrice * 0.65,
            source: 'user',
            confidence_score: 95,
            uploaded_by: user.id,
            owner_id: user.id,
            is_active: true
          };

          const { error: crspError } = await supabase
            .from('crsp')
            .insert(crspData);

          if (crspError) {
            console.error('CRSP insert error:', crspError);
            throw crspError;
          }
          
        } catch (err) {
          console.error('Error saving vehicle:', v.make, v.model, err.message);
          results.skipped++;
        }
      }

      return {
        success: true,
        message: `Saved! Created: ${results.created}, Updated: ${results.updated}, Skipped: ${results.skipped}`,
        results
      };
    } catch (error) {
      console.error('Save CRSP data error:', error);
      return { success: false, message: error.message };
    }
  },

  async deleteCRSP(id) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('crsp')
        .update({ is_active: false })
        .eq('id', id)
        .eq('owner_id', user.id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Delete CRSP error:', error);
      return { success: false, message: error.message };
    }
  },

  async loadSampleCRSP() {
    return { success: false, message: 'Use real data upload instead of sample data' };
  },

  async getStats() {
    try {
      const { count: total, error: countError } = await supabase
        .from('crsp')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (countError) throw countError;

      const { data: months, error: monthsError } = await supabase
        .from('crsp')
        .select('month')
        .eq('is_active', true)
        .order('month', { ascending: false })
        .limit(1);

      const latestMonth = months?.[0]?.month || null;

      return {
        success: true,
        stats: {
          totalVehicles: total || 0,
          latestMonth
        }
      };
    } catch (error) {
      console.error('Get CRSP stats error:', error);
      return { success: false, stats: null };
    }
  }
};

export default crspService;