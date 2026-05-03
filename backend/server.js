// SMArt-tax Backend Server
// Only Node.js built-in modules - no external dependencies!

const http = require('http');
const url = require('url');

const PORT = 5000;

// Create HTTP server
const server = http.createServer((req, res) => {
  // CORS headers - allow all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`${req.method} ${pathname}`);

  // API Routes
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Registration endpoint - calls Supabase Auth API
  if (pathname === '/api/auth/register' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { email, password, name, phone, company, kraPin, role } = JSON.parse(body);
        
        // Validate input
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Email and password are required' }));
          return;
        }
        
        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Invalid email format' }));
          return;
        }
        
        // Password validation - Supabase requires at least 6 characters
        if (password.length < 6) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Password must be at least 6 characters' }));
          return;
        }
        
        const supabaseUrl = 'https://kxybgqkmcogbeuybaphi.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4eWJncWttY29nYmV1eWJhcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTkzNzYsImV4cCI6MjA5MjkzNTM3Nn0.j6_tPGfYq9ATIhOlhrWZur_c-JIB6h5a6YedJ8ufis4';
        
        // Call Supabase Auth API - signup sends confirmation email
        const userMetadata = {};
        if (name) userMetadata.full_name = name;
        if (phone) userMetadata.phone = phone;
        if (company) userMetadata.company = company;
        if (kraPin) userMetadata.kra_pin = kraPin;
        if (role) userMetadata.role = role;
        
        const authResponse = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ 
            email: email,
            password: password,
            options: Object.keys(userMetadata).length > 0 ? { data: userMetadata } : undefined
          })
        });
        
        const authData = await authResponse.json();
        
        console.log('Supabase signup response:', JSON.stringify(authData));
        
        // Handle rate limit specifically
        if (authResponse.status === 429 || (authData.msg && authData.msg.includes('rate limit'))) {
          res.writeHead(429, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            message: 'Too many registration attempts. Please wait a few minutes before trying again.',
            rateLimited: true
          }));
          return;
        }
        
        // Supabase returns different responses based on email confirmation setting
        if (authData.access_token) {
          // Email confirmation disabled - auto-confirm
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            token: authData.access_token,
            user: authData.user
          }));
        } else if (authData.id) {
          // Email confirmation enabled - user needs to verify email
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            message: 'Registration successful! Please check your email to confirm your account.',
            needsEmailConfirmation: true,
            email: email
          }));
        } else if (authData.msg && authData.msg.includes('already been registered')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            message: 'User already exists. Please login instead.'
          }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            message: authData.msg || authData.error_description || 'Registration failed'
          }));
        }
      } catch (err) {
        console.error('Registration error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Server error' }));
      }
    });
    return;
  }

  // Login endpoint - calls Supabase Auth API  
  if (pathname === '/api/auth/login' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body);
        
        // Validate input
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Email and password are required' }));
          return;
        }
        
        const supabaseUrl = 'https://kxybgqkmcogbeuybaphi.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4eWJncWttY29nYmV1eWJhcGhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTkzNzYsImV4cCI6MjA5MjkzNTM3Nn0.j6_tPGfYq9ATIhOlhrWZur_c-JIB6h5a6YedJ8ufis4';
        
        // Call Supabase Auth API
        const authResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ 
            email: email,
            password: password
          })
        });
        
        const authData = await authResponse.json();
        
        console.log('Supabase login response:', JSON.stringify(authData));
        
        if (authData.access_token) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            token: authData.access_token,
            user: authData.user
          }));
        } else if (authData.msg && authData.msg.includes('Email not confirmed')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            message: 'Please confirm your email address first. Check your inbox for the confirmation link.'
          }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            message: authData.msg || authData.error_description || 'Invalid login credentials'
          }));
        }
      } catch (err) {
        console.error('Login error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Server error' }));
      }
    });
    return;
  }

  // Vehicle lookup endpoint
  if (pathname === '/api/vehicles/lookup' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const searchParams = JSON.parse(body);
        
        // This is a proxy to Supabase - you'll implement the actual lookup
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          vehicles: [],
          message: 'Use Supabase directly for vehicle lookup'
        }));
      } catch (err) {
        console.error('Lookup error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: 'Server error' }));
      }
    });
    return;
  }

  // CRSP endpoints
  if (pathname === '/api/crsp/all' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      crspData: [],
      message: 'Use Supabase directly for CRSP data'
    }));
    return;
  }

  if (pathname === '/api/crsp/makes' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      makes: [],
      message: 'Use Supabase directly for makes'
    }));
    return;
  }

  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Start server
server.listen(PORT, () => {
  console.log(`SMArt-tax Backend API running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Register: http://localhost:${PORT}/api/auth/register`);
  console.log(`Login: http://localhost:${PORT}/api/auth/login`);
});