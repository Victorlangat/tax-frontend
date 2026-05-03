-- SmartTax Supabase Database Schema
-- Run this in Supabase SQL Editor to set up all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'importer' CHECK (role IN ('importer', 'admin', 'agent', 'viewer')),
  company TEXT,
  kra_pin TEXT,
  address JSONB DEFAULT '{}',
  profile_image TEXT,
  is_active BOOLEAN DEFAULT true,
  preferences JSONB DEFAULT '{"notifications":{"email":true,"sms":false,"push":true},"currency":"KES","language":"en"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'importer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- VEHICLES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INT NOT NULL,
  trim TEXT,
  engine_cc INT NOT NULL,
  fuel_type TEXT NOT NULL CHECK (fuel_type IN ('petrol', 'diesel', 'hybrid', 'electric', 'other')),
  transmission TEXT NOT NULL CHECK (transmission IN ('manual', 'automatic', 'CVT', 'semi-automatic')),
  body_type TEXT CHECK (body_type IN ('sedan', 'hatchback', 'SUV', 'truck', 'van', 'bus', 'other')),
  doors INT DEFAULT 4 CHECK (doors BETWEEN 2 AND 6),
  seats INT DEFAULT 5 CHECK (seats BETWEEN 1 AND 20),
  drive_type TEXT CHECK (drive_type IN ('FWD', 'RWD', 'AWD', '4WD')),
  color TEXT,
  features JSONB DEFAULT '[]',
  specifications JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  source_country TEXT,
  is_popular BOOLEAN DEFAULT false,
  search_count INT DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  last_updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- Vehicle policies
CREATE POLICY "Anyone can view active vehicles" ON vehicles
  FOR SELECT USING (status = 'active' OR auth.uid() = created_by);

CREATE POLICY "Admins can manage vehicles" ON vehicles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- CRSP TABLE (Customs Reserve Price Guide)
-- =============================================
CREATE TABLE IF NOT EXISTS crsp (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  vehicle_details JSONB DEFAULT '{"make":"","model":"","year":2024,"engineCC":1500,"fuelType":"petrol","transmission":"automatic","bodyType":"sedan"}',
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  retail_price DECIMAL(12,2) NOT NULL,
  wholesale_price DECIMAL(12,2),
  customs_value DECIMAL(12,2) NOT NULL,
  depreciation JSONB DEFAULT '{"year1":10,"year2_3":30,"year4_6":50,"year7_8":65}',
  tax_rates JSONB DEFAULT '{"importDuty":35,"exciseDuty":20,"vat":16,"idf":2.5,"rdl":2}',
  notes TEXT,
  source TEXT DEFAULT 'kra' CHECK (source IN ('kra', 'user', 'admin')),
  confidence_score INT DEFAULT 90 CHECK (confidence_score BETWEEN 0 AND 100),
  uploaded_by UUID REFERENCES profiles(id),
  owner UUID REFERENCES profiles(id),
  verification JSONB DEFAULT '{"verified":false}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE crsp ENABLE ROW LEVEL SECURITY;

-- CRSP policies
CREATE POLICY "Anyone can view active CRSP" ON crsp
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can insert CRSP" ON crsp
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage CRSP" ON crsp
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- =============================================
-- CALCULATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  crsp_id UUID REFERENCES crsp(id) ON DELETE SET NULL,
  reference_id TEXT UNIQUE NOT NULL,
  name TEXT,
  description TEXT,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  rates JSONB NOT NULL,
  summary JSONB NOT NULL,
  status TEXT DEFAULT 'calculated' CHECK (status IN ('draft', 'calculated', 'saved', 'exported', 'submitted')),
  is_saved BOOLEAN DEFAULT false,
  saved_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  attachments JSONB DEFAULT '[]',
  sharing JSONB DEFAULT '{"isShared":false,"sharedWith":[]}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

-- Calculation policies
CREATE POLICY "Users can view own calculations" ON calculations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calculations" ON calculations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calculations" ON calculations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calculations" ON calculations
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('invoice', 'bill_of_lading', 'export_certificate', 'inspection_certificate', 'crsp_sheet', 'other')),
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INT NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
  calculation_id UUID REFERENCES calculations(id) ON DELETE SET NULL,
  description TEXT,
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'verified', 'rejected')),
  verification JSONB DEFAULT '{"isVerified":false}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Document policies
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own documents" ON documents
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- AUDIT_LOGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'logout', 'tax_calculation', 'crsp_update', 'document_upload', 'report_generation', 'user_management', 'system_backup', 'settings_update', 'failed_login')),
  entity TEXT NOT NULL,
  entity_id TEXT,
  description TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  location JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'failed', 'warning')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Users can view own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Service role can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- SHARED_CALCULATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS shared_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calculation_id UUID NOT NULL REFERENCES calculations(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  permission TEXT DEFAULT 'view' CHECK (permission IN ('view', 'edit')),
  shared_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(calculation_id, shared_with_user_id)
);

ALTER TABLE shared_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shared calculations access" ON shared_calculations
  FOR ALL USING (auth.uid() = shared_with_user_id);

-- =============================================
-- STORAGE BUCKETS
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('documents', 'documents', true),
  ('reports', 'reports', true),
  ('crsp', 'crsp', true),
  ('profiles', 'profiles', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Anyone can view documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Anyone can view reports" ON storage.objects
  FOR SELECT USING (bucket_id = 'reports');

CREATE POLICY "Anyone can view crsp" ON storage.objects
  FOR SELECT USING (bucket_id = 'crsp');

CREATE POLICY "Authenticated users can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload reports" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'reports' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload crsp" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'crsp' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage own profiles" ON storage.objects
  FOR ALL USING (bucket_id = 'profiles' AND (storage.foldername(name))[1] = auth.uid()::text;

-- =============================================
-- SEED DATA - Sample CRSP entries
-- =============================================
INSERT INTO vehicles (make, model, year, engine_cc, fuel_type, transmission, body_type, is_popular, source_country)
VALUES 
  ('Toyota', 'Prius', 2024, 1800, 'hybrid', 'automatic', 'sedan', true, 'Japan'),
  ('Toyota', 'Corolla', 2024, 1500, 'petrol', 'automatic', 'sedan', true, 'Japan'),
  ('Toyota', 'Rav4', 2024, 2000, 'petrol', 'automatic', 'SUV', true, 'Japan'),
  ('Toyota', 'Land Cruiser', 2024, 3000, 'diesel', 'automatic', 'SUV', false, 'Japan'),
  ('Honda', 'Civic', 2024, 1500, 'petrol', 'automatic', 'sedan', true, 'Japan'),
  ('Honda', 'Accord', 2024, 2000, 'petrol', 'automatic', 'sedan', false, 'Japan'),
  ('Nissan', 'X-Trail', 2024, 2000, 'petrol', 'automatic', 'SUV', false, 'Japan'),
  ('Mazda', 'CX-5', 2024, 2000, 'petrol', 'automatic', 'SUV', false, 'Japan'),
  ('Subaru', 'Outback', 2024, 2500, 'petrol', 'automatic', 'SUV', false, 'Japan'),
  ('Volkswagen', 'Golf', 2024, 1400, 'petrol', 'automatic', 'hatchback', false, 'Germany')
ON CONFLICT DO NOTHING;

-- =============================================
-- FUNCTIONS
-- =============================================
-- Increment function for search count
CREATE OR REPLACE FUNCTION increment_search_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.search_count = OLD.search_count + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crsp_updated_at BEFORE UPDATE ON crsp
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calculations_updated_at BEFORE UPDATE ON calculations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment search count
CREATE TRIGGER increment_vehicle_search_count BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION increment_search_count();

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_crsp_vehicle_month ON crsp(vehicle_id, month);
CREATE INDEX IF NOT EXISTS idx_crsp_month ON crsp(month);
CREATE INDEX IF NOT EXISTS idx_calculations_user ON calculations(user_id);
CREATE INDEX IF NOT EXISTS idx_calculations_status ON calculations(status);
CREATE INDEX IF NOT EXISTS idx_documents_user ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
