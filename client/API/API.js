/**
 * API Client for Participium Frontend
 * Handles all HTTP requests to the backend
 */

const SERVER_URL = 'http://localhost:3001/api';

/**
 * Helper function to handle API errors consistently
 * Backend uses both 'error' and 'message' fields for error responses
 * @param {Response} response - Fetch response object
 * @param {string} defaultMessage - Default error message
 * @throws {Error} - Throws error with appropriate message
 */
const handleErrorResponse = async (response, defaultMessage) => {
  try {
    const errorData = await response.json();
    throw new Error(errorData.error || errorData.message || defaultMessage);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(defaultMessage);
  }
};

/**
 * User Registration
 * Registers a new citizen user
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Unique username
 * @param {string} userData.email - User email address
 * @param {string} userData.name - User's first name
 * @param {string} userData.surname - User's last name
 * @param {string} userData.password - User password
 * @returns {Promise<Object>} - Created user object
 * @throws {Error} - If registration fails (validation error, conflict, etc.)
 */
const register = async (userData) => {
  const response = await fetch(`${SERVER_URL}/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Registration failed');
  }

  return await response.json();
};

/**
 * User Login
 * Authenticates user and creates a session
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.username - Username
 * @param {string} credentials.password - Password
 * @returns {Promise<Object>} - User object with id, username, name, surname, type
 * @throws {Error} - If login fails (invalid credentials, etc.)
 */
const login = async (credentials) => {
  const response = await fetch(`${SERVER_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Login failed');
  }

  return await response.json();
};

/**
 * User Logout
 * Terminates current user session
 * @returns {Promise<Object>} - Success message
 * @throws {Error} - If logout fails or user not authenticated
 */
const logout = async () => {
  const response = await fetch(`${SERVER_URL}/sessions/current`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Logout failed');
  }

  return await response.json();
};

/**
 * Get Current User Session
 * Retrieves the currently authenticated user's information
 * @returns {Promise<Object|null>} - Current user object with id, username, name, surname, email, type or null if not authenticated
 * @throws {Error} - If request fails (not for 401 status)
 */
const getCurrentUser = async () => {
  const response = await fetch(`${SERVER_URL}/sessions/current`, {
    method: 'GET',
    credentials: 'include',
  });

  if (response.status === 401) {
    return null; // Not authenticated
  }

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get current user');
  }

  return await response.json();
};

/**
 * Create User by Admin
 * Admin can create users with specific roles (urban_planner, citizen, etc.)
 * Requires admin authentication
 * @param {Object} userData - User data to create
 * @param {string} userData.username - Unique username
 * @param {string} userData.email - User email address
 * @param {string} userData.name - User's first name
 * @param {string} userData.surname - User's last name
 * @param {string} userData.password - User password
 * @param {string} userData.type - User type (citizen, urban_planner)
 * @returns {Promise<Object>} - Created user object
 * @throws {Error} - If creation fails (validation error, unauthorized, conflict, etc.)
 */
const createUserByAdmin = async (userData) => {
  const response = await fetch(`${SERVER_URL}/users/admin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to create user');
  }

  return await response.json();
};

// Export all API functions as a single object
const API = {
  // Session management
  login,
  logout,
  getCurrentUser,
  
  // User management
  register,
  createUserByAdmin,
};

export default API;

