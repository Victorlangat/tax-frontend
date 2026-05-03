// src/services/documentService.js
import { supabase, storage } from './supabaseClient';

export const documentService = {
  async uploadDocument(file, documentType, metadata = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Please upload PDF, JPG, or PNG files.');
      }

      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await storage.documents.upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = storage.documents.getPublicUrl(filePath);

      // Save to database
      const { data, error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          document_type: documentType,
          filename: fileName,
          original_name: file.name,
          file_path: publicUrl,
          storage_path: filePath,
          mime_type: file.type,
          size_bytes: file.size,
          vehicle_id: metadata.vehicleId || null,
          calculation_id: metadata.calculationId || null,
          description: metadata.description || '',
          status: 'uploaded'
        })
        .select()
        .single();

      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'document_upload',
        entity: 'Document',
        entity_id: data.id,
        description: `Uploaded ${documentType}: ${file.name}`,
        status: 'success'
      });

      return { success: true, document: data };
    } catch (error) {
      console.error('Upload document error:', error);
      return { success: false, message: error.message };
    }
  },

  async uploadMultipleDocuments(files, metadata = {}) {
    try {
      const results = [];
      
      for (const file of files) {
        // Auto-detect document type from filename
        let documentType = 'other';
        const filename = file.name.toLowerCase();
        
        if (filename.includes('invoice')) documentType = 'invoice';
        else if (filename.includes('lading')) documentType = 'bill_of_lading';
        else if (filename.includes('export')) documentType = 'export_certificate';
        else if (filename.includes('inspection')) documentType = 'inspection_certificate';
        else if (filename.includes('crsp')) documentType = 'crsp_sheet';

        const result = await this.uploadDocument(file, documentType, metadata);
        if (result.success) {
          results.push(result.document);
        } else {
          console.warn(`Failed to upload ${file.name}:`, result.message);
        }
      }

      return { success: true, documents: results };
    } catch (error) {
      console.error('Upload multiple documents error:', error);
      return { success: false, message: error.message, documents: [] };
    }
  },

  async getUserDocuments(filters = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('documents')
        .select(`
          *,
          vehicle:vehicles(make, model, year),
          calculation:calculations(reference_id)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (filters.documentType) query = query.eq('document_type', filters.documentType);
      if (filters.vehicleId) query = query.eq('vehicle_id', filters.vehicleId);
      if (filters.calculationId) query = query.eq('calculation_id', filters.calculationId);
      if (filters.status) query = query.eq('status', filters.status);

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, documents: data || [] };
    } catch (error) {
      console.error('Get user documents error:', error);
      return { success: false, message: error.message, documents: [] };
    }
  },

  async getDocumentById(id) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          vehicle:vehicles(*),
          calculation:calculations(*),
          user:user_id(id, name, email)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

// Check authorization
      if (data.user_id !== user.id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userData?.role !== 'admin') {
          throw new Error('Not authorized to view this document');
        }
      }

      return { success: true, document: data };
    } catch (error) {
      console.error('Get document by ID error:', error);
      return { success: false, message: error.message };
    }
  },

  async updateDocument(id, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, document: data };
    } catch (error) {
      console.error('Update document error:', error);
      return { success: false, message: error.message };
    }
  },

  async deleteDocument(id) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get document to find storage path
      const { data: doc } = await supabase
        .from('documents')
        .select('storage_path, user_id')
        .eq('id', id)
        .single();

      if (!doc) throw new Error('Document not found');

// Check authorization
      if (doc.user_id !== user.id) {
        const { data: userData } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (userData?.role !== 'admin') {
          throw new Error('Not authorized to delete this document');
        }
      }

      // Delete from storage
      const { error: storageError } = await storage.documents.remove([doc.storage_path]);
      
      if (storageError) {
        console.warn('Storage deletion warning:', storageError);
      }

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Delete document error:', error);
      return { success: false, message: error.message };
    }
  },

  async verifyDocument(id, verificationData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

// Check admin role
      const { data: userData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (userData?.role !== 'admin') {
        throw new Error('Admin access required');
      }

      const { isVerified, verificationNotes, discrepancies } = verificationData;

      const { data, error } = await supabase
        .from('documents')
        .update({
          status: isVerified ? 'verified' : 'rejected',
          verification: {
            isVerified,
            verifiedBy: user.id,
            verifiedAt: new Date().toISOString(),
            verificationNotes,
            discrepancies: discrepancies || []
          }
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, document: data };
    } catch (error) {
      console.error('Verify document error:', error);
      return { success: false, message: error.message };
    }
  },

  async getDocumentStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get totals
      const { count: total, error: totalError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (totalError) throw totalError;

      const { count: recent, error: recentError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Get by type
      const { data: byType, error: typeError } = await supabase
        .from('documents')
        .select('document_type, size_bytes')
        .eq('user_id', user.id);

      if (typeError) throw typeError;

      const documentsByType = {};
      let totalSize = 0;

      byType?.forEach(doc => {
        documentsByType[doc.document_type] = (documentsByType[doc.document_type] || 0) + 1;
        totalSize += doc.size_bytes || 0;
      });

      // Get by status
      const { data: byStatus, error: statusError } = await supabase
        .from('documents')
        .select('status')
        .eq('user_id', user.id);

      if (statusError) throw statusError;

      const verificationStats = {};
      byStatus?.forEach(doc => {
        verificationStats[doc.status] = (verificationStats[doc.status] || 0) + 1;
      });

      return {
        success: true,
        stats: {
          totalDocuments: total || 0,
          recentDocuments: recent || 0,
          documentsByType: Object.entries(documentsByType).map(([type, count]) => ({ type, count })),
          verificationStats: Object.entries(verificationStats).map(([status, count]) => ({ status, count })),
          totalSize
        }
      };
    } catch (error) {
      console.error('Get document stats error:', error);
      return { success: false, stats: null };
    }
  }
};

export default documentService;