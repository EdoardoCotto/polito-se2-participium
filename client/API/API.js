/**
 * API Client for Participium Frontend
 * Handles all HTTP requests to the backend
 */

const SERVER_URL = 'http://localhost:3001/api';

/**
 * User Registration
 * @param {Object} userData - { username, email, name, surname, password }
 * @returns {Promise<Object>} - Created user object
 */
const register = async (userData) => {
  try {
    const response = await fetch(`${SERVER_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies/sessions
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * User Login
 * @param {Object} credentials - { username, password }
 * @returns {Promise<Object>} - User object with id, username, name, surname, type
 */
const login = async (credentials) => {
  try {
    const response = await fetch(`${SERVER_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important for cookies/sessions
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * User Logout
 * @returns {Promise<Object>} - Success message
 */
const logout = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/sessions/current`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Logout failed');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

/**
 * Get Current User Session
 * @returns {Promise<Object|null>} - Current user object or null if not authenticated
 */
const getCurrentUser = async () => {
  try {
    const response = await fetch(`${SERVER_URL}/sessions/current`, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.status === 401) {
      return null; // Not authenticated
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get current user');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};

const API = {
  register,
  login,
  logout,
  getCurrentUser,
};

export default API;

