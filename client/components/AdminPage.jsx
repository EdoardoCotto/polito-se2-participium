import { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col, Alert, Card, Table } from 'react-bootstrap';
import API from '../API/API.js';

export default function MapPage() {
  // Validation error messages
  const VALIDATION_MESSAGES = {
    FIRST_NAME_REQUIRED: 'The first name is required',
    LAST_NAME_REQUIRED: 'The last name is required',
    USERNAME_REQUIRED: 'The username is required',
    EMAIL_REQUIRED: 'The email is required',
    EMAIL_INVALID: 'Please enter a valid email',
    PASSWORD_REQUIRED: 'The password is required',
    PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
    CONFIRM_PASSWORD_REQUIRED: 'Please confirm the password',
    PASSWORDS_MISMATCH: 'Passwords do not match'
  };

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // State for users table
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState('');

  // Available roles
  const [availableRoles, setAvailableRoles] = useState([]);
  const [roleMetadata, setRoleMetadata] = useState({});

  // Role change modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('');

  // Fetch users and roles on component mount
  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    setUsersError('');
    try {
      const fetchedUsers = await API.getMunicipalityUsers();
      setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
    } catch (err) {
      setUsersError(err?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const rolesData = await API.getAllowedRoles();
      setAvailableRoles(rolesData.roles || []);
      setRoleMetadata(rolesData.metadata || {});
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setAvailableRoles(['admin', 'urban_planner', 'citizen']);
      setRoleMetadata({});
    }
  };

  // Helper function to get display label for a role
  const getRoleLabel = (role) => {
    return roleMetadata[role]?.label || role;
  };

  const renderUsersContent = () => {
    if (isLoadingUsers) {
      return (
        <div className="text-center p-5">
          <output>
            <div className="spinner-border" style={{ color: '#5e7bb3', width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
          </output>
          <p className="mt-3 text-muted">Loading users...</p>
        </div>
      );
    }

    if (users.length === 0) {
      return (
        <Alert variant="info" className="d-flex align-items-center m-3">
          <i className="bi bi-info-circle me-2"></i>{' '}
          No users found
        </Alert>
      );
    }

    return (
      <div className="table-responsive" style={{ overflowX: 'auto', overflowY: 'visible' }}>
        <Table hover className="mb-0" style={{ minWidth: '700px', borderCollapse: 'collapse' }}>
          <thead style={{ 
            backgroundColor: '#f8f9fa',
            borderBottom: '2px solid #dee2e6'
          }}>
            <tr>
              <th style={{ 
                fontWeight: '600', 
                padding: '1rem', 
                minWidth: '120px',
                fontSize: '0.95rem',
                color: '#495057',
                borderBottom: '2px solid #dee2e6',
                borderTop: 'none'
              }}>
                <i className="bi bi-person-fill me-2" style={{ color: '#5e7bb3' }}></i>Name
              </th>
              <th style={{ 
                fontWeight: '600', 
                padding: '1rem', 
                minWidth: '120px',
                fontSize: '0.95rem',
                color: '#495057',
                borderBottom: '2px solid #dee2e6',
                borderTop: 'none'
              }}>
                <i className="bi bi-person-fill me-2" style={{ color: '#5e7bb3' }}></i>Surname
              </th>
              <th style={{ 
                fontWeight: '600', 
                padding: '1rem', 
                minWidth: '180px',
                fontSize: '0.95rem',
                color: '#495057',
                borderBottom: '2px solid #dee2e6',
                borderTop: 'none'
              }}>
                <i className="bi bi-envelope-fill me-2" style={{ color: '#5e7bb3' }}></i>Email
              </th>
              <th style={{ 
                fontWeight: '600', 
                padding: '1rem', 
                minWidth: '220px',
                fontSize: '0.95rem',
                color: '#495057',
                borderBottom: '2px solid #dee2e6',
                borderTop: 'none'
              }}>
                <i className="bi bi-shield-check me-2" style={{ color: '#5e7bb3' }}></i>Role
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id} style={{ 
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafbfc',
                transition: 'all 0.2s ease'
              }}>
                <td style={{ 
                  padding: '1rem', 
                  verticalAlign: 'middle', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#212529',
                  borderBottom: '1px solid #e9ecef'
                }}                        >
                  <i className="bi bi-person-circle me-2" style={{ color: '#6c757d' }}></i>{' '}
                  {user.name}
                </td>
                <td style={{ 
                  padding: '1rem', 
                  verticalAlign: 'middle', 
                  fontSize: '0.9rem',
                  fontWeight: '500',
                  color: '#212529',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  {user.surname}
                </td>
                <td style={{ 
                  padding: '1rem', 
                  verticalAlign: 'middle', 
                  fontSize: '0.9rem', 
                  wordBreak: 'break-word',
                  color: '#495057',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <i className="bi bi-envelope me-2" style={{ color: '#6c757d' }}></i>{' '}
                  {user.email}
                </td>
                <td style={{ 
                  padding: '1rem', 
                  verticalAlign: 'middle',
                  borderBottom: '1px solid #e9ecef'
                }}>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => handleOpenRoleModal(user)}
                    className="d-flex align-items-center justify-content-between"
                    style={{
                      width: '100%',
                      minWidth: '180px',
                      maxWidth: '280px',
                      fontSize: '0.875rem',
                      borderRadius: '20px',
                      fontWeight: '500',
                      borderColor: '#5e7bb3',
                      borderWidth: '1.5px',
                      color: '#5e7bb3',
                      backgroundColor: '#f8f9ff',
                      padding: '0.5rem 1rem',
                      transition: 'all 0.2s ease',
                      textAlign: 'left'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#5e7bb3';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8f9ff';
                      e.currentTarget.style.color = '#5e7bb3';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span style={{ 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      flex: 1
                    }}>
                      <i className="bi bi-shield-check me-2"></i>{' '}
                      {getRoleLabel(user.type) || 'Assign Role'}
                    </span>
                    <i className="bi bi-pencil-square ms-2" style={{ fontSize: '0.9rem' }}></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setSelectedRole(user.type);
    setShowRoleModal(true);
  };

  const handleCloseRoleModal = () => {
    setShowRoleModal(false);
    setSelectedUser(null);
    setSelectedRole('');
  };

  const handleConfirmRoleChange = async () => {
    if (!selectedUser || !selectedRole) return;
    
    try {
      await API.assignUserRole(selectedUser.id, selectedRole);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === selectedUser.id ? { ...user, type: selectedRole } : user
        )
      );
      handleCloseRoleModal();
    } catch (err) {
      setUsersError(err?.message || 'Failed to update role');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = VALIDATION_MESSAGES.FIRST_NAME_REQUIRED;
    if (!formData.lastName.trim()) newErrors.lastName = VALIDATION_MESSAGES.LAST_NAME_REQUIRED;
    if (!formData.userName.trim()) newErrors.userName = VALIDATION_MESSAGES.USERNAME_REQUIRED;
    if (!formData.email.trim()) newErrors.email = VALIDATION_MESSAGES.EMAIL_REQUIRED;
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = VALIDATION_MESSAGES.EMAIL_INVALID;
    if (!formData.password) newErrors.password = VALIDATION_MESSAGES.PASSWORD_REQUIRED;
    else if (formData.password.length < 8) newErrors.password = VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH;
    if (!formData.confirmPassword) newErrors.confirmPassword = VALIDATION_MESSAGES.CONFIRM_PASSWORD_REQUIRED;
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = VALIDATION_MESSAGES.PASSWORDS_MISMATCH;
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length !== 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setApiError('');
    try {
      const userData = {
        username: formData.userName,
        email: formData.email,
        name: formData.firstName,
        surname: formData.lastName,
        password: formData.password
      };
      await API.createUserByAdmin(userData);
      setShowSuccess(true);
      await fetchUsers(); // Refresh users list
      setTimeout(() => {
        setFormData({
          firstName: '',
          lastName: '',
          userName: '',
          email: '',
          password: '',
          confirmPassword: ''
        });
        setShowSuccess(false);
        setShowModal(false);
      }, 1200);
    } catch (err) {
      setApiError(err?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="app-root d-flex flex-column min-vh-100">
      <div className="position-relative w-100">
        {/* top-right button - responsive positioning */}
        <div className="position-absolute top-0 end-0 m-2 m-md-3" style={{ zIndex: 10 }}>
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
            className="d-flex align-items-center"
            style={{
              backgroundColor: '#5e7bb3',
              borderColor: '#5e7bb3',
              fontWeight: '600',
              boxShadow: '0 0.25rem 0.5rem rgba(0,0,0,0.3)',
              borderRadius: '8px',
              fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
              padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2.5vw, 1.25rem)',
              whiteSpace: 'nowrap'
            }}
          >
            <i className="bi bi-person-plus-fill me-2"></i>
            <span className="d-none d-md-inline">Add Municipality User</span>
            <span className="d-inline d-md-none">Add User</span>
          </Button>
        </div>
      </div>

      {/* Users Table Card - Centered */}
      <div className="d-flex justify-content-center align-items-start flex-grow-1 px-2 px-md-4 py-3 py-md-4 mt-5" style={{ overflow: 'visible', paddingBottom: '4rem' }}>
        <Card style={{ 
          width: '100%',
          maxWidth: '120rem', 
          boxShadow: '0 0.5rem 2rem rgba(94, 123, 179, 0.15)', 
          minHeight: '50vh',
          overflow: 'visible',
          borderRadius: 'clamp(0.5rem, 2vw, 1rem)',
          border: 'none',
          marginBottom: '2rem'
        }}>
          <Card.Header style={{ 
            background: 'linear-gradient(135deg, #5e7bb3 0%, #4a6399 100%)',
            color: 'white',
            padding: 'clamp(1rem, 2vw, 1.5rem)',
            borderTopLeftRadius: 'clamp(0.5rem, 1.5vw, 1rem)',
            borderTopRightRadius: 'clamp(0.5rem, 1.5vw, 1rem)',
            borderBottom: 'none'
          }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h3 className="mb-0 d-flex align-items-center" style={{ fontSize: 'clamp(1.1rem, 4vw, 1.75rem)', fontWeight: '600' }}>
                <i className="bi bi-people-fill me-2"></i>
                <span>Users Management</span>
              </h3>
              <div className="text-white-50" style={{ fontSize: 'clamp(0.75rem, 2.5vw, 1rem)' }}>
                <i className="bi bi-person-badge me-1"></i>{' '}
                {users.length} {users.length === 1 ? 'User' : 'Users'}
              </div>
            </div>
          </Card.Header>
          <Card.Body style={{ 
            minHeight: '50vh', 
            padding: '0',
            paddingBottom: '3rem',
            overflow: 'visible',
            backgroundColor: '#ffffff'
          }}>
            {usersError && (
              <Alert variant="danger" dismissible onClose={() => setUsersError('')} className="m-3">
                <i className="bi bi-exclamation-triangle me-2"></i>{' '}
                {usersError}
              </Alert>
            )}

            {renderUsersContent()}
          </Card.Body>
        </Card>
      </div>

      {/* Registration modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton style={{ borderBottom: '2px solid #f0f0f0' }}>
            <Modal.Title style={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              <i className="bi bi-person-plus-fill me-2" style={{ WebkitTextFillColor: 'initial' }}></i>Add New User
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {showSuccess && (
              <Alert variant="success" className="d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-2"></i>{' '}
                Registration successful!
              </Alert>
            )}
            {apiError && (
              <Alert variant="danger" onClose={() => setApiError('')} dismissible>
                <i className="bi bi-exclamation-triangle me-2"></i>{' '}
                {typeof apiError === 'string' ? apiError : apiError?.message ?? String(apiError)}
              </Alert>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-person me-2"></i>First Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    isInvalid={!!errors.firstName}
                    placeholder="Enter first name"
                    style={{ borderRadius: '8px', padding: '0.6rem' }}
                  />
                  <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-person me-2"></i>Last Name
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    isInvalid={!!errors.lastName}
                    placeholder="Enter last name"
                    style={{ borderRadius: '8px', padding: '0.6rem' }}
                  />
                  <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                <i className="bi bi-at me-2"></i>Username
              </Form.Label>
              <Form.Control
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                isInvalid={!!errors.userName}
                placeholder="Choose a username"
                style={{ borderRadius: '8px', padding: '0.6rem' }}
              />
              <Form.Control.Feedback type="invalid">{errors.userName}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">
                <i className="bi bi-envelope me-2"></i>Email
              </Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                placeholder="Enter email address"
                style={{ borderRadius: '8px', padding: '0.6rem' }}
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-lock me-2"></i>Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!errors.password}
                    placeholder="Create password (min. 8 chars)"
                    style={{ borderRadius: '8px', padding: '0.6rem' }}
                  />
                  <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-shield-lock me-2"></i>Confirm Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.confirmPassword}
                    placeholder="Re-enter password"
                    style={{ borderRadius: '8px', padding: '0.6rem' }}
                  />
                  <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between align-items-center w-100 border-0 pt-0">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowModal(false)} 
              disabled={isSubmitting}
              style={{ borderRadius: '8px' }}
            >
              <i className="bi bi-x-circle me-2"></i>Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={isSubmitting}
              style={{ 
                backgroundColor: '#5e7bb3', 
                borderColor: '#5e7bb3',
                borderRadius: '8px',
                fontWeight: '600'
              }}
            >
              {isSubmitting ? (
                <output>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Creating...
                </output>
              ) : (
                <>
                  <i className="bi bi-person-plus-fill me-2"></i>Create User
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Role Change Modal */}
      <Modal show={showRoleModal} onHide={handleCloseRoleModal} centered size="md">
        <Modal.Header closeButton style={{ 
          background: 'linear-gradient(135deg, #5e7bb3 0%, #4a6399 100%)',
          color: 'white',
          borderBottom: 'none'
        }}>
          <Modal.Title style={{ fontWeight: '600' }}>
            <i className="bi bi-shield-lock me-2"></i>Change User Role
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {selectedUser && (
            <>
              <div className="mb-4 p-3" style={{ 
                backgroundColor: '#f8f9fa', 
                borderRadius: '10px',
                borderLeft: '4px solid #5e7bb3'
              }}>
                <h6 className="mb-2" style={{ color: '#495057', fontWeight: '600' }}>
                  <i className="bi bi-person-circle me-2"></i>{' '}
                  {selectedUser.name} {selectedUser.surname}
                </h6>
                <small className="text-muted">
                  <i className="bi bi-envelope me-1"></i>{' '}
                  {selectedUser.email}
                </small>
              </div>

              <div className="mb-3">
                <div className="form-label fw-semibold" style={{ color: '#495057' }}>
                  <i className="bi bi-tag-fill me-2"></i>Select New Role
                </div>
                <div className="d-flex flex-column gap-2">
                  {availableRoles.map((role) => (
                    <label
                      key={role}
                      className="p-3"
                      style={{
                        backgroundColor: selectedRole === role ? '#5e7bb3' : '#ffffff',
                        color: selectedRole === role ? '#ffffff' : '#212529',
                        border: selectedRole === role ? '2px solid #5e7bb3' : '2px solid #e0e6ed',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontWeight: selectedRole === role ? '600' : '400',
                        boxShadow: selectedRole === role ? '0 4px 12px rgba(94, 123, 179, 0.2)' : 'none',
                        display: 'block'
                      }}
                      onMouseEnter={(e) => {
                        if (selectedRole !== role) {
                          e.currentTarget.style.backgroundColor = '#f8f9ff';
                          e.currentTarget.style.borderColor = '#5e7bb3';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedRole !== role) {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.borderColor = '#e0e6ed';
                        }
                      }}
                      onFocus={(e) => {
                        if (selectedRole !== role) {
                          e.currentTarget.style.backgroundColor = '#f8f9ff';
                          e.currentTarget.style.borderColor = '#5e7bb3';
                          e.currentTarget.style.outline = '2px solid #5e7bb3';
                          e.currentTarget.style.outlineOffset = '2px';
                        }
                      }}
                      onBlur={(e) => {
                        if (selectedRole !== role) {
                          e.currentTarget.style.backgroundColor = '#ffffff';
                          e.currentTarget.style.borderColor = '#e0e6ed';
                          e.currentTarget.style.outline = 'none';
                        }
                      }}
                    >
                      <input
                        type="radio"
                        name="userRole"
                        value={role}
                        checked={selectedRole === role}
                        onChange={() => setSelectedRole(role)}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          width: 0,
                          height: 0
                        }}
                      />
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <i className={`bi bi-${selectedRole === role ? 'check-circle-fill' : 'circle'} me-3`} 
                             style={{ fontSize: '1.2rem' }}></i>
                          <div>
                            <div style={{ fontSize: '0.95rem' }}>{getRoleLabel(role)}</div>
                          </div>
                        </div>
                        {selectedRole === role && (
                          <i className="bi bi-check2" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}></i>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 px-4 pb-4">
          <Button 
            variant="outline-secondary" 
            onClick={handleCloseRoleModal}
            style={{ 
              borderRadius: '8px',
              padding: '0.5rem 1.5rem',
              fontWeight: '500'
            }}
          >
            <i className="bi bi-x-circle me-2"></i>Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleConfirmRoleChange}
            disabled={!selectedRole || selectedRole === selectedUser?.type}
            style={{ 
              backgroundColor: '#5e7bb3',
              borderColor: '#5e7bb3',
              borderRadius: '8px',
              padding: '0.5rem 1.5rem',
              fontWeight: '600',
              boxShadow: '0 2px 8px rgba(94, 123, 179, 0.3)'
            }}
          >
            <i className="bi bi-check-circle-fill me-2"></i>Confirm Change
          </Button>
        </Modal.Footer>
      </Modal>
      </div>
  );
}