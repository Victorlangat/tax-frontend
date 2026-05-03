// src/services/vehicleService.js
import { supabase } from './supabaseClient';

export const vehicleService = {
  async lookupVehicle(searchParams) {
    try {
      const { make, model, year, engineCC, fuelType, transmission } = searchParams;

      let query = supabase
        .from('crsp')
        .select(`
          *,
          vehicle:vehicles(*)
        `)
        .eq('is_active', true);

      if (make && make.trim()) {
        query = query.ilike('vehicle_details->>make', `%${make}%`);
      }
      if (model && model.trim()) {
        query = query.ilike('vehicle_details->>model', `%${model}%`);
      }
      if (year && year > 0) {
        query = query.eq('vehicle_details->>year', year.toString());
      }
      if (engineCC && engineCC > 0) {
        query = query.eq('vehicle_details->>engineCC', engineCC.toString());
      }
      if (fuelType && fuelType !== 'all') {
        query = query.eq('vehicle_details->>fuelType', fuelType);
      }

      const { data, error } = await query.limit(200);

      if (error) throw error;

      // Process and deduplicate results
      const vehicleMap = new Map();
      
      data?.forEach(crsp => {
        const vehicleInfo = crsp.vehicle_details || (crsp.vehicle ? {
          make: crsp.vehicle.make,
          model: crsp.vehicle.model,
          year: crsp.vehicle.year,
          engineCC: crsp.vehicle.engine_cc,
          fuelType: crsp.vehicle.fuel_type,
          transmission: crsp.vehicle.transmission,
          bodyType: crsp.vehicle.body_type
        } : null);

        if (!vehicleInfo || !vehicleInfo.make || !vehicleInfo.model) return;

        const key = `${vehicleInfo.make}-${vehicleInfo.model}-${vehicleInfo.year}-${vehicleInfo.engineCC}`;
        
        if (!vehicleMap.has(key)) {
          let matchScore = 0;
          
          if (make && vehicleInfo.make?.toLowerCase().includes(make.toLowerCase())) matchScore += 30;
          if (model && vehicleInfo.model?.toLowerCase().includes(model.toLowerCase())) matchScore += 30;
          if (year && vehicleInfo.year === parseInt(year)) matchScore += 20;
          if (engineCC && vehicleInfo.engineCC === parseInt(engineCC)) matchScore += 10;
          if (fuelType && vehicleInfo.fuelType === fuelType) matchScore += 10;

          vehicleMap.set(key, {
            id: crsp.id,
            make: vehicleInfo.make,
            model: vehicleInfo.model,
            year: vehicleInfo.year,
            engineCC: vehicleInfo.engineCC,
            fuelType: vehicleInfo.fuelType,
            transmission: vehicleInfo.transmission,
            bodyType: vehicleInfo.bodyType,
            crsp: {
              retailPrice: crsp.retail_price,
              customsValue: crsp.customs_value,
              wholesalePrice: crsp.wholesale_price,
              month: crsp.month,
              source: crsp.source
            },
            matchScore: Math.min(matchScore, 100)
          });
        }
      });

      const vehicles = Array.from(vehicleMap.values());
      vehicles.sort((a, b) => b.matchScore - a.matchScore);

      return {
        success: true,
        count: vehicles.length,
        vehicles,
        searchCriteria: searchParams
      };
    } catch (error) {
      console.error('Vehicle lookup error:', error);
      return { success: false, message: error.message, vehicles: [] };
    }
  },

  async getPopularVehicles(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          crsp:crsp!vehicle_id(
            retail_price,
            customs_value,
            wholesale_price,
            month
          )
        `)
        .eq('is_popular', true)
        .eq('status', 'active')
        .order('search_count', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const vehicles = data?.map(vehicle => {
        const latestCRSP = vehicle.crsp?.sort((a, b) => 
          new Date(b.month) - new Date(a.month)
        )[0];
        
        return {
          ...vehicle,
          crsp: latestCRSP
        };
      }).filter(v => v.crsp);

      return { success: true, vehicles: vehicles || [] };
    } catch (error) {
      console.error('Get popular vehicles error:', error);
      return { success: true, vehicles: [] };
    }
  },

  async getVehicleById(id) {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          crsp:crsp(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      await supabase
        .from('vehicles')
        .update({ search_count: supabase.rpc('increment', { x: 1 }) })
        .eq('id', id);

      return { success: true, vehicle: data };
    } catch (error) {
      console.error('Get vehicle by ID error:', error);
      return { success: false, message: error.message };
    }
  },

  async getSearchSuggestions(type, query, make = null) {
    try {
      if (type === 'make') {
        const { data, error } = await supabase
          .from('vehicles')
          .select('make')
          .ilike('make', `%${query || ''}%`)
          .eq('status', 'active')
          .limit(20);

        if (error) throw error;

        const uniqueMakes = [...new Set(data?.map(v => v.make) || [])];
        return { success: true, suggestions: uniqueMakes.sort() };
      }

      if (type === 'model' && make) {
        const { data, error } = await supabase
          .from('vehicles')
          .select('model')
          .eq('make', make)
          .ilike('model', `%${query || ''}%`)
          .eq('status', 'active')
          .limit(20);

        if (error) throw error;

        const uniqueModels = [...new Set(data?.map(v => v.model) || [])];
        return { success: true, suggestions: uniqueModels.sort() };
      }

      return { success: true, suggestions: [] };
    } catch (error) {
      console.error('Get search suggestions error:', error);
      return { success: true, suggestions: [] };
    }
  },

  async getStats() {
    try {
      const { count: total, error: totalError } = await supabase
        .from('vehicles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (totalError) throw totalError;

      const { data: makes, error: makesError } = await supabase
        .from('vehicles')
        .select('make')
        .eq('status', 'active');

      if (makesError) throw makesError;

      const uniqueMakes = [...new Set(makes?.map(v => v.make) || [])];

      return {
        success: true,
        stats: {
          totalVehicles: total || 0,
          uniqueMakes: uniqueMakes.length
        }
      };
    } catch (error) {
      console.error('Get vehicle stats error:', error);
      return { success: false, stats: null };
    }
  }
};

export default vehicleService;