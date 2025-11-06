import {Alert, Row} from "react-bootstrap";
import NavHeader from "./NavHeader";
import Footer from "./Footer";
import { Outlet} from "react-router";
function DefaultLayout(props) {
  return (
    <div className="d-flex flex-column min-vh-100 w-100 ">
      <NavHeader  loggedIn={props.loggedIn} user={props.user} onShowLogin={props.onShowLogin} handleLogout={props.handleLogout}/>
      {props.message && <Row>
        <Alert variant={props.message.type} onClose={() => props.setMessage('')} dismissible>
          {props.message.msg}
        </Alert>
      </Row>}
      <div className="flex-grow-1 w-100">
        <Outlet />
      </div>
      <div className=" w-100">
        <Footer />
      </div>
    </div>
  );
}
export default DefaultLayout;