// src/services/crspService.js - COMPLETE REWRITE
import { supabase } from './supabaseClient';

const crspService = {
  // Get all CRSP data with optional limit
  async getAllCRSP(limit = 500) {
    try {
      const { data, error } = await supabase
        .from('crsp')
        .select('*')
        .limit(limit)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, crspData: data || [] };
    } catch (error) {
      console.error('Error fetching CRSP:', error);
      return { success: false, error: error.message, crspData: [] };
    }
  },

  // Get CRSP data by ID
  async getCRSPById(id) {
    try {
      const { data, error } = await supabase
        .from('crsp')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { success: true, crspData: data };
    } catch (error) {
      console.error('Error fetching CRSP by ID:', error);
      return { success: false, error: error.message };
    }
  },

  // Get CRSP data by vehicle details
  async getCRSPByVehicle(make, model, year = null) {
    try {
      let query = supabase
        .from('crsp')
        .select('*')
        .eq('vehicle_details->>make', make)
        .eq('vehicle_details->>model', model);

      if (year) {
        query = query.eq('vehicle_details->>year', year);
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;
      return { success: true, crspData: data || [] };
    } catch (error) {
      console.error('Error fetching CRSP by vehicle:', error);
      return { success: false, error: error.message, crspData: [] };
    }
  },

  // Save CRSP data to database
  async saveCRSPData(vehicles) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, message: 'You must be logged in to save CRSP data' };
      }

      let created = 0;
      let updated = 0;
      let skipped = 0;

      for (const vehicle of vehicles) {
        try {
          // Check if vehicle already exists
          const { data: existing } = await supabase
            .from('crsp')
            .select('id')
            .eq('vehicle_details->>make', vehicle.make)
            .eq('vehicle_details->>model', vehicle.model)
            .eq('vehicle_details->>year', vehicle.year)
            .eq('month', vehicle.month)
            .maybeSingle();

          const vehicleDetails = {
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            engineCC: vehicle.engineCC,
            fuelType: vehicle.fuelType,
            transmission: vehicle.transmission,
            bodyType: vehicle.bodyType,
            trim: vehicle.trim || ''
          };

          if (existing) {
            // Update existing record
            const { error: updateError } = await supabase
              .from('crsp')
              .update({
                retail_price: vehicle.retailPrice,
                customs_value: vehicle.customsValue || vehicle.retailPrice * 0.8,
                wholesale_price: vehicle.wholesalePrice || vehicle.retailPrice * 0.7,
                vehicle_details: vehicleDetails,
                updated_at: new Date().toISOString(),
                updated_by: user.id
              })
              .eq('id', existing.id);

            if (updateError) throw updateError;
            updated++;
          } else {
            // Insert new record
            const { error: insertError } = await supabase
              .from('crsp')
              .insert({
                retail_price: vehicle.retailPrice,
                customs_value: vehicle.customsValue || vehicle.retailPrice * 0.8,
                wholesale_price: vehicle.wholesalePrice || vehicle.retailPrice * 0.7,
                vehicle_details: vehicleDetails,
                month: vehicle.month || new Date().toISOString().slice(0, 7),
                source: 'upload',
                is_active: true,
                created_by: user.id
              });

            if (insertError) throw insertError;
            created++;
          }
        } catch (err) {
          console.error('Error processing vehicle:', vehicle, err);
          skipped++;
        }
      }

      return { success: true, results: { created, updated, skipped } };
    } catch (error) {
      console.error('Error saving CRSP data:', error);
      return { success: false, message: error.message };
    }
  },

  // Load sample CRSP data
  async loadSampleCRSP() {
    const sampleVehicles = [
      {
        make: 'Toyota',
        model: 'Vitz',
        year: 2020,
        engineCC: 1000,
        fuelType: 'petrol',
        transmission: 'automatic',
        bodyType: 'hatchback',
        retailPrice: 850000,
        customsValue: 680000,
        month: '2024-01'
      },
      {
        make: 'Toyota',
        model: 'Vitz',
        year: 2021,
        engineCC: 1000,
        fuelType: 'petrol',
        transmission: 'automatic',
        bodyType: 'hatchback',
        retailPrice: 950000,
        customsValue: 760000,
        month: '2024-01'
      },
      {
        make: 'Suzuki',
        model: 'Swift',
        year: 2020,
        engineCC: 1200,
        fuelType: 'petrol',
        transmission: 'automatic',
        bodyType: 'hatchback',
        retailPrice: 950000,
        customsValue: 760000,
        month: '2024-01'
      },
      {
        make: 'Suzuki',
        model: 'Swift',
        year: 2021,
        engineCC: 1200,
        fuelType: 'petrol',
        transmission: 'automatic',
        bodyType: 'hatchback',
        retailPrice: 1050000,
        customsValue: 840000,
        month: '2024-01'
      },
      {
        make: 'Mazda',
        model: 'Demio',
        year: 2020,
        engineCC: 1500,
        fuelType: 'petrol',
        transmission: 'automatic',
        bodyType: 'hatchback',
        retailPrice: 1100000,
        customsValue: 880000,
        month: '2024-01'
      }
    ];

    return this.saveCRSPData(sampleVehicles);
  },

  // Delete CRSP entry
  async deleteCRSP(id) {
    try {
      const { error } = await supabase
        .from('crsp')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting CRSP:', error);
      return { success: false, message: error.message };
    }
  },

  // Get unique makes
  async getUniqueMakes() {
    try {
      const { data, error } = await supabase
        .from('crsp')
        .select('vehicle_details')
        .limit(1000);

      if (error) throw error;

      const makes = [...new Set(data.map(item => item.vehicle_details?.make).filter(Boolean))];
      return { success: true, makes: makes.sort() };
    } catch (error) {
      console.error('Error fetching makes:', error);
      return { success: false, error: error.message, makes: [] };
    }
  },

  // Get models for a specific make
  async getModelsByMake(make) {
    try {
      const { data, error } = await supabase
        .from('crsp')
        .select('vehicle_details')
        .eq('vehicle_details->>make', make)
        .limit(500);

      if (error) throw error;

      const models = [...new Set(data.map(item => item.vehicle_details?.model).filter(Boolean))];
      return { success: true, models: models.sort() };
    } catch (error) {
      console.error('Error fetching models:', error);
      return { success: false, error: error.message, models: [] };
    }
  },

  // Search CRSP data
  async searchCRSP(searchParams) {
    try {
      let query = supabase.from('crsp').select('*');

      if (searchParams.make) {
        query = query.eq('vehicle_details->>make', searchParams.make);
      }
      if (searchParams.model) {
        query = query.eq('vehicle_details->>model', searchParams.model);
      }
      if (searchParams.year) {
        query = query.eq('vehicle_details->>year', searchParams.year);
      }
      if (searchParams.minPrice) {
        query = query.gte('retail_price', searchParams.minPrice);
      }
      if (searchParams.maxPrice) {
        query = query.lte('retail_price', searchParams.maxPrice);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return { success: true, crspData: data || [] };
    } catch (error) {
      console.error('Error searching CRSP:', error);
      return { success: false, error: error.message, crspData: [] };
    }
  },

  // Get CRSP statistics
  async getCRSPStats() {
    try {
      const { data, error } = await supabase
        .from('crsp')
        .select('retail_price, month, vehicle_details')
        .limit(1000);

      if (error) throw error;

      const totalVehicles = data.length;
      const uniqueMakes = new Set(data.map(item => item.vehicle_details?.make)).size;
      const averagePrice = data.reduce((sum, item) => sum + (item.retail_price || 0), 0) / totalVehicles;
      const months = [...new Set(data.map(item => item.month).filter(Boolean))];

      return {
        success: true,
        stats: {
          totalVehicles,
          uniqueMakes,
          averagePrice,
          monthsCount: months.length,
          latestMonth: months.sort().reverse()[0] || null
        }
      };
    } catch (error) {
      console.error('Error fetching CRSP stats:', error);
      return { success: false, error: error.message };
    }
  }
};

export default crspService;