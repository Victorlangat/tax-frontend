// src/services/adminService.js
import { supabase } from './supabaseClient';

export const adminService = {
  async getDashboardStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check admin role
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        throw new Error('Admin access required');
      }

      // Get counts
      const [
        { count: totalUsers },
        { count: totalCalculations },
        { count: totalVehicles },
        { count: totalCRSP },
        { count: activeUsers },
        { count: verifiedUsers }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('calculations').select('*', { count: 'exact', head: true }),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('crsp').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('email_verified', true)
      ]);

      // Get recent users
      const { data: recentUsers } = await supabase
        .from('users')
        .select('id, name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent calculations
      const { data: recentCalculations } = await supabase
        .from('calculations')
        .select(`
          *,
          user:user_id(id, name, email),
          vehicle:vehicles(make, model, year)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        success: true,
        stats: {
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          verifiedUsers: verifiedUsers || 0,
          totalCalculations: totalCalculations || 0,
          totalVehicles: totalVehicles || 0,
          totalCRSP: totalCRSP || 0,
          recentUsers: recentUsers || [],
          recentCalculations: recentCalculations || []
        }
      };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return { success: false, message: error.message, stats: null };
    }
  },

  async getAllUsers(filters = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        throw new Error('Admin access required');
      }

      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
      }
      if (filters.role) {
        query = query.eq('role', filters.role);
      }

      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      return {
        success: true,
        users: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
      };
    } catch (error) {
      console.error('Get all users error:', error);
      return { success: false, message: error.message, users: [] };
    }
  },

  async updateUser(userId, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        throw new Error('Admin access required');
      }

      // Check if email is being changed and if it exists
      if (updates.email) {
        const { data: existing } = await supabase
          .from('users')
          .select('id')
          .eq('email', updates.email)
          .neq('id', userId)
          .single();

        if (existing) {
          throw new Error('Email already in use');
        }
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'user_management',
        entity: 'User',
        entity_id: userId,
        description: `Updated user ${data.name} (${data.email})`,
        status: 'success'
      });

      return { success: true, user: data };
    } catch (error) {
      console.error('Update user error:', error);
      return { success: false, message: error.message };
    }
  },

  async deleteUser(userId) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        throw new Error('Admin access required');
      }

      // Check if user has calculations
      const { count } = await supabase
        .from('calculations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (count > 0) {
        throw new Error('Cannot delete user with existing calculations');
      }

      // Get user details for logging
      const { data: targetUser } = await supabase
        .from('users')
        .select('name, email')
        .eq('id', userId)
        .single();

      // Soft delete by deactivating
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'user_management',
        entity: 'User',
        entity_id: userId,
        description: `Deleted user ${targetUser?.name} (${targetUser?.email})`,
        status: 'success'
      });

      return { success: true };
    } catch (error) {
      console.error('Delete user error:', error);
      return { success: false, message: error.message };
    }
  },

  async resetUserPassword(userId, newPassword) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        throw new Error('Admin access required');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Update password using admin API
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'user_management',
        entity: 'User',
        entity_id: userId,
        description: `Reset password for user`,
        status: 'success'
      });

      return { success: true };
    } catch (error) {
      console.error('Reset user password error:', error);
      return { success: false, message: error.message };
    }
  },

  async getSystemStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        throw new Error('Admin access required');
      }

      // Get database stats
      const { data: dbStats } = await supabase.rpc('get_database_stats');

      // Get collection sizes
      const [
        { count: usersCount },
        { count: calculationsCount },
        { count: vehiclesCount },
        { count: crspCount }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('calculations').select('*', { count: 'exact', head: true }),
        supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('crsp').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ]);

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:user_id(id, name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        success: true,
        stats: {
          database: dbStats || {},
          collections: {
            users: usersCount || 0,
            calculations: calculationsCount || 0,
            vehicles: vehiclesCount || 0,
            crsp: crspCount || 0
          },
          uptime: {
            seconds: process.uptime(),
            formatted: this.formatUptime(process.uptime())
          },
          recentActivity: recentActivity || []
        }
      };
    } catch (error) {
      console.error('Get system stats error:', error);
      return { success: false, message: error.message, stats: null };
    }
  },

  formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  }
};

export default adminService;