import "bootstrap/dist/css/bootstrap.min.css";

import { Routes, Route , useNavigate} from "react-router-dom";
import { useEffect, useState } from "react";
import DefaultLayout from "./components/DefaultLayout";
import Body from "./components/Body";
import { LoginModal } from "./components/AuthComponents";
import './components/styles/App.css'
import NotFound from "./components/NotFound";
import Registration from "./components/Registration.jsx";
import ConfirmRegistration from "./components/ConfirmRegistration.jsx";
import AdminPage from "./components/AdminPage.jsx";
import MunicipalityPage from "./components/MunicipalityPage.jsx";
import CitizenPage from "./components/CitizenPage.jsx";
import PublicRelationsOfficer from "./components/PublicRelationsOfficer.jsx";
import ExternalMaintainer from "./components/ExternalMaintainers.jsx";
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
      
      // Auto-redirect based on user type if on home page
      const currentPath = globalThis.location.pathname;
      if (currentPath === '/') {
        if (user?.type === 'admin') {
          navigate('/admin');
        } else if (user?.type === 'citizen') {
          navigate('/citizen');
        } else if (user?.type === 'external_maintainer') {
          navigate('/external-maintainer');
        }else if (user?.type) {
          // All other municipality roles
          navigate('/municipality');
        }
      }
    } catch (error) {
      // User not authenticated, this is expected on first load
      console.debug('Auth check failed:', error.message || error);
      setLoggedIn(false);
      setUser(null);
    }
  };
  checkAuth();
}, [navigate]);

  

  const handleLogin = async (credentials) => {
    try {
      const user = await API.login(credentials);
      setLoggedIn(true);
      setUser(user);
      return user;
    } catch(err) {
      const text = err?.message ?? String(err);
      setMessage({ msg: text, type: 'danger' });
      throw err;
    }
  };

  const handleLogout = async () => {
    await API.logout();
    setLoggedIn(false);
    navigate('/');
    // clean up everything
    setMessage('');
  };

  const handleProfileUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

    // Handlers to show/hide login modal
    const handleShowLogin = () => setShowLoginModal(true);
    const handleHideLogin = () => setShowLoginModal(false);

    return (
    <>
    <Routes>
      <Route element={ <DefaultLayout loggedIn={loggedIn} user={user} message={message} setMessage={setMessage} handleLogout={handleLogout} onShowLogin={handleShowLogin} onProfileUpdate={handleProfileUpdate}/> }>
       <Route path="/" element={ <Body loggedIn={loggedIn} onShowLogin={handleShowLogin}/> }></Route>
       <Route path="/registration" element={ <Registration/> } />
       <Route path="/confirm-registration" element={ <ConfirmRegistration/> } />
       <Route path="/admin" element={ <AdminPage user={user} handleLogin={handleLogin} handleLogout={handleLogout} /> } />
       <Route path="/public-relations-officer" element={ <PublicRelationsOfficer user={user} handleLogin={handleLogin} handleLogout={handleLogout}/> } />
       <Route path="/municipality" element={ <MunicipalityPage user={user}handleLogin={handleLogin} handleLogout={handleLogout} /> } />
       <Route path="/citizen" element={ <CitizenPage user={user} handleLogin={handleLogin} handleLogout={handleLogout} /> } />
       <Route path="/external-maintainer" element={ <ExternalMaintainer user={user} handleLogin={handleLogin} handleLogout={handleLogout} /> } />
       {
       <Route path="*" element={ <NotFound /> } />
       }
      </Route>
      
    </Routes>
    <LoginModal 
        show={showLoginModal}
        onHide={handleHideLogin}
        handleLogin={handleLogin}
        setMessage={setMessage}
        user={user}/>
    </>
  )
}
export default App