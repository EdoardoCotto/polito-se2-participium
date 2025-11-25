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
      <Navbar expand="lg" className="navbar-modern w-100 ps-2 ps-md-4 pe-2 pe-md-4">
        <Navbar.Brand as={Link} to="/" className="ps-1 ps-md-4 d-flex align-items-center text-decoration-none">
          {/* Participium Brand */}
          <Image
            src="http://localhost:3001/static/mapIcon.png"
            alt="Map Icon"
            className="navbar-brand-logo me-2"
            rounded
          />
          <span className="navbar-brand-text">Participium</span>
          
          {/* Vertical Divider - Hidden on mobile */}
          <div className="navbar-brand-divider mx-2 mx-md-3 d-none d-md-block"></div>
          
          {/* Regione Piemonte Logo - Hidden on mobile */}
          <Image
            src="http://localhost:3001/static/piemonte-logo.png"
            alt="Regione Piemonte"
            className="navbar-brand-logo-partner me-3 d-none d-md-block"
          />
          
          {/* Città di Torino Logo - Hidden on mobile */}
          <Image
            src="http://localhost:3001/static/torino-clean.png"
            alt="Città di Torino"
            className="navbar-brand-logo-partner d-none d-md-block"
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
                  className="profile-button d-flex align-items-center me-2 me-lg-3 my-2 my-lg-0"
                >
                  <Image
                    src={profileImagePreview || "http://localhost:3001/static/user.png"}
                    alt="User Icon"
                    className="profile-avatar me-2"
                    roundedCircle
                  />
                  <span className="d-none d-md-inline">{props.user.username}</span>
                  <i className="bi bi-chevron-down ms-2" style={{ fontSize: '0.8em' }}></i>
                </Button>
              )}

              {/* Username display (for non-citizens) */}
              {!isCitizen && (
                <div className="username-display me-3 my-2 my-lg-0">
                  <Image
                    src="http://localhost:3001/static/user.png"
                    alt="User Icon"
                    roundedCircle
                  />
                  <span>{props.user.username}</span>
                </div>
              )}

              <LogoutButton handleLogout={props.handleLogout}/>
            </Nav>
          ) : (
            !hideLogin && (
              <Button
                variant="primary"
                onClick={props.onShowLogin}
                className="login-button d-flex align-items-center my-2 my-lg-0"
              >
                <i className="bi bi-box-arrow-in-right me-2"></i>
                Login
              </Button>
            )
          )}
        </Navbar.Collapse>
      </Navbar>

      {/* Profile Settings Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered size="md" className="profile-modal">
        <Modal.Header closeButton className="profile-modal-header">
          <Modal.Title className="profile-modal-title">
            <i className="bi bi-person-circle"></i>
            Profile Settings
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="profile-modal-body">
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
              <Form.Label className="fw-semibold d-block mb-3 profile-image-label">
                <i className="bi bi-image me-2"></i>Profile Picture
              </Form.Label>
              <div className="d-flex flex-column align-items-center">
                <div className="profile-image-container mb-3">
                  <Image
                    src={profileImagePreview || "http://localhost:3001/static/user.png"}
                    alt="Profile"
                    width={120}
                    height={120}
                    roundedCircle
                    className="profile-image-preview"
                  />
                </div>
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
                      className="profile-upload-button"
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
                      className="profile-upload-button"
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
              <Form.Label className="fw-semibold profile-form-label">
                <i className="bi bi-telegram me-2 text-primary"></i>Telegram Username
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="@username"
                value={telegramUser}
                onChange={(e) => setTelegramUser(e.target.value)}
                className="profile-form-input"
              />
              <Form.Text className="text-muted">
                <i className="bi bi-info-circle me-1"></i>
                Link your Telegram to receive notifications (optional)
              </Form.Text>
            </Form.Group>

            {/* User Info Display */}
            <div className="mt-4 p-3 bg-light rounded profile-account-info">
              <h6 className="mb-3 profile-account-title">
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
                className={`p-3 rounded profile-notification-toggle ${emailNotifications ? 'profile-notification-active' : 'profile-notification-inactive'}`}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="d-flex align-items-center">
                    <i 
                      className={`bi ${emailNotifications ? 'bi-envelope-check' : 'bi-envelope-slash'} me-3 profile-notification-icon`}
                    ></i>
                    <div>
                      <strong className="profile-notification-title">
                        Email Notifications
                      </strong>
                      <div className="text-muted profile-notification-subtitle">
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
                    className="profile-notification-switch"
                  />
                </div>
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="profile-modal-footer">
          <Button 
            variant="secondary" 
            onClick={() => setShowProfileModal(false)}
            className="profile-modal-cancel-btn"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveProfile}
            disabled={saving}
            className="profile-modal-save-btn"
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
