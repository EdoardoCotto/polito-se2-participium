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
        <Modal show={props.show} onHide={props.onHide} centered>
            <Modal.Header closeButton style={{ borderBottom: '2px solid #f0f0f0', padding: 'clamp(0.75rem, 2vw, 1rem)' }}>
                <Modal.Title style={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: 'clamp(1rem, 3vw, 1.5rem)'
                }}>
                    Welcome Back!
                </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-2 p-md-4">
                {isPending && (
                    <Alert variant="info" className="d-flex align-items-center">
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Authenticating...
                    </Alert>
                )}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {typeof error === 'string' ? error : error?.message ?? String(error)}
                  </Alert>
                )}
                <Form onSubmit={onSubmit}>
                    <Form.Group controlId='username' className='mb-3'>
                        <Form.Label className="fw-semibold">
                            <i className="bi bi-person me-2"></i>Username
                        </Form.Label>
                        <Form.Control 
                            type='text' 
                            name='username'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            placeholder="Enter your username"
                            style={{ borderRadius: '8px', padding: '0.6rem' }}
                        />
                    </Form.Group>
                    <Form.Group controlId='password' className='mb-4'>
                        <Form.Label className="fw-semibold">
                            <i className="bi bi-lock me-2"></i>Password
                        </Form.Label>
                        <Form.Control 
                            type='password' 
                            name='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            minLength={6}
                            placeholder="Enter your password"
                            style={{ borderRadius: '8px', padding: '0.6rem' }}
                        />
                    </Form.Group>
                    <Modal.Footer className="d-flex justify-content-between align-items-center border-0 pt-0">
                         {/* Left: Registration CTA */}
                        <div className="d-flex flex-column align-items-start">
                        <Button
                            as={Link}
                            to="/registration"
                            variant="warning"
                            className="mb-1"
                            onClick={() => props.onHide?.()}
                            style={{ borderRadius: '8px' }}
                        >
                            <i className="bi bi-person-plus me-2"></i>
                            Register
                        </Button>
                        <small className="text-muted">Don't have an account?</small>
                        </div>

                        {/* Right: Cancel and Login buttons */}
                        <div className="d-flex align-items-center">
                        <Button 
                            variant="secondary" 
                            onClick={props.onHide}
                            disabled={isPending}
                            className="me-2"
                            style={{ borderRadius: '8px' }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type='submit' 
                            variant="primary"
                            disabled={isPending}
                            style={{ 
                                backgroundColor: '#5e7bb3', 
                                borderColor: '#5e7bb3',
                                borderRadius: '8px',
                                fontWeight: '600'
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
                                    Login
                                </>
                            )}
                        </Button>
                        </div>
                        
                    </Modal.Footer>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
function LogoutButton(props) {
  return <Button variant='primary' onClick={props.handleLogout} style={{ backgroundColor: '#5e7bb3', borderColor: '#5e7bb3' }}>
    {/*<Image
    src="http://localhost:3001/static/icons8-immettere-48.png"
    alt="Login Icon"
    height={24}
    width={24}
    className="me-2"
    />*/}
    Logout</Button>;
}
export { LogoutButton, LoginModal };