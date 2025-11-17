import 'bootstrap-icons/font/bootstrap-icons.css';
import { Button, Navbar, Image, Nav } from 'react-bootstrap';
import { Link , useLocation} from 'react-router-dom';
import { LogoutButton } from './AuthComponents';
function NavHeader(props) {
  const location = useLocation();
  const hideLogin = location.pathname === '/registration' || location.pathname.startsWith('/registration/');
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm w-100 ps-2 ps-md-4 pe-2 pe-md-4">
        <Navbar.Brand as={Link} to="/" className="ps-1 ps-md-4 d-flex align-items-center text-decoration-none">
          {/* Participium Brand */}
          <Image
            src="http://localhost:3001/static/mapIcon.png"
            alt="Map Icon"
            height={40}
            width={40}
            rounded
            className="me-2"
          />
          <span className="fw-bold" style={{ 
            background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)'
          }}>Participium</span>
          
          {/* Vertical Divider - Hidden on mobile */}
          <div 
            className="mx-2 mx-md-3 d-none d-md-block" 
            style={{ 
              width: '2px', 
              height: '40px', 
              backgroundColor: '#dee2e6' 
            }}
          ></div>
          
          {/* Regione Piemonte Logo - Hidden on mobile */}
          <Image
            src="http://localhost:3001/static/piemonte-logo.png"
            alt="Regione Piemonte"
            height={50}
            className="me-3 d-none d-md-block"
            style={{ objectFit: 'contain' }}
          />
          
          {/* Città di Torino Logo - Hidden on mobile */}
          <Image
            src="http://localhost:3001/static/torino-clean.png"
            alt="Città di Torino"
            height={50}
            className="d-none d-md-block"
            style={{ objectFit: 'contain' }}
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav" className="justify-content-end">
          {props.loggedIn && props.user ? (
            <Nav className="align-items-lg-center">
              <div className="d-flex align-items-center me-3 my-2 my-lg-0">
                <Image
                  src="http://localhost:3001/static/user.png"
                  alt="User Icon"
                  height={24}
                  width={24}
                  className="me-2"
                />
                <span className="fw-medium text-secondary">{props.user.username}</span>
              </div>
              <LogoutButton handleLogout={props.handleLogout}/>
            </Nav>
          ) : (
            !hideLogin &&(
            <Button
              variant="primary"
              onClick={props.onShowLogin}//LoginForm
              className="d-flex align-items-center my-2 my-lg-0"
              style={{ backgroundColor: '#5e7bb3', borderColor: '#5e7bb3' }}
            >
                <i className="bi bi-box-arrow-in-right fs-5 me-2"></i>
              Login
            </Button>
            )
          )}
        </Navbar.Collapse>
    </Navbar>
  );
}
export default NavHeader;
