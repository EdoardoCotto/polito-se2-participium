import "bootstrap/dist/css/bootstrap.min.css";

import { Routes, Route , useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
import DefaultLayout from "./components/DefaultLayout";
import Body from "./components/Body";
import { LoginModal } from "./components/AuthComponents";
import './components/styles/App.css'
import NotFound from "./components/NotFound";
import Registration from "./components/Registration.jsx";
import AdminPage from "./components/AdminPage.jsx";
import MunicipalityPage from "./components/MunicipalityPage.jsx";
import API from "./API/API.js";
function App() {
    const navigate = useNavigate();
    const [loggedIn, setLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [user, setUser] = useState(null);

    const [message, setMessage] = useState('');

    useEffect(() => {
    const checkAuth = async () => {
    try { 
      const user = await API.getCurrentUser();
      setLoggedIn(true);
      setUser(user);
    } catch (error) {
      // User not authenticated, this is expected on first load
      setLoggedIn(false);
      setUser(null);
    }
  };
  checkAuth();
}, []);

    console.log('App rendering 1, loggedIn:', loggedIn, 'user:', user);

  const handleLogin = async (credentials) => {
    try {
      const user = await API.login(credentials);
      setLoggedIn(true);
      setUser(user);
      return user;
    }catch(err) {
      const text = err?.message ?? String(err);
      setMessage({ msg: text, type: 'danger' });
      throw err;
    }
  };
  console.log('App rendering 2, loggedIn:', loggedIn, 'user:', user);

  const handleLogout = async () => {
    await API.logout();
    setLoggedIn(false);
    navigate('/');
    // clean up everything
    setMessage('');
  };

    // Handlers to show/hide login modal
    const handleShowLogin = () => setShowLoginModal(true);
    const handleHideLogin = () => setShowLoginModal(false);

    return (
    <>
    <Routes>
      <Route element={ <DefaultLayout loggedIn={loggedIn} user={user} message={message} setMessage={setMessage} handleLogout={handleLogout} onShowLogin={handleShowLogin}/> }>
       <Route path="/" element={ <Body loggedIn={loggedIn} onShowLogin={handleShowLogin}/> }></Route>
       <Route path="/registration" element={ <Registration/> } />
       <Route path="/admin" element={ <AdminPage user={user} handleLogin={handleLogin} handleLogout={handleLogout} /> } />
       <Route path="/municipality" element={ <MunicipalityPage user={user} /> } />
       {
       <Route path="*" element={ <NotFound /> } />
       }
      </Route>
      
    </Routes>
    <LoginModal 
        show={showLoginModal}
        onHide={handleHideLogin}
        handleLogin={handleLogin}
        user={user}/>
    </>
  )
}
export default App