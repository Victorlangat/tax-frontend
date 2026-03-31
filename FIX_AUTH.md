# Authentication Fix Plan

## Issues Found

### 1. Login.js - Mock Login (No Backend Call)
- **Problem**: Login uses `setTimeout` to simulate API call instead of calling `/api/auth/login`
- **Impact**: No real JWT token is obtained from the backend

### 2. App.js - Hardcoded Fake Token
- **Problem**: Stores `'auth_token_123'` as a hardcoded string instead of real JWT
- **Impact**: Even if login worked, it would send invalid token

### 3. Token Key Mismatch
- **Problem**: 
  - App.js stores token with key: `'smarttax_token'`
  - crspService.js reads from key: `'token'`
- **Impact**: Token is always null when making API calls

## Fix Plan

### Step 1: Fix Login.js
- Replace mock login with actual API call to `/api/auth/login`
- Pass the returned token to onLogin callback

### Step 2: Fix App.js
- Update handleLogin to accept token parameter
- Store actual JWT token (not hardcoded string)
- Use consistent key `'smarttax_token'` for token storage

### Step 3: Fix crspService.js
- Change token key from `'token'` to `'smarttax_token'` to match App.js

## Files to Edit
1. `tax-project/smarttax-frontend/src/pages/Login.js`
2. `tax-project/smarttax-frontend/src/App.js`
3. `tax-project/smarttax-frontend/src/services/crspService.js`
