// src/services/auditService.js
import { supabase } from './supabaseClient';

export const auditService = {
  async logActivity(action, entity, entityId, description, metadata = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          action,
          entity,
          entity_id: entityId,
          description,
          metadata,
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          status: 'success'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Log activity error:', error);
      return null;
    }
  },

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return null;
    }
  },

  async getAuditLogs(filters = {}) {
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

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:user_id(id, name, email, role)
        `)
        .order('created_at', { ascending: false });

      if (filters.action) query = query.eq('action', filters.action);
      if (filters.userId) query = query.eq('user_id', filters.userId);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.startDate) query = query.gte('created_at', filters.startDate);
      if (filters.endDate) query = query.lte('created_at', filters.endDate);

      const { data, error } = await query.limit(filters.limit || 100);

      if (error) throw error;

      return { success: true, logs: data || [] };
    } catch (error) {
      console.error('Get audit logs error:', error);
      return { success: false, message: error.message, logs: [] };
    }
  },

  async getAuditStats() {
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

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Total logs
      const { count: total, error: totalError } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Recent logs
      const { count: recent, error: recentError } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Logs by action
      const { data: byAction, error: actionError } = await supabase
        .from('audit_logs')
        .select('action')
        .limit(1000);

      if (actionError) throw actionError;

      const actionCounts = {};
      byAction?.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      });

      // Logs by status
      const { data: byStatus, error: statusError } = await supabase
        .from('audit_logs')
        .select('status')
        .limit(1000);

      if (statusError) throw statusError;

      const statusCounts = {};
      byStatus?.forEach(log => {
        statusCounts[log.status] = (statusCounts[log.status] || 0) + 1;
      });

      // Top users by activity
      const { data: topUsers, error: topError } = await supabase
        .from('audit_logs')
        .select('user_id')
        .limit(1000);

      if (topError) throw topError;

      const userCounts = {};
      topUsers?.forEach(log => {
        userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
      });

      const topUsersList = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([userId, count]) => ({ userId, count }));

      return {
        success: true,
        stats: {
          totalLogs: total || 0,
          recentLogs: recent || 0,
          logsByAction: Object.entries(actionCounts).map(([action, count]) => ({ action, count })),
          logsByStatus: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
          topUsers: topUsersList
        }
      };
    } catch (error) {
      console.error('Get audit stats error:', error);
      return { success: false, stats: null };
    }
  }
};

export default auditService;