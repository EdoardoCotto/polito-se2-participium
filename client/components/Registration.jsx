import { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import API from '../API/API.js';

export default function RegistrationPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error message on input change
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};


    if (!formData.firstName.trim()) {
      newErrors.firstName = 'The first name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'The last name is required';
    }

    if (!formData.userName.trim()) {
      newErrors.userName = 'The username is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'The email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      setApiError('');
      
      try {
        // Map form data to backend expected format
        const userData = {
          username: formData.userName,
          email: formData.email,
          name: formData.firstName,
          surname: formData.lastName,
          password: formData.password
        };
        
        // Call API to register user
        await API.register(userData);
        
        setShowSuccess(true);
        console.log('Registration successful:', userData);
        
        // Reset form and redirect after successful submission
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
          navigate('/'); // Redirect to home page
        }, 2000);
      } catch (error) {
        console.error('Registration error:', error);
        setApiError(error.message || 'Registration failed. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="app-root">
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-lg" style={{ borderRadius: '1rem', border: 'none' }}>
            <Card.Body className="p-5">
              <h2 className="text-center mb-2" style={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontSize: '2.5rem'
              }}>
                Join Participium
              </h2>
              <p className="text-center text-muted mb-4">Create your account to start participating</p>
              
              {showSuccess && (
                <Alert variant="success" onClose={() => setShowSuccess(false)} dismissible className="d-flex align-items-center">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Registration successful! Redirecting...
                </Alert>
              )}

              {apiError && (
                <Alert variant="danger" onClose={() => setApiError('')} dismissible>
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  {typeof apiError === 'string' ? apiError : apiError?.message ?? String(apiError)}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
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
                        placeholder="Enter your first name"
                        style={{ borderRadius: '8px', padding: '0.6rem' }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.firstName}
                      </Form.Control.Feedback>
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
                        placeholder="Enter your last name"
                        style={{ borderRadius: '8px', padding: '0.6rem' }}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.lastName}
                      </Form.Control.Feedback>
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
                  <Form.Control.Feedback type="invalid">
                    {errors.userName}
                  </Form.Control.Feedback>
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
                    placeholder="Enter your email address"
                    style={{ borderRadius: '8px', padding: '0.6rem' }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

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
                    placeholder="Create a password (min. 8 characters)"
                    style={{ borderRadius: '8px', padding: '0.6rem' }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    Password must be at least 8 characters long
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">
                    <i className="bi bi-shield-lock me-2"></i>Confirm Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.confirmPassword}
                    placeholder="Re-enter your password"
                    style={{ borderRadius: '8px', padding: '0.6rem' }}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg"
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
                        Creating your account...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus-fill me-2"></i>
                        Create Account
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="lg"
                    disabled={isSubmitting}
                    onClick={() => navigate('/')}
                    style={{ borderRadius: '8px' }}
                  >
                    <i className="bi bi-arrow-left me-2"></i>
                    Back to Login
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </div>
  );
}