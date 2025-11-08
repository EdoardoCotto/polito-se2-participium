import 'bootstrap-icons/font/bootstrap-icons.css';
import { Button, Navbar, Image, Nav } from 'react-bootstrap';
import { Link , useLocation} from 'react-router-dom';
import { LogoutButton } from './AuthComponents';
function NavHeader(props) {
  const location = useLocation();
  const hideLogin = location.pathname === '/registration' || location.pathname.startsWith('/registration/');
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm  w-100 ps-4 pe-4">
        <Navbar.Brand as={Link} to="/" className="ps-4 d-flex align-items-center text-decoration-none">
          <Image
            src="http://localhost:3001/static/mapIcon.png"
            alt="Map Icon"
            height={40}
            width={40}
            rounded
            className="me-2"
          />
          <span className="fw-bold text-primary">Participium</span>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav" className="justify-content-end">
          {props.loggedIn && props.user ? (
            <Nav className="align-items-center">
              <div className="d-flex align-items-center me-3">
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
              className="d-flex align-items-center"
            >
                <i className="bi bi-box-arrow-in-right fs-4 me-2"></i>
              Login
            </Button>
            )
          )}
        </Navbar.Collapse>
    </Navbar>
  );
}
export default NavHeader;
