// auth.js - Auth0 Integration for Ice Town

import { Auth0Client } from '@auth0/auth0-spa-js';

// Auth0 configuration
const auth0Config = {
  domain: 'dev-72uctixflkg2w4gh.eu.auth0.com', // Replace with your Auth0 domain
  clientId: 'tQEadVRTrAqj2Q2q2QIkr7CC0j7vHj9g', // Replace with your Auth0 client ID
  audience: 'https://api.icetown.app', // API identifier (optional)
  redirectUri: window.location.origin, // Redirect after login
  cacheLocation: 'localstorage', // Store auth data in localStorage
  useRefreshTokens: true
};

// Create Auth0 client instance
const auth0 = new Auth0Client(auth0Config);

// Auth state
let user = null;
let isAuthenticated = false;

// Initialize authentication
async function initAuth() {
  try {
    // Check for authentication callback
    if (window.location.search.includes('code=')) {
      // Handle redirect callback
      await auth0.handleRedirectCallback();
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check if user is authenticated
    isAuthenticated = await auth0.isAuthenticated();
    
    if (isAuthenticated) {
      // Get user profile
      user = await auth0.getUser();
      console.log('User authenticated:', user);
      
      // Send user profile to server
      await syncUserWithServer(user);
      
      // Return user data
      return {
        isAuthenticated: true,
        user
      };
    } else {
      return {
        isAuthenticated: false,
        user: null
      };
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return {
      isAuthenticated: false,
      user: null,
      error
    };
  }
}

// Login with Auth0
async function login() {
  try {
    // Check if using Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      console.log('Using Telegram WebApp, showing login options');
      // We could show options via Telegram UI or adapt login flow
    }
    
    // Redirect to Auth0 login page
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin
    });
  } catch (error) {
    console.error('Login error:', error);
  }
}

// Register with Auth0
async function register() {
  try {
    // Redirect to Auth0 signup page
    await auth0.loginWithRedirect({
      redirect_uri: window.location.origin,
      screen_hint: 'signup'
    });
  } catch (error) {
    console.error('Registration error:', error);
  }
}

// Logout
async function logout() {
  try {
    // Logout from Auth0
    await auth0.logout({
      returnTo: window.location.origin
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Get authentication token
async function getToken() {
  try {
    const token = await auth0.getTokenSilently();
    return token;
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
}

// Sync user data with backend server
async function syncUserWithServer(userData) {
  try {
    const token = await getToken();
    if (!token) throw new Error('No authentication token available');
    
    // API URL from your DigitalOcean server
    const apiUrl = 'https://api.icetown.app/users/sync';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: userData.sub,
        email: userData.email,
        username: userData.nickname || userData.email.split('@')[0],
        picture: userData.picture,
        // Add additional user data from Telegram if available
        telegram_id: window.Telegram?.WebApp?.initDataUnsafe?.user?.id,
        telegram_username: window.Telegram?.WebApp?.initDataUnsafe?.user?.username
      })
    });
    
    if (!response.ok) {
      throw new Error(`Server sync failed: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('User synced with server:', result);
    return result;
  } catch (error) {
    console.error('Error syncing user with server:', error);
    return null;
  }
}

// Export authentication API
const authAPI = {
  initAuth,
  login,
  register,
  logout,
  getToken,
  isAuthenticated: () => isAuthenticated,
  getUser: () => user
};

export default authAPI;