import { useState } from "react";
import { Form, Button, Alert, Modal} from 'react-bootstrap';
import { Link, useNavigate} from 'react-router-dom';
import PropTypes from "prop-types";
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
      }
      else if(user?.type === 'external_maintainer') {
        navigate('/external-maintainer');
      } else {
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
        <Modal show={props.show} onHide={handleClose} centered size="md" className="login-modal">
            <Modal.Header closeButton className="login-modal-header">
                <Modal.Title className="login-modal-title">
                    <i className="bi bi-shield-lock login-modal-icon"></i>
                    <div>
                        <div>Welcome Back!</div>
                        <small className="login-modal-subtitle">
                            Sign in to continue to Participium
                        </small>
                    </div>
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="login-modal-body">
                {isPending && (
                    <Alert variant="info" className="login-alert login-alert-info d-flex align-items-center mb-3">
                        <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                        <output><strong>Authenticating...</strong></output>
                    </Alert>
                )}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)} className="login-alert login-alert-error mb-3">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <strong>{typeof error === 'string' ? error : error?.message ?? String(error)}</strong>
                  </Alert>
                )}
                <Form onSubmit={onSubmit}>
                    <Form.Group controlId='username' className='mb-3'>
                        <Form.Label className="login-form-label fw-semibold">
                            <i className="bi bi-person-fill login-form-icon me-2"></i>Username
                        </Form.Label>
                        <Form.Control 
                            type='text' 
                            name='username'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            placeholder="Enter your username"
                            className="login-form-input"
                        />
                    </Form.Group>
                    <Form.Group controlId='password' className='mb-4'>
                        <Form.Label className="login-form-label fw-semibold">
                            <i className="bi bi-lock-fill login-form-icon me-2"></i>Password
                        </Form.Label>
                        <Form.Control 
                            type='password' 
                            name='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            minLength={6}
                            placeholder="Enter your password"
                            className="login-form-input"
                        />
                    </Form.Group>
                    {/* Login Button - Full Width */}
                    <Button 
                        type='submit' 
                        variant="primary"
                        disabled={isPending}
                        className="login-submit-btn w-100 mb-3"
                    >
                        {isPending ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span><output>Signing in...</output>
                            </>
                        ) : (
                            <>
                                <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
                            </>
                        )}
                    </Button>

                    {/* Divider */}
                    <div className="login-divider d-flex align-items-center mb-3">
                        <hr className="login-divider-line" />
                        <span className="login-divider-text px-3 text-muted">or</span>
                        <hr className="login-divider-line" />
                    </div>

                    {/* Registration Section */}
                    <div className="text-center">
                        <p className="login-register-text mb-2 text-muted">
                            Don't have an account?
                        </p>
                        <Button
                            as={Link}
                            to="/registration"
                            variant="outline-primary"
                            className="login-register-btn w-100"
                            onClick={handleClose}
                        >
                            <i className="bi bi-person-plus-fill me-2"></i>Create New Account
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

LoginModal.propTypes = {
  show: PropTypes.bool.isRequired,
  onHide: PropTypes.func,
  handleLogin: PropTypes.func,
  setMessage: PropTypes.func,
};

function LogoutButton(props) {
  return (
    <Button 
      variant='outline-danger' 
      onClick={props.handleLogout}
      className="logout-button d-flex align-items-center my-2 my-lg-0"
    >
      <i className="bi bi-box-arrow-right me-2"></i>Logout
    </Button>
  );
}

LogoutButton.propTypes = {
  handleLogout: PropTypes.func,
};

export { LogoutButton, LoginModal };