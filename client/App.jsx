import "bootstrap/dist/css/bootstrap.min.css";

import { Routes, Route , Navigate} from "react-router";
import { useEffect, useState } from "react";
import DefaultLayout from "./components/DefaultLayout";
import Body from "./components/Body";
import { LoginModal } from "./components/AuthComponents";
import './App.css'
import NotFound from "./components/NotFound";
import Registration from "./components/Registration.jsx";
import API from "./API/API.js";
function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
  const checkAuth = async () => {
    try { 
      const user = await API.getCurrentUser();
      setLoggedIn(true);
      setUser(user);
    } catch (error) {
      setLoggedIn(false);
      setUser(null);
    }
  };
  checkAuth();
}, []);

  const handleLogin = async (credentials) => {
    try {
      const user = await API.login(credentials);
      setLoggedIn(true);
      setMessage({msg: `Welcome, ${user.name}!`, type: 'success'});
      setUser(user);
    }catch(err) {
      setMessage({msg: err, type: 'danger'});
    }
  };

  const handleLogout = async () => {
    await API.logout();
    setLoggedIn(false);
    // clean up everything
    setMessage('');
  };

    // Handlers to show/hide login modal
    const handleShowLogin = () => setShowLoginModal(true);
    const handleHideLogin = () => setShowLoginModal(false);

    return (
    <>
    <Routes>
      <Route element={ <DefaultLayout loggedIn={loggedIn} handleLogout={handleLogout} onShowLogin={handleShowLogin}/> }>
       <Route path="/" element={ <Body loggedIn={loggedIn} onShowLogin={handleShowLogin}/> }></Route>
       <Route path="/registration" element={ <Registration/> } />
       {
       <Route path="*" element={ <NotFound /> } />
       }
      </Route>
      
    </Routes>
    <LoginModal 
        show={showLoginModal}
        onHide={handleHideLogin}
        handleLogin={handleLogin}/>
    </>
  )
}
export default App