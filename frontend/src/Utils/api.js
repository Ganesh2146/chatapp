// Base URL for API requests
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'https://chatapp-backend-4to3.onrender.com';

/**
 * Get authentication token from storage
 */
const getAuthToken = () => {
  // Check localStorage first
  const token = localStorage.getItem('token');
  if (token) return token;
  
  // Fallback to cookies if using httpOnly
  const match = document.cookie.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

/**
 * Make an API request with proper error handling
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const fullUrl = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      credentials: 'include', // Important for cookies
    });

    // Handle 401 Unauthorized
    if (response.status === 401) {
      // Clear auth state
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
      throw new Error('Session expired. Please log in again.');
    }

    // Handle other error responses
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { message: `HTTP error! status: ${response.status}` };
      }
      
      const error = new Error(errorData.message || 'Something went wrong');
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Handle empty responses
    if (response.status === 204) {
      return null;
    }

    // Parse and return JSON response
    try {
      return await response.json();
    } catch (e) {
      throw new Error('Failed to parse JSON response');
    }
  } catch (error) {
    console.error('API request failed:', {
      endpoint,
      error: error.message,
      status: error.status,
    });
    throw error;
  }
};

// Helper methods for common HTTP methods
export const get = (endpoint, options = {}) => 
  apiRequest(endpoint, { 
    ...options, 
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

export const post = (endpoint, data, options = {}) => 
  apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

export const put = (endpoint, data, options = {}) =>
  apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data || {}),
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

export const del = (endpoint, options = {}) =>
  apiRequest(endpoint, { 
    ...options, 
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

// WebSocket helper
export const setupWebSocket = (url, options = {}) => {
  const socket = new WebSocket(url);
  
  socket.onopen = () => {
    console.log('WebSocket connection established');
    if (options.onOpen) options.onOpen();
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (options.onMessage) options.onMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  socket.onclose = (event) => {
    console.log('WebSocket connection closed:', event);
    if (options.onClose) options.onClose(event);
    
    // Attempt to reconnect if not a clean close
    if (event.code !== 1000 && options.reconnect !== false) {
      console.log('Attempting to reconnect...');
      setTimeout(() => setupWebSocket(url, options), 5000);
    }
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (options.onError) options.onError(error);
  };
  
  return socket;
};
