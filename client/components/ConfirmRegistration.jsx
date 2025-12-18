import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../API/API.js';

export default function ConfirmRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email from registration page state, or allow manual entry
  const registrationEmail = location.state?.email || '';
  
  const [formData, setFormData] = useState({
    email: registrationEmail,
    code: ''
  });

  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [apiError, setApiError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // For code input, only allow digits and limit to 6 characters
    if (name === 'code') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 6);
      setFormData(prev => ({
        ...prev,
        [name]: digitsOnly
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Confirmation code is required';
    } else if (formData.code.length !== 6) {
      newErrors.code = 'Code must be 6 digits';
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
        await API.confirmRegistration({
          email: formData.email,
          code: formData.code
        });
        
        setShowSuccess(true);
        
        // Redirect to login after successful confirmation
        setTimeout(() => {
          navigate('/', { 
            state: { 
              message: 'Account confirmed successfully! You can now log in.',
              messageType: 'success'
            } 
          });
        }, 2000);
      } catch (error) {
        console.error('Confirmation error:', error);
        setApiError(error.message || 'Confirmation failed. Please check your code and try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email.trim()) {
      setErrors({ email: 'Please enter your email address' });
      return;
    }

    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email' });
      return;
    }

    setIsResending(true);
    setResendMessage('');
    setApiError('');
    
    try {
      await API.resendConfirmationCode({
        email: formData.email
      });
      
      setResendMessage('A new confirmation code has been sent to your email');
      setCountdown(60); // 60 second cooldown before allowing another resend
      
      // Clear the resend message after 5 seconds
      setTimeout(() => {
        setResendMessage('');
      }, 5000);
    } catch (error) {
      console.error('Resend error:', error);
      setApiError(error.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="app-root">
      <Container fluid className="py-2 py-md-5 px-2 px-md-3">
        <Row className="justify-content-center">
          <Col xs={12} md={8} lg={5}>
            <Card className="register-card shadow-lg">
              <Card.Body className="register-card-body p-4 p-md-5">
                <div className="register-header text-center mb-4">
                  <div className="register-icon-wrapper mb-3">
                    <i className="bi bi-envelope-check-fill register-header-icon"></i>
                  </div>
                  <h2 className="register-title">
                    Confirm Your Account
                  </h2>
                  <p className="register-subtitle">
                    Enter the 6-digit code sent to your email address
                  </p>
                </div>
                
                {showSuccess && (
                  <Alert variant="success" className="register-alert register-alert-success d-flex align-items-center mb-3">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <strong>Account confirmed successfully! Redirecting to login...</strong>
                  </Alert>
                )}

                {resendMessage && (
                  <Alert variant="info" className="register-alert d-flex align-items-center mb-3">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    <strong>{resendMessage}</strong>
                  </Alert>
                )}

                {apiError && (
                  <Alert variant="danger" onClose={() => setApiError('')} dismissible className="register-alert register-alert-error mb-3">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>{typeof apiError === 'string' ? apiError : apiError?.message ?? String(apiError)}</strong>
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label className="register-form-label fw-semibold">
                      <i className="bi bi-envelope register-form-icon me-2"></i>Email Address
                    </Form.Label>
                    <Form.Control
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      isInvalid={!!errors.email}
                      placeholder="Enter your email"
                      className="register-form-input"
                      disabled={!!registrationEmail} // Disable if email came from registration
                    />
                    <Form.Control.Feedback type="invalid" className="register-feedback">
                      {errors.email}
                    </Form.Control.Feedback>
                  </Form.Group>

                  <Form.Group className="mb-4">
                    <Form.Label className="register-form-label fw-semibold">
                      <i className="bi bi-shield-check register-form-icon me-2"></i>Confirmation Code
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      isInvalid={!!errors.code}
                      placeholder="Enter 6-digit code"
                      className="register-form-input text-center fs-4 letter-spacing-wide"
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete="one-time-code"
                    />
                    <Form.Control.Feedback type="invalid" className="register-feedback">
                      {errors.code}
                    </Form.Control.Feedback>
                    <Form.Text className="register-help-text text-muted d-flex align-items-center justify-content-between mt-2">
                      <span>
                        <i className="bi bi-info-circle me-1"></i>Check your email for the code
                      </span>
                      <span className="text-muted small">
                        Valid for 30 minutes
                      </span>
                    </Form.Text>
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
                          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                          <output>Confirming...</output>
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle-fill me-2"></i>
                          <output>Confirm Account</output>
                        </>
                      )}
                    </Button>

                    {/* Resend Code Section */}
                    <div className="text-center">
                      <div className="login-divider d-flex align-items-center mb-3">
                        <hr className="login-divider-line" />
                        <span className="login-divider-text px-3 text-muted">or</span>
                        <hr className="login-divider-line" />
                      </div>
                      
                      <p className="text-muted mb-2">
                        Didn't receive the code?
                      </p>
                      <Button
                        variant="primary"
                        onClick={handleResendCode}
                        disabled={isResending || countdown > 0}
                        className="w-100 resend-code-btn"
                      >
                        {isResending ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : countdown > 0 ? (
                          <>
                            <i className="bi bi-hourglass-split me-2"></i>
                            Resend Code ({countdown}s)
                          </>
                        ) : (
                          <>
                            <i className="bi bi-arrow-clockwise me-2"></i>
                            Resend Code
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Back to Login */}
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
