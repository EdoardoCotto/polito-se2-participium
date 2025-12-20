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
 * A confirmation code will be sent to the provided email address
 * The account must be confirmed within 30 minutes
 * @param {Object} userData - User registration data
 * @param {string} userData.username - Unique username
 * @param {string} userData.email - User email address
 * @param {string} userData.name - User's first name
 * @param {string} userData.surname - User's last name
 * @param {string} userData.password - User password
 * @returns {Promise<Object>} - Created user object (unconfirmed)
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
 * Confirm Registration
 * Confirms a citizen account using the confirmation code sent via email
 * The code is valid for 30 minutes
 * @param {Object} confirmData - Confirmation data
 * @param {string} confirmData.email - User email address
 * @param {string} confirmData.code - 6-digit confirmation code
 * @returns {Promise<Object>} - Success response with message
 * @throws {Error} - If confirmation fails (invalid or expired code, user not found, etc.)
 */
const confirmRegistration = async (confirmData) => {
  const response = await fetch(`${SERVER_URL}/users/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(confirmData),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Confirmation failed');
  }

  return await response.json();
};

/**
 * Resend Confirmation Code
 * Requests a new confirmation code if the previous one expired or was lost
 * A new code will be sent to the email address
 * @param {Object} emailData - Email data
 * @param {string} emailData.email - User email address
 * @returns {Promise<Object>} - Success response with message
 * @throws {Error} - If request fails (user already confirmed, invalid request, user not found, etc.)
 */
const resendConfirmationCode = async (emailData) => {
  const response = await fetch(`${SERVER_URL}/users/resend-confirmation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to resend confirmation code');
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

/**
 * Assign User Role
 * Admin can assign/update a user's role/type
 * Requires admin authentication
 * @param {number} userId - ID of the user to update
 * @param {string} type - New role/type to assign (e.g., 'urban_planner', 'citizen', 'admin')
 * @returns {Promise<Object>} - Updated user object with id and type
 * @throws {Error} - If assignment fails (validation error, unauthorized, not found, etc.)
 */
const assignUserRole = async (userId, type) => {
  const response = await fetch(`${SERVER_URL}/users/${userId}/type`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ type }),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to assign user role');
  }

  return await response.json();
};

/**
 * Get Allowed Roles
 * Retrieves the list of allowed roles/types and their metadata
 * Requires admin authentication
 * @returns {Promise<Object>} - Object containing roles array and metadata
 * @returns {Promise<Object.roles>} - Array of allowed role strings
 * @returns {Promise<Object.metadata>} - Object mapping roles to their display labels
 * @throws {Error} - If request fails (unauthorized, etc.)
 */
const getAllowedRoles = async () => {
  const response = await fetch(`${SERVER_URL}/users/roles`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get allowed roles');
  }

  return await response.json();
};

/**
 * Get Municipality Users
 * Retrieves list of all municipality users (non-citizen, non-admin)
 * Requires admin authentication
 * @returns {Promise<Array>} - Array of user objects with municipality roles
 * @throws {Error} - If request fails (unauthorized, etc.)
 */
const getMunicipalityUsers = async () => {
  const response = await fetch(`${SERVER_URL}/users/municipality`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get municipality users');
  }

  return await response.json();
};

/**
 * Update User Profile
 * Updates the authenticated user's profile information
 * Requires authentication (user can only update their own profile)
 * @param {number} userId - ID of the user to update (must match authenticated user)
 * @param {Object} profileData - Profile data to update
 * @param {string} [profileData.telegram_nickname] - Telegram nickname (e.g., "@myTelegramHandle")
 * @param {boolean} [profileData.mail_notifications] - Enable/disable email notifications
 * @param {File} [profileData.personal_photo] - User's personal photo file
 * @returns {Promise<Object>} - Updated user object
 * @throws {Error} - If update fails (validation error, unauthorized, forbidden, not found, etc.)
 */
const updateUserProfile = async (userId, profileData) => {
  const formData = new FormData();
  
  if (profileData.telegram_nickname !== undefined) {
    formData.append('telegram_nickname', profileData.telegram_nickname);
  }
  
  if (profileData.mail_notifications !== undefined) {
    formData.append('mail_notifications', String(profileData.mail_notifications));
  }
  
  if (profileData.personal_photo) {
    formData.append('personal_photo_path', profileData.personal_photo);
  }

  // Handle photo action
  if (profileData.photo_action) {
    formData.append('photo_action', profileData.photo_action);
  }

  const response = await fetch(`${SERVER_URL}/users/${userId}/update`, {
    method: 'PUT',
    credentials: 'include',
    body: formData, // FormData automatically sets Content-Type with boundary
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to update user profile');
  }

  return await response.json();
};


/**
 * Create Report
 * Creates a new report with photos (authenticated user)
 * @param {object} p
 * @param {string} p.title
 * @param {string} p.description
 * @param {string} p.category
 * @param {number|string} p.latitude
 * @param {number|string} p.longitude
 * @param {File[]} p.files  // uno o più File dal file input (1-3 files)
 * @returns {Promise<Object>} - Created report object
 * @throws {Error} - If creation fails (validation error, unauthorized, etc.)
 */
async function createReport({ title, description, category, latitude, longitude, files = [] }) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('category', category);
  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));
  files.forEach((f) => formData.append('photos', f)); 

  const response = await fetch(`${SERVER_URL}/reports`, {
    method: 'POST',
    credentials: 'include',   // invia i cookie di sessione
    body: formData            // NON impostare Content-Type manualmente
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Impossibile creare il report');
  }
  return await response.json();
}

/**
 * Create Anonymous Report
 * Creates a new anonymous report without userId (authenticated user required)
 * @param {object} p
 * @param {string} p.title
 * @param {string} p.description
 * @param {string} p.category
 * @param {number|string} p.latitude
 * @param {number|string} p.longitude
 * @param {File[]} p.files  // uno o più File dal file input (1-3 files)
 * @returns {Promise<Object>} - Created anonymous report object
 * @throws {Error} - If creation fails (validation error, unauthorized, etc.)
 */
async function createAnonymousReport({ title, description, category, latitude, longitude, files = [] }) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('category', category);
  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));
  formData.append('anonymous', 'true');
  files.forEach((f) => formData.append('photos', f)); // 👈 stessa chiave ripetuta

  const response = await fetch(`${SERVER_URL}/reports/anonymous`, {
    method: 'POST',
    credentials: 'include',   // invia i cookie di sessione
    body: formData            // NON impostare Content-Type manualmente
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Impossibile creare il report anonimo');
  }
  return await response.json();
}

/**
 * Get Pending Reports
 * Retrieves all reports with status "pending" that need to be reviewed
 * Requires admin or municipal public relations officer authentication
 * @returns {Promise<Array>} - Array of pending report objects
 * @throws {Error} - If request fails (unauthorized, forbidden, etc.)
 */
const getPendingReports = async () => {
  const response = await fetch(`${SERVER_URL}/reports/pending`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get pending reports');
  }

  return await response.json();
};

/**
 * Get Report By ID
 * Retrieves a single report by its ID
 * Requires authentication
 * @param {number} reportId - The ID of the report to retrieve
 * @returns {Promise<Object>} - Report object with all details
 * @throws {Error} - If request fails (invalid ID, not found, unauthorized, etc.)
 */
const getReportById = async (reportId) => {
  const response = await fetch(`${SERVER_URL}/reports/${reportId}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get report');
  }

  return await response.json();
};

/**
 * Review Report
 * Allows admin or municipal public relations officer to accept or reject a report
 * - If status is "accepted", technicalOffice must be provided
 * - If status is "rejected", explanation must be provided
 * Requires admin or municipal public relations officer authentication
 * @param {number} reportId - The ID of the report to review
 * @param {Object} reviewData - Review data
 * @param {string} reviewData.status - "accepted" or "rejected"
 * @param {string} [reviewData.explanation] - Required if status is "rejected"
 * @param {string} [reviewData.technicalOffice] - Required if status is "accepted" (e.g., 'urban_planner', 'public_works_engineer')
 * @returns {Promise<Object>} - Updated report object
 * @throws {Error} - If review fails (validation error, unauthorized, forbidden, not found, etc.)
 */
const reviewReport = async (reportId, reviewData) => {
  const response = await fetch(`${SERVER_URL}/reports/${reportId}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(reviewData),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to review report');
  }

  return await response.json();
};

/**
 * Get Approved Reports
 * Retrieves all reports with status "accepted" for the public map view
 * Optional bounding box parameters can be provided to limit results to visible map area
 * Public endpoint (no authentication required)
 * @param {Object} [options] - Optional parameters
 * @param {number} [options.north] - Northern latitude of the bounding box
 * @param {number} [options.south] - Southern latitude of the bounding box
 * @param {number} [options.east] - Eastern longitude of the bounding box
 * @param {number} [options.west] - Western longitude of the bounding box
 * @returns {Promise<Array>} - Array of approved report objects with photoUrls
 * @throws {Error} - If request fails (invalid query parameters, etc.)
 */
const getApprovedReports = async (options = {}) => {
  const { north, south, east, west } = options;
  const queryParams = new URLSearchParams();
  
  if (north !== undefined) queryParams.append('north', String(north));
  if (south !== undefined) queryParams.append('south', String(south));
  if (east !== undefined) queryParams.append('east', String(east));
  if (west !== undefined) queryParams.append('west', String(west));
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `${SERVER_URL}/reports/approved?${queryString}` 
    : `${SERVER_URL}/reports/approved`;
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get approved reports');
  }

  return await response.json();
};

/**
 * Get Citizen Reports
 * Retrieves all reports visible to citizens (excluding pending and rejected)
 * Requires authentication
 * Optional bounding box parameters can be provided to limit results to visible map area
 * @param {Object} [options] - Optional parameters
 * @param {number} [options.north] - Northern latitude of the bounding box
 * @param {number} [options.south] - Southern latitude of the bounding box
 * @param {number} [options.east] - Eastern longitude of the bounding box
 * @param {number} [options.west] - Western longitude of the bounding box
 * @returns {Promise<Array>} - Array of report objects with photoUrls (excluding pending and rejected)
 * @throws {Error} - If request fails (unauthorized, invalid query parameters, etc.)
 */
const getCitizenReports = async (options = {}) => {
  const { north, south, east, west } = options;
  const queryParams = new URLSearchParams();
  
  if (north !== undefined) queryParams.append('north', String(north));
  if (south !== undefined) queryParams.append('south', String(south));
  if (east !== undefined) queryParams.append('east', String(east));
  if (west !== undefined) queryParams.append('west', String(west));
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `${SERVER_URL}/reports/citizen?${queryString}` 
    : `${SERVER_URL}/reports/citizen`;
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get citizen reports');
  }

  return await response.json();
};

/**
 * Get Assigned Reports
 * Retrieves all reports assigned to the logged-in technical office staff member
 * Requires technical office staff authentication
 * @returns {Promise<Array>} - Array of assigned report objects with photoUrls
 * @throws {Error} - If request fails (unauthorized, forbidden, etc.)
 */
const getAssignedReports = async () => {
  const response = await fetch(`${SERVER_URL}/reports/assigned`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get assigned reports');
  }

  return await response.json();
};

/**
 * Get External Maintainers
 * Retrieves a list of all external maintainers
 * Requires technical office staff authentication
 * @returns {Promise<Array>} - Array of external maintainer user objects with id, username, email, name, surname, type
 * @throws {Error} - If request fails (unauthorized, forbidden, etc.)
 */
const getExternalMaintainers = async () => {
  const response = await fetch(`${SERVER_URL}/users/external-maintainers`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get external maintainers');
  }

  return await response.json();
};

/**
 * Assign Report to External Maintainer
 * Allows a technical office staff member to assign a report that is assigned to them to an external maintainer
 * The report must be in "assigned" status and assigned to the requesting technical office staff member
 * Requires technical office staff authentication
 * @param {number} reportId - The ID of the report to assign
 * @param {number} externalMaintainerId - The ID of the external maintainer to assign the report to
 * @returns {Promise<Object>} - Updated report object
 * @throws {Error} - If assignment fails (validation error, unauthorized, forbidden, not found, etc.)
 */
const assignReportToExternalMaintainer = async (reportId, externalMaintainerId) => {
  const response = await fetch(`${SERVER_URL}/reports/${reportId}/assign-external`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ externalMaintainerId }),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to assign report to external maintainer');
  }

  return await response.json();
};

/**
 * Update Report Status (External Maintainer)
 * Allows an External Maintainer to update the status of a report assigned to them
 * Allowed statuses: "progress", "suspended", "resolved"
 * Requires external maintainer authentication
 * @param {number} reportId - The ID of the report to update
 * @param {string} status - New status ("progress", "suspended", or "resolved")
 * @returns {Promise<Object>} - Updated report object with photoUrls
 * @throws {Error} - If update fails (validation error, unauthorized, forbidden, not found, etc.)
 */
const updateMaintainerStatus = async (reportId, status) => {
  const response = await fetch(`${SERVER_URL}/reports/${reportId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to update report status');
  }

  return await response.json();
};

/**
 * Get External Assigned Reports
 * Retrieves all reports assigned to the logged-in external maintainer
 * Requires external maintainer authentication
 * @returns {Promise<Array>} - Array of assigned report objects with photoUrls
 * @throws {Error} - If request fails (unauthorized, forbidden, etc.)
 */
const getExternalAssignedReports = async () => {
  const response = await fetch(`${SERVER_URL}/reports/external/assigned`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get external assigned reports');
  }

  return await response.json();
};

/**
 * Get Report Categories
 * Fetches the list of report categories from the server
 * Public endpoint (no authentication required)
 * @returns {Promise<Array>} - Array of report categories
 * @throws {Error} - If request fails
 */
async function getCategories() {
  const response = await fetch(`${SERVER_URL}/categories`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get categories');
  }
  return await response.json();
}

/**
 * Get Streets (Autocomplete)
 * Searches for streets in the database for autocomplete purposes
 * Public endpoint (no authentication required)
 * @param {string} query - Part of the street name to search for
 * @returns {Promise<Array>} - Array of street objects with id, city, street_name
 * @throws {Error} - If request fails
 */
const getStreets = async (query = '') => {
  const queryParams = new URLSearchParams();
  if (query) {
    queryParams.append('q', query);
  }
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `${SERVER_URL}/streets?${queryString}` 
    : `${SERVER_URL}/streets`;
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get streets');
  }

  return await response.json();
};

/**
 * Get Reports by Street Name
 * Retrieves reports and map focus data for a specific street
 * Given a street name, returns the geographic boundaries (bounding box)
 * and all existing reports within that area
 * Public endpoint (no authentication required)
 * @param {string} streetName - Exact name of the street
 * @returns {Promise<Object>} - Object containing mapFocus and reports
 * @returns {Promise<Object.mapFocus>} - Map focus data with center and boundingBox
 * @returns {Promise<Object.mapFocus.center>} - Center coordinates with lat and lon
 * @returns {Promise<Object.mapFocus.boundingBox>} - Bounding box with north, south, east, west
 * @returns {Promise<Object.reports>} - Array of report objects with photoUrls
 * @throws {Error} - If request fails (street not found, etc.)
 */
const getReportsByStreet = async (streetName) => {
  const response = await fetch(`${SERVER_URL}/streets/${encodeURIComponent(streetName)}/reports`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get reports by street');
  }

  return await response.json();
};

/**
 * Create Comment
 * Adds an internal comment to a report
 * Requires authentication and internal staff or maintainer role
 * @param {number} reportId - The ID of the report to comment on
 * @param {string} comment - The comment text
 * @returns {Promise<Object>} - Created comment object with id, reportId, userId, comment, createdAt
 * @throws {Error} - If creation fails (validation error, unauthorized, forbidden, not found, etc.)
 */
const createComment = async (reportId, comment) => {
  const response = await fetch(`${SERVER_URL}/comment/${reportId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ comment }),
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to create comment');
  }

  return await response.json();
};

/**
 * Get Comments
 * Retrieves all internal comments for a report
 * Requires authentication and technical office staff role
 * @param {number} reportId - The ID of the report to get comments for
 * @returns {Promise<Array>} - Array of comment objects with id, reportId, userId, comment, createdAt
 * @throws {Error} - If request fails (unauthorized, forbidden, not found, etc.)
 */
const getComments = async (reportId) => {
  const response = await fetch(`${SERVER_URL}/comment/${reportId}/comments`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    await handleErrorResponse(response, 'Failed to get comments');
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
  confirmRegistration,
  resendConfirmationCode,
  createUserByAdmin,
  assignUserRole,
  getAllowedRoles,
  getMunicipalityUsers,
  updateUserProfile,
  getExternalMaintainers,

  // Report management
  createReport,
  createAnonymousReport,
  getPendingReports,
  getApprovedReports,
  getCitizenReports,
  getAssignedReports,
  getExternalAssignedReports,
  getReportById,
  reviewReport,
  assignReportToExternalMaintainer,
  updateMaintainerStatus,

  // Comment management
  createComment,
  getComments,

  // Constants
  getCategories,

  // Streets
  getStreets,
  getReportsByStreet,
};

export default API;

