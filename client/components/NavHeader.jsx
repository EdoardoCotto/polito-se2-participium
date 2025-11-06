
import { Button, Navbar, Image, Nav } from 'react-bootstrap';
import { Link } from 'react-router';
import { LogoutButton } from './AuthComponents';
function NavHeader(props) {
  return (
    <Navbar bg="light" expand="lg" className="shadow-sm mb-4 w-100 ps-4 pe-4">
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
          {props.loggedIn ? (
            <Nav className="align-items-center">
              <div className="d-flex align-items-center me-3">
                {/*<Image
                  src="http://localhost:3001/static/user.png"
                  alt="User Icon"
                  height={24}
                  width={24}
                  className="me-2"
                />*/}
                <span className="fw-medium text-secondary">{props.user.username}</span>
              </div>
              <LogoutButton handleLogout={props.handleLogout}/>
            </Nav>
          ) : (
            <Button
              variant="primary"
              onClick={props.onShowLogin}//LoginForm
              className="d-flex align-items-center"
            >
                {/*<Image
                  src="http://localhost:3001/static/icons8-immettere-48.png"
                  alt="Login Icon"
                  height={32}
                  width={32}
                />*/}
              Login
            </Button>
          )}
        </Navbar.Collapse>
    </Navbar>
  );
}
export default NavHeader;
