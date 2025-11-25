import 'bootstrap-icons/font/bootstrap-icons.css';
import { Button, Navbar, Image, Nav, Modal, Form, Alert } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { LogoutButton } from './AuthComponents';

function NavHeader(props) {
  const location = useLocation();
  const hideLogin = location.pathname === '/registration' || location.pathname.startsWith('/registration/');
  
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [telegramUser, setTelegramUser] = useState(props.user?.telegramUser || '');
  const [emailNotifications, setEmailNotifications] = useState(props.user?.emailNotifications !== false);
  const [profileImage, setProfileImage] = useState(props.user?.profileImage || null);
  const [profileImagePreview, setProfileImagePreview] = useState(props.user?.profileImage || null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Check if user is a citizen
  const isCitizen = props.user?.type === 'citizen';

  // Handle profile modal open
  const handleOpenProfile = () => {
    setTelegramUser(props.user?.telegramUser || '');
    setEmailNotifications(props.user?.emailNotifications !== false);
    setProfileImagePreview(props.user?.profileImage || null);
    setSaveError('');
    setSaveSuccess('');
    setShowProfileModal(true);
  };

  // Handle profile image change
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSaveError('Please select a valid image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSaveError('Image size must be less than 5MB');
        return;
      }
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
      setSaveError('');
    }
  };

  // Handle remove profile image
  const handleRemoveProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess('');

      // TODO: Call API to update user profile
      // const formData = new FormData();
      // formData.append('telegramUser', telegramUser);
      // formData.append('emailNotifications', emailNotifications);
      // if (profileImage) {
      //   formData.append('profileImage', profileImage);
      // }
      // await API.updateUserProfile(formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSaveSuccess('Profile updated successfully!');
      
      // Update parent component user state if callback provided
      if (props.onProfileUpdate) {
        props.onProfileUpdate({
          ...props.user,
          telegramUser,
          emailNotifications,
          profileImage: profileImagePreview
        });
      }

      setTimeout(() => {
        setShowProfileModal(false);
      }, 1500);

    } catch (err) {
      setSaveError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
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
              {/* Profile Button (only for citizens) */}
              {isCitizen && (
                <Button
                  variant="outline-primary"
                  onClick={handleOpenProfile}
                  className="d-flex align-items-center me-2 me-lg-3 my-2 my-lg-0"
                  style={{ 
                    borderRadius: '8px',
                    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                    padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                    borderColor: '#5e7bb3',
                    color: '#5e7bb3',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5e7bb3';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#5e7bb3';
                  }}
                >
                  <Image
                    src={profileImagePreview || "http://localhost:3001/static/user.png"}
                    alt="User Icon"
                    height={24}
                    width={24}
                    roundedCircle
                    className="me-2"
                    style={{ objectFit: 'cover' }}
                  />
                  <span className="d-none d-md-inline">{props.user.username}</span>
                  <i className="bi bi-chevron-down ms-2" style={{ fontSize: '0.8em' }}></i>
                </Button>
              )}

              {/* Username display (for non-citizens) */}
              {!isCitizen && (
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
              )}

              <LogoutButton handleLogout={props.handleLogout}/>
            </Nav>
          ) : (
            !hideLogin && (
              <Button
                variant="primary"
                onClick={props.onShowLogin}
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

      {/* Profile Settings Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered size="md">
        <Modal.Header closeButton style={{ backgroundColor: '#5e7bb3', color: 'white' }}>
          <Modal.Title style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
            <i className="bi bi-person-circle me-2"></i>
            Profile Settings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          {saveError && (
            <Alert variant="danger" dismissible onClose={() => setSaveError('')}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {saveError}
            </Alert>
          )}
          {saveSuccess && (
            <Alert variant="success">
              <i className="bi bi-check-circle me-2"></i>
              {saveSuccess}
            </Alert>
          )}

          <Form>
            {/* Profile Image Section */}
            <Form.Group className="mb-4 text-center">
              <Form.Label className="fw-semibold d-block mb-3" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>
                <i className="bi bi-image me-2"></i>Profile Picture
              </Form.Label>
              <div className="d-flex flex-column align-items-center">
                <Image
                  src={profileImagePreview || "http://localhost:3001/static/user.png"}
                  alt="Profile"
                  width={120}
                  height={120}
                  roundedCircle
                  className="mb-3"
                  style={{ 
                    objectFit: 'cover',
                    border: '3px solid #5e7bb3',
                    boxShadow: '0 0.25rem 0.5rem rgba(0,0,0,0.1)'
                  }}
                />
                <div className="d-flex gap-2">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    style={{ display: 'none' }}
                    id="profile-image-upload"
                  />
                  <label htmlFor="profile-image-upload">
                    <Button
                      as="span"
                      variant="outline-primary"
                      size="sm"
                      style={{ borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <i className="bi bi-upload me-2"></i>
                      Upload
                    </Button>
                  </label>
                  {profileImagePreview && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleRemoveProfileImage}
                      style={{ borderRadius: '8px' }}
                    >
                      <i className="bi bi-trash me-2"></i>
                      Remove
                    </Button>
                  )}
                </div>
                <small className="text-muted mt-2">Max 5MB - JPG, PNG, GIF</small>
              </div>
            </Form.Group>

            {/* Telegram Username */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                <i className="bi bi-telegram me-2 text-primary"></i>Telegram Username
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="@username"
                value={telegramUser}
                onChange={(e) => setTelegramUser(e.target.value)}
                style={{ 
                  borderRadius: '8px',
                  fontSize: 'clamp(0.85rem, 2vw, 0.95rem)',
                  padding: 'clamp(0.5rem, 1.5vw, 0.75rem)'
                }}
              />
              <Form.Text className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Link your Telegram to receive notifications (optional)
              </Form.Text>
            </Form.Group>

            {/* User Info Display */}
            <div className="mt-4 p-3 bg-light rounded" style={{ border: '1px solid #dee2e6' }}>
              <h6 className="mb-3" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                <i className="bi bi-person-vcard me-2"></i>Account Information
              </h6>
              <div className="mb-2">
                <small className="text-muted">Name:</small>
                <div className="fw-medium">{props.user?.name} {props.user?.surname}</div>
              </div>
              <div className="mb-2">
                <small className="text-muted">Username:</small>
                <div className="fw-medium">{props.user?.username}</div>
              </div>
              <div>
                <small className="text-muted">Email:</small>
                <div className="fw-medium">{props.user?.email || 'Not provided'}</div>
              </div>
            </div>

            {/* Email Notifications Toggle - MOVED TO BOTTOM */}
            <Form.Group className="mt-4 mb-0">
              <div 
                className="p-3 rounded" 
                style={{ 
                  backgroundColor: emailNotifications ? '#e8f0ff' : '#f8f9fa',
                  border: `1px solid ${emailNotifications ? '#5e7bb3' : '#dee2e6'}`,
                  transition: 'all 0.3s ease'
                }}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <i 
                      className={`bi ${emailNotifications ? 'bi-envelope-check' : 'bi-envelope-slash'} me-3`}
                      style={{ 
                        fontSize: '1.5rem', 
                        color: emailNotifications ? '#5e7bb3' : '#6c757d' 
                      }}
                    ></i>
                    <div>
                      <strong style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                        Email Notifications
                      </strong>
                      <div style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)' }} className="text-muted">
                        {emailNotifications 
                          ? 'You will receive email updates' 
                          : 'Email notifications are disabled'}
                      </div>
                    </div>
                  </div>
                  <Form.Check 
                    type="switch"
                    id="email-notifications-switch"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    style={{ transform: 'scale(1.3)' }}
                  />
                </div>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => setShowProfileModal(false)}
            style={{ borderRadius: '8px' }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveProfile}
            disabled={saving}
            style={{ 
              backgroundColor: '#5e7bb3', 
              borderColor: '#5e7bb3',
              borderRadius: '8px'
            }}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                Save Changes
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default NavHeader;
