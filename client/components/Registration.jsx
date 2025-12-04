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
      newErrors.password = 'Pass' + 'word is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Pass' + 'word must be at least 8 characters long';
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
    <Container fluid className="py-2 py-md-5 px-2 px-md-3">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <Card className="register-card shadow-lg">
            <Card.Body className="register-card-body p-4 p-md-5">
              <div className="register-header text-center mb-4">
                <div className="register-icon-wrapper mb-3">
                  <i className="bi bi-person-plus-fill register-header-icon"></i>
                </div>
                <h2 className="register-title">
                  Join Participium
                </h2>
                <p className="register-subtitle">Create your account to start participating</p>
              </div>
              
              {showSuccess && (
                <Alert variant="success" onClose={() => setShowSuccess(false)} dismissible className="register-alert register-alert-success d-flex align-items-center mb-3">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  <strong>Registration successful! Redirecting...</strong>
                </Alert>
              )}

              {apiError && (
                <Alert variant="danger" onClose={() => setApiError('')} dismissible className="register-alert register-alert-error mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>{typeof apiError === 'string' ? apiError : apiError?.message ?? String(apiError)}</strong>
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="register-form-label fw-semibold">
                        <i className="bi bi-person register-form-icon me-2"></i>First Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        isInvalid={!!errors.firstName}
                        placeholder="Enter your first name"
                        className="register-form-input"
                      />
                      <Form.Control.Feedback type="invalid" className="register-feedback">
                        {errors.firstName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>

                  <Col xs={12} md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="register-form-label fw-semibold">
                        <i className="bi bi-person register-form-icon me-2"></i>Last Name
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        isInvalid={!!errors.lastName}
                        placeholder="Enter your last name"
                        className="register-form-input"
                      />
                      <Form.Control.Feedback type="invalid" className="register-feedback">
                        {errors.lastName}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="register-form-label fw-semibold">
                    <i className="bi bi-at register-form-icon me-2"></i>Username
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    isInvalid={!!errors.userName}
                    placeholder="Choose a username"
                    className="register-form-input"
                  />
                  <Form.Control.Feedback type="invalid" className="register-feedback">
                    {errors.userName}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="register-form-label fw-semibold">
                    <i className="bi bi-envelope register-form-icon me-2"></i>Email
                  </Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={!!errors.email}
                    placeholder="Enter your email address"
                    className="register-form-input"
                  />
                  <Form.Control.Feedback type="invalid" className="register-feedback">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="register-form-label fw-semibold">
                    <i className="bi bi-lock register-form-icon me-2"></i>Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={!!errors.password}
                    placeholder="Create a password (min. 8 characters)"
                    className="register-form-input"
                  />
                  <Form.Control.Feedback type="invalid" className="register-feedback">
                    {errors.password}
                  </Form.Control.Feedback>
                  <Form.Text className="register-help-text text-muted">
                    <i className="bi bi-info-circle me-1"></i>Password must be at least 8 characters long
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="register-form-label fw-semibold">
                    <i className="bi bi-shield-lock register-form-icon me-2"></i>Confirm Password
                  </Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    isInvalid={!!errors.confirmPassword}
                    placeholder="Re-enter your password"
                    className="register-form-input"
                  />
                  <Form.Control.Feedback type="invalid" className="register-feedback">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>
                <div className="register-actions d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    size="lg"
                    disabled={isSubmitting}
                    className="register-submit-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span><output>Creating your account...</output>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus-fill me-2"></i><output>Create Account</output>
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="lg"
                    disabled={isSubmitting}
                    onClick={() => navigate('/')}
                    className="register-back-btn"
                  >
                    <i className="bi bi-arrow-left me-2"></i>Back to Login
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