import { useState } from "react";
import { Form, Button, Alert, Modal} from 'react-bootstrap';
import { Link, useNavigate} from 'react-router-dom';
// Modal di Login
function LoginModal(props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Reset error when closing the modal
  const handleClose = () => {
    setError(null);
    props.onHide?.();
  };


  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const credentials = { username, password };

    try {
      const user = await props.handleLogin?.(credentials);
      // success
      setUsername('');
      setPassword('');
      setIsPending(false);
      props.setMessage?.({ type: 'success', msg: 'Login effettuato' });
      handleClose();

      
      // Navigate based on user type
      if (user?.type === 'admin') {
        navigate('/admin');
      } else if (user?.type === 'citizen') {
        navigate('/citizen');
      } 
      else if (user?.type === 'municipal_public_relations_officer') {
        navigate('/public-relations-officer');
      }else {
        // All other municipality roles go to municipality page
        navigate('/municipality');
      }
    } catch (err) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Login failed. Check your credentials.';
      setError(msg);
      setIsPending(false);
    }
  }

    return (
        <Modal show={props.show} onHide={handleClose} centered size="md">
            <Modal.Header closeButton style={{ 
                background: 'linear-gradient(135deg, #5e7bb3 0%, #4a6399 100%)',
                color: 'white',
                borderBottom: 'none',
                padding: '1.5rem',
                borderTopLeftRadius: '0.5rem',
                borderTopRightRadius: '0.5rem'
            }}>
                <Modal.Title style={{ 
                    fontWeight: '700',
                    fontSize: '1.75rem',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <i className="bi bi-shield-lock me-3" style={{ fontSize: '2rem' }}></i>
                    <div>
                        <div>Welcome Back!</div>
                        <small style={{ fontSize: '0.875rem', fontWeight: '400', opacity: 0.9 }}>
                            Sign in to continue to Participium
                        </small>
                    </div>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-4" style={{ backgroundColor: '#fafbfc' }}>
                {isPending && (
                    <Alert variant="info" className="d-flex align-items-center mb-3" style={{ 
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#d1ecf1',
                        color: '#0c5460'
                    }}>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        <strong>Authenticating...</strong>
                    </Alert>
                )}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3" style={{
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#f8d7da',
                    color: '#721c24'
                  }}>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>{typeof error === 'string' ? error : error?.message ?? String(error)}</strong>
                  </Alert>
                )}
                <Form onSubmit={onSubmit}>
                    <Form.Group controlId='username' className='mb-3'>
                        <Form.Label className="fw-semibold" style={{ fontSize: '0.95rem', color: '#495057' }}>
                            <i className="bi bi-person-fill me-2" style={{ color: '#5e7bb3' }}></i>
                            Username
                        </Form.Label>
                        <Form.Control 
                            type='text' 
                            name='username'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            placeholder="Enter your username"
                            style={{ 
                                borderRadius: '10px', 
                                padding: '0.75rem 1rem', 
                                fontSize: '1rem',
                                border: '2px solid #e0e6ed',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#5e7bb3';
                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(94, 123, 179, 0.15)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e0e6ed';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </Form.Group>
                    <Form.Group controlId='password' className='mb-4'>
                        <Form.Label className="fw-semibold" style={{ fontSize: '0.95rem', color: '#495057' }}>
                            <i className="bi bi-lock-fill me-2" style={{ color: '#5e7bb3' }}></i>
                            Password
                        </Form.Label>
                        <Form.Control 
                            type='password' 
                            name='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            minLength={6}
                            placeholder="Enter your password"
                            style={{ 
                                borderRadius: '10px', 
                                padding: '0.75rem 1rem', 
                                fontSize: '1rem',
                                border: '2px solid #e0e6ed',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.2s ease'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#5e7bb3';
                                e.target.style.boxShadow = '0 0 0 0.2rem rgba(94, 123, 179, 0.15)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#e0e6ed';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </Form.Group>
                    {/* Login Button - Full Width */}
                    <Button 
                        type='submit' 
                        variant="primary"
                        disabled={isPending}
                        className="w-100 mb-3"
                        style={{ 
                            backgroundColor: '#5e7bb3', 
                            borderColor: '#5e7bb3',
                            borderRadius: '10px',
                            fontWeight: '600',
                            fontSize: '1rem',
                            padding: '0.75rem 1.5rem',
                            boxShadow: '0 4px 12px rgba(94, 123, 179, 0.3)',
                            transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            if (!isPending) {
                                e.currentTarget.style.backgroundColor = '#4a6399';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 6px 16px rgba(94, 123, 179, 0.4)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#5e7bb3';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 123, 179, 0.3)';
                        }}
                    >
                        {isPending ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Signing in...
                            </>
                        ) : (
                            <>
                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                Sign In
                            </>
                        )}
                    </Button>

                    {/* Divider */}
                    <div className="d-flex align-items-center mb-3">
                        <hr style={{ flex: 1, borderTop: '1px solid #dee2e6' }} />
                        <span className="px-3 text-muted" style={{ fontSize: '0.875rem' }}>or</span>
                        <hr style={{ flex: 1, borderTop: '1px solid #dee2e6' }} />
                    </div>

                    {/* Registration Section */}
                    <div className="text-center">
                        <p className="mb-2 text-muted" style={{ fontSize: '0.95rem' }}>
                            Don't have an account?
                        </p>
                        <Button
                            as={Link}
                            to="/registration"
                            variant="outline-primary"
                            className="w-100"
                            onClick={handleClose}
                            style={{ 
                                borderRadius: '10px',
                                fontSize: '1rem',
                                padding: '0.75rem 1.5rem',
                                fontWeight: '600',
                                borderColor: '#5e7bb3',
                                borderWidth: '2px',
                                color: '#5e7bb3',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#5e7bb3';
                                e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = '#5e7bb3';
                            }}
                        >
                            <i className="bi bi-person-plus-fill me-2"></i>
                            Create New Account
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
function LogoutButton(props) {
  return (
    <Button 
      variant='primary' 
      onClick={props.handleLogout}
      className="d-flex align-items-center"
      style={{ 
        backgroundColor: '#5e7bb3', 
        borderColor: '#5e7bb3',
        borderRadius: '8px',
        fontWeight: '600',
        padding: '0.5rem 1.25rem',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 6px rgba(94, 123, 179, 0.2)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#4a6399';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 4px 10px rgba(94, 123, 179, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#5e7bb3';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 6px rgba(94, 123, 179, 0.2)';
      }}
    >
      <i className="bi bi-box-arrow-right me-2"></i>
      Logout
    </Button>
  );
}
export { LogoutButton, LoginModal };