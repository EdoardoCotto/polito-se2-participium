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

      console.log('User after login:', user);
      
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
            <Modal.Header closeButton>
                <Modal.Title>Insert your credentials</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {isPending && <Alert variant="warning">Please, wait for the server's response...</Alert>}
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {typeof error === 'string' ? error : error?.message ?? String(error)}
                  </Alert>
                )}
                <Form onSubmit={onSubmit}>
                    <Form.Group controlId='username' className='mb-3'>
                        <Form.Label>Username</Form.Label>
                        <Form.Control 
                            type='text' 
                            name='username'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)} 
                            required 
                            placeholder="Insert your username"
                        />
                    </Form.Group>
                    <Form.Group controlId='password' className='mb-3'>
                        <Form.Label>Password</Form.Label>
                        <Form.Control 
                            type='password' 
                            name='password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                            minLength={6}
                            placeholder="Insert your password"
                        />
                    </Form.Group>
                    <Modal.Footer className="d-flex justify-content-between align-items-center">
                         {/* Left: Registration CTA with small text */}
                        <div className="d-flex flex-column align-items-start pt-3">
                        <Button
                            as={Link}
                            to="/registration"
                            variant="warning"
                            className="mb-1"
                            onClick={() => props.onHide?.()}
                        >
                            Registration
                        </Button>
                        <small className="text-muted">Do your registration here.</small>
                        </div>

                        {/* Right: Cancel and Login buttons - aligned */}
                        <div className="d-flex align-items-center">
                        <Button 
                            variant="secondary" 
                            onClick={props.onHide}
                            disabled={isPending}
                            className="me-2"
                        >
                            Cancel
                        </Button>
                        <Button 
                            type='submit' 
                            variant="primary"
                            disabled={isPending}
                        >
                            {isPending ? 'Logging in...' : 'Login'}
                        </Button>
                        </div>
                        
                    </Modal.Footer>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
function LogoutButton(props) {
  return <Button variant='primary' onClick={props.handleLogout} >
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