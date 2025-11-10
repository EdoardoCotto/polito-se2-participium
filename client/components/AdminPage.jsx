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
              fontWeight: 'bold',
              boxShadow: '0 0.25rem 0.5rem rgba(0,0,0,0.3)',
              border: '2px solid #0d6efd'
            }}
          >
            Registration municipality user
          </Button>
        </div>
      </div>

      {/* Users Table Card - Centered */}
      <div className="d-flex justify-content-center align-items-start flex-grow-1 p-4 mt-5">
        <Card style={{ 
          width: '50%', 
          maxWidth: '75rem', 
          boxShadow: '0 0.25rem 0.75rem rgba(0,0,0,0.15)', 
          minHeight: '70vh',
          overflow: 'visible' // Leave space for dropdowns
        }}>
          <Card.Header as="h4" className="bg-primary text-white">
            Users Management
          </Card.Header>
          <Card.Body style={{ 
            minHeight: '50vh', 
            paddingBottom: '1rem',
            overflow: 'visible' // Leave space for dropdowns
          }}>
            {usersError && (
              <Alert variant="danger" dismissible onClose={() => setUsersError('')}>
                {usersError}
              </Alert>
            )}

            {isLoadingUsers ? (
              <div className="text-center p-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : users.length === 0 ? (
              <Alert variant="info">No users found</Alert>
            ) : (
              <div style={{ overflow: 'visible' }}>
                <Table striped bordered hover>
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Surname</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.surname}</td>
                        <td>{user.email}</td>
                        <td>
                          <Dropdown>
                            <Dropdown.Toggle
                              variant="outline-secondary"
                              size="lg"
                              style={{
                                minWidth: '8rem',
                                fontSize: '1rem'
                              }}
                            >
                              {user.type || 'Select Role'}
                            </Dropdown.Toggle>
                            <Dropdown.Menu
                              style={{
                                minWidth: '8rem'
                              }}
                            >
                              {availableRoles.map((role) => (
                                <Dropdown.Item
                                  key={role}
                                  active={user.type === role}
                                  onClick={() => handleRoleChange(user.id, role)}
                                  style={{ padding: '0.2rem 0.2rem' }}
                                >
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
          <Modal.Header closeButton>
            <Modal.Title>Registration</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {showSuccess && <Alert variant="success">Registration successful!</Alert>}
            {apiError && (
              <Alert variant="danger" onClose={() => setApiError('')} dismissible>
                {typeof apiError === 'string' ? apiError : apiError?.message ?? String(apiError)}
              </Alert>
            )}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    isInvalid={!!errors.firstName}
                    placeholder="First name"
                  />
                  <Form.Control.Feedback type="invalid">{errors.firstName}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    isInvalid={!!errors.lastName}
                    placeholder="Last name"
                  />
                  <Form.Control.Feedback type="invalid">{errors.lastName}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                isInvalid={!!errors.userName}
                placeholder="Username"
              />
              <Form.Control.Feedback type="invalid">{errors.userName}</Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                isInvalid={!!errors.email}
                placeholder="Email"
              />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!errors.password}
                    placeholder="Password"
                  />
                  <Form.Control.Feedback type="invalid">{errors.password}</Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.confirmPassword}
                    placeholder="Confirm password"
                  />
                  <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-between align-items-center w-100">
            <div>
              <Button variant="secondary" onClick={() => setShowModal(false)} disabled={isSubmitting}>Close</Button>
            </div>
            <div>
              <Button variant="primary" type="submit" disabled={isSubmitting} className="me-2">
                {isSubmitting ? 'Registering...' : 'Register'}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}