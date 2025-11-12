import { useState, useEffect } from 'react';
import { Button, Modal, Form, Row, Col, Alert, Card, Table, Dropdown } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../API/API.js';

export default function MapPage() {
  const navigate = useNavigate();

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
    } catch (err) {
      console.error('Failed to fetch roles:', err);
      setAvailableRoles(['admin', 'urban_planner', 'citizen']);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await API.assignUserRole(userId, newRole);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, type: newRole } : user
        )
      );
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
    if (!formData.firstName.trim()) newErrors.firstName = 'The first name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'The last name is required';
    if (!formData.userName.trim()) newErrors.userName = 'The username is required';
    if (!formData.email.trim()) newErrors.email = 'The email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'The password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm the password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
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
        {/* top-right button */}
        <div className="position-absolute top-0 end-0 m-3">
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowModal(true)}
            style={{
              backgroundColor: '#5e7bb3',
              borderColor: '#5e7bb3',
              fontWeight: '600',
              boxShadow: '0 0.25rem 0.5rem rgba(0,0,0,0.3)',
              borderRadius: '8px'
            }}
          >
            <i className="bi bi-person-plus-fill me-2"></i>
            Add Municipality User
          </Button>
        </div>
      </div>

      {/* Users Table Card - Centered */}
      <div className="d-flex justify-content-center align-items-start flex-grow-1 p-4 mt-5">
        <Card style={{ 
          width: '90%', 
          maxWidth: '120rem', 
          boxShadow: '0 0.5rem 1.5rem rgba(0,0,0,0.2)', 
          minHeight: '70vh',
          overflow: 'visible',
          borderRadius: '1rem',
          border: 'none'
        }}>
          <Card.Header style={{ 
            backgroundColor: '#5e7bb3',
            color: 'white',
            padding: '1.5rem',
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem'
          }}>
            <h4 className="mb-0 d-flex align-items-center">
              <i className="bi bi-people-fill me-3"></i>
              Users Management
            </h4>
          </Card.Header>
          <Card.Body style={{ 
            minHeight: '50vh', 
            paddingBottom: '1rem',
            overflow: 'visible' // Leave space for dropdowns
          }}>
            {usersError && (
              <Alert variant="danger" dismissible onClose={() => setUsersError('')}>
                <i className="bi bi-exclamation-triangle me-2"></i>
                {usersError}
              </Alert>
            )}

            {isLoadingUsers ? (
              <div className="text-center p-5">
                <div className="spinner-border" role="status" style={{ color: '#5e7bb3', width: '3rem', height: '3rem' }}>
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <Alert variant="info" className="d-flex align-items-center">
                <i className="bi bi-info-circle me-2"></i>
                No users found
              </Alert>
            ) : (
              <div style={{ overflow: 'visible' }}>
                <Table striped hover responsive style={{ marginBottom: 0 }}>
                  <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                    <tr>
                      <th style={{ fontWeight: '600', padding: '1rem' }}>
                        <i className="bi bi-person me-2"></i>Name
                      </th>
                      <th style={{ fontWeight: '600', padding: '1rem' }}>
                        <i className="bi bi-person me-2"></i>Surname
                      </th>
                      <th style={{ fontWeight: '600', padding: '1rem' }}>
                        <i className="bi bi-envelope me-2"></i>Email
                      </th>
                      <th style={{ fontWeight: '600', padding: '1rem' }}>
                        <i className="bi bi-shield-check me-2"></i>Role
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td style={{ padding: '1rem', verticalAlign: 'middle' }}>{user.name}</td>
                        <td style={{ padding: '1rem', verticalAlign: 'middle' }}>{user.surname}</td>
                        <td style={{ padding: '1rem', verticalAlign: 'middle' }}>{user.email}</td>
                        <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                          <Dropdown>
                            <Dropdown.Toggle
                              variant="outline-primary"
                              size="sm"
                              style={{
                                minWidth: '10rem',
                                fontSize: '0.95rem',
                                borderRadius: '6px',
                                fontWeight: '500',
                                borderColor: '#5e7bb3',
                                color: '#5e7bb3'
                              }}
                            >
                              <i className="bi bi-tag me-2"></i>
                              {user.type || 'Select Role'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu
                              style={{
                                minWidth: '10rem',
                                borderRadius: '8px',
                                boxShadow: '0 0.25rem 0.5rem rgba(0,0,0,0.15)'
                              }}
                            >
                              {availableRoles.map((role) => (
                                <Dropdown.Item
                                  key={role}
                                  active={user.type === role}
                                  onClick={() => handleRoleChange(user.id, role)}
                                  style={{ 
                                    padding: '0.5rem 1rem',
                                    fontWeight: user.type === role ? '600' : '400'
                                  }}
                                >
                                  {user.type === role && <i className="bi bi-check-circle-fill me-2"></i>}
                                  {role}
                                </Dropdown.Item>
                              ))}
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
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
              <i className="bi bi-person-plus-fill me-2" style={{ WebkitTextFillColor: 'initial' }}></i>
              Add New User
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-4">
            {showSuccess && (
              <Alert variant="success" className="d-flex align-items-center">
                <i className="bi bi-check-circle-fill me-2"></i>
                Registration successful!
              </Alert>
            )}
            {apiError && (
              <Alert variant="danger" onClose={() => setApiError('')} dismissible>
                <i className="bi bi-exclamation-triangle me-2"></i>
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
              <i className="bi bi-x-circle me-2"></i>
              Cancel
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
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-person-plus-fill me-2"></i>
                  Create User
                </>
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}