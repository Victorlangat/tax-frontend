// src/services/authService.js
import { supabase, storage } from './supabaseClient';

export const authService = {
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (error) {
        // Handle specific error messages
        if (error.message === 'Email not confirmed') {
          return {
            success: false,
            message: 'Please confirm your email address. Check your inbox for the confirmation link.',
            needsConfirmation: true
          };
        }
        if (error.message === 'Invalid login credentials') {
          return {
            success: false,
            message: 'Invalid email or password. Please try again.'
          };
        }
        throw error;
      }

      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.warn('Profile fetch error:', profileError);
      }

      // Update last login
      if (profile) {
        await supabase
          .from('profiles')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', data.user.id);
      }

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: data.user.id,
        action: 'login',
        entity: 'User',
        entity_id: data.user.id,
        description: `User logged in`,
        status: 'success'
      });

      return {
        success: true,
        user: profile || {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          role: data.user.user_metadata?.role || 'importer'
        },
        session: data.session,
        token: data.session.access_token
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed'
      };
    }
  },

  async register(userData) {
    try {
      const { name, email, password, phone, company, kraPin } = userData;

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            name,
            role: 'importer',
            company: company || '',
            phone: phone || ''
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          return {
            success: false,
            message: 'User already exists. Please login instead.'
          };
        }
        throw error;
      }

      if (data.user) {
        // Profile will be auto-created by database trigger
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            phone: phone || '',
            company: company || '',
            kra_pin: kraPin || ''
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }

      // Check if email confirmation is required
      const needsConfirmation = !data.session;

      return {
        success: true,
        user: data.user,
        needsEmailConfirmation: needsConfirmation,
        message: needsConfirmation 
          ? 'Registration successful! Please check your email to confirm your account.'
          : 'Registration successful! You can now login.'
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed'
      };
    }
  },

  async logout() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase.from('audit_logs').insert({
          user_id: user.id,
          action: 'logout',
          entity: 'User',
          entity_id: user.id,
          description: `User logged out`,
          status: 'success'
        });
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear local storage
      localStorage.removeItem('smarttax_token');
      localStorage.removeItem('smarttax_user');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, message: error.message };
    }
  },

  async getCurrentUser() {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) return null;

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return profile || user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  async updateProfile(updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: error.message };
    }
  },

  async changePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return { success: false, message: error.message };
    }
  },

  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, message: error.message };
    }
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }
};

export default authService;