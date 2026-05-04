// src/services/authService.js
import { supabase } from './supabaseClient';

const authService = {
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      if (data?.user) {
        localStorage.setItem('smarttax_token', data.session.access_token);
        localStorage.setItem('smarttax_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }

      return { success: false, message: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: error.message };
    }
  },

  async signup(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;

      if (data?.user) {
        return { success: true, user: data.user, needsEmailConfirmation: !data.session };
      }

      return { success: false, message: 'Signup failed' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: error.message };
    }
  },

  async logout() {
    try {
      await supabase.auth.signOut();
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
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return { success: true, user };
    } catch (error) {
      return { success: false, user: null };
    }
  },

  async demoLogin(role = 'importer') {
    const demoEmail = role === 'admin' ? 'admin@smarttax.com' : 'importer@smarttax.com';
    const demoPassword = 'Demo123!';
    return this.login(demoEmail, demoPassword);
  }
};

export { authService };