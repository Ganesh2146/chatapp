// Base URL for API requests
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

// Get auth token from cookies
const getAuthToken = () => {
  // Try to get token from localStorage first
  const token = localStorage.getItem('token') || 
                document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
  return token || '';
};

/**
 * Make an API request with proper error handling
 * @param {string} endpoint - API endpoint (e.g., '/api/auth/login')
 * @param {Object} options - Fetch options (method, headers, body, etc.)
 * @returns {Promise<Object>} - Parsed JSON response
 */
export const apiRequest = async (endpoint, options = {}) => {
  // Ensure headers are set
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
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
      // Clear auth state and redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired. Please log in again.');
    }

    // Handle other non-2xx responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: `HTTP error! status: ${response.status}`
      }));
      throw new Error(errorData.message || 'Something went wrong');
    }

    // Handle empty responses (like 204 No Content)
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Helper methods for common HTTP methods
export const get = (endpoint, options = {}) => 
  apiRequest(endpoint, { ...options, method: 'GET' });

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
    body: JSON.stringify(data),
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
