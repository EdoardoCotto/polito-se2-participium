import 'bootstrap-icons/font/bootstrap-icons.css';
import { Button, Navbar, Image, Nav, Modal, Form, Alert } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PropTypes from 'prop-types';
import { LogoutButton } from './AuthComponents';
import API from '../API/API';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

function NavHeader(props) {
  const location = useLocation();
  const navigate = useNavigate();
  const hideLogin = location.pathname === '/registration' || location.pathname.startsWith('/registration/');
  const isHomePage = location.pathname === '/';
  
  // Profile modal state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [telegram_nickname, settelegram_nickname] = useState('');
  const [mail_notifications, setmail_notifications] = useState(true);
  const [personal_photo, setpersonal_photo] = useState(null);
  const [personal_photoPreview, setpersonal_photoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  
  // Crop modal state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropping, setCropping] = useState(false);

  // Check if user is a citizen
  const isCitizen = props.user?.type === 'citizen';

  // Sync profile image with props.user when it changes (for navbar display)
  const getProfileImageUrl = () => {
    if (props.user?.personal_photo_path) {
      return `http://localhost:3001${props.user.personal_photo_path}`;
    }
    return "http://localhost:3001/static/user.png";
  };

  // Helper function to calculate mail notifications value
  const getMailNotificationsValue = (mailNotifications) => {
    return mailNotifications === false || mailNotifications === 0 
      ? false 
      : Boolean(mailNotifications !== null && mailNotifications !== undefined);
  };

  // Helper function to set photo preview
  const setPhotoPreview = (photoPath) => {
    if (photoPath) {
      setpersonal_photoPreview(`http://localhost:3001${photoPath}`);
    } else {
      setpersonal_photoPreview(null);
    }
  };

  // Helper function to load user data into form
  const loadUserDataIntoForm = (userData) => {
    if (!userData) return;
    
    console.log('Setting telegram_nickname to:', userData.telegram_nickname || '');
    console.log('Setting mail_notifications to:', userData.mail_notifications);
    console.log('mail_notifications type:', typeof userData.mail_notifications);
    console.log('Setting photo path to:', userData.personal_photo_path);
    
    settelegram_nickname(userData.telegram_nickname || '');
    const mailNotifValue = getMailNotificationsValue(userData.mail_notifications);
    setmail_notifications(mailNotifValue);
    console.log('Final mail_notifications value:', mailNotifValue);
    setPhotoPreview(userData.personal_photo_path);
  };

  // Helper function to reset form state
  const resetFormState = () => {
    setpersonal_photo(null);
    setSaveError('');
    setSaveSuccess('');
    setShowProfileModal(true);
  };

  // Handle profile modal open - Load fresh data from database
  const handleOpenProfile = async () => {
    try {
      console.log('Opening profile modal...');
      console.log('Current props.user:', props.user);
      
      const latestUser = await API.getCurrentUser();
      console.log('Latest user from API:', latestUser);
      
      const userData = latestUser || props.user;
      if (!latestUser) {
        console.log('No latestUser, falling back to props.user');
      }
      
      loadUserDataIntoForm(userData);
      resetFormState();
      
    } catch (err) {
      console.error('Error loading profile data:', err);
      loadUserDataIntoForm(props.user);
      resetFormState();
    }
  };

  // Handle profile image change - open crop modal
  const handlepersonal_photoChange = (e) => {
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
      // Reset crop state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setImageToCrop(URL.createObjectURL(file));
      setShowCropModal(true);
      setSaveError('');
    }
  };

  // Handle crop completion
  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Handle crop and save
  const handleCropAndSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;
    
    try {
      setCropping(true);
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      
      // Convert blob to file
      const file = new File([croppedImageBlob], 'profile-photo.jpg', { type: 'image/jpeg' });
      
      setpersonal_photo(file);
      setpersonal_photoPreview(URL.createObjectURL(croppedImageBlob));
      setShowCropModal(false);
      setImageToCrop(null);
      setCroppedAreaPixels(null);
    } catch (error) {
      console.error('Error cropping image:', error);
      setSaveError('Failed to crop image. Please try again.');
    } finally {
      setCropping(false);
    }
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    // Reset file input
    const fileInput = document.getElementById('profile-image-upload');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Handle remove profile image
  const handleRemovepersonal_photo = () => {
    setpersonal_photo(null);
    setpersonal_photoPreview(null);
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setSaveError('');
      setSaveSuccess('');

      if (!props.user?.id) {
        setSaveError('User ID is required');
        return;
      }

      console.log('Saving profile with mail_notifications:', mail_notifications);

      // Prepare profile data
      const profileData = {
        telegram_nickname: telegram_nickname || '',
        mail_notifications: mail_notifications ? 1 : 0,
      };

      // Handle photo upload or removal
      if (personal_photo) {
        // User selected a new photo to upload
        profileData.personal_photo = personal_photo;
        profileData.photo_action = 'upload';
      } else if (personal_photoPreview === null || personal_photoPreview === "http://localhost:3001/static/user.png") {
        // User removed the photo (no preview or default avatar showing)
        if (props.user?.personal_photo_path) {
          // Only send remove action if user had a photo before
          profileData.photo_action = 'remove';
        }
      }

      // Call API to update user profile
      await API.updateUserProfile(props.user.id, profileData);

      setSaveSuccess('Profile updated successfully!');
      
      // Refresh user data from backend
      const refreshedUser = await API.getCurrentUser();
      console.log('Refreshed user after save:', refreshedUser);
      
      // Update parent component user state
      if (refreshedUser && props.onProfileUpdate) {
        props.onProfileUpdate(refreshedUser);
      }

      setTimeout(() => {
        setShowProfileModal(false);
        setSaveSuccess('');
      }, 1500);

    } catch (err) {
      console.error('Error saving profile:', err);
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
          
          {/* Citta di Torino Logo - Hidden on mobile */}
          <Image
            src="http://localhost:3001/static/torino-clean.png"
            alt="Città di Torino"
            className="navbar-brand-logo-partner d-none d-md-block"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar-nav" />
        <Navbar.Collapse id="main-navbar-nav" className="justify-content-end">
          <Nav className="align-items-lg-center">
            {/* Public Map Button - Show only on homepage when not logged in */}
            {!props.loggedIn && isHomePage && (
              <Button
                variant="outline-primary"
                onClick={() => navigate('/map')}
                className="map-button d-flex align-items-center me-2 me-lg-3 my-2 my-lg-0"
              >
                <i className="bi bi-map me-2"></i>
                <span>View Map</span>
              </Button>
            )}

            {props.loggedIn && props.user ? (
              <>
                {/* Profile Button (only for citizens) */}
                {isCitizen && (
                  <Button
                    variant="outline-primary"
                    onClick={handleOpenProfile}
                    className="profile-button d-flex align-items-center me-2 me-lg-3 my-2 my-lg-0"
                  >
                    <Image
                      src={getProfileImageUrl()}
                      alt="User Icon"
                      className="profile-avatar me-2"
                      roundedCircle
                    />
                    <span className="d-none d-md-inline">{props.user.username}</span>
                    <i
                      className="bi bi-chevron-down ms-2"
                      style={{ fontSize: '0.8em' }}
                    ></i>
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
              </>
            ) : (
              !hideLogin && (
                <Button
                  variant="primary"
                  onClick={props.onShowLogin}
                  className="login-button d-flex align-items-center my-2 my-lg-0"
                >
                  <i className="bi bi-box-arrow-in-right me-2"></i>
                  <span>Login</span>
                </Button>
              )
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>

      {/* Profile Settings Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered size="lg" className="profile-modal">
        <Modal.Header closeButton className="profile-modal-header">
          <Modal.Title className="profile-modal-title">
            <i className="bi bi-person-circle"></i>
            <span>Profile Settings</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="profile-modal-body">
          {saveError && (
            <Alert variant="danger" dismissible onClose={() => setSaveError('')}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              <span>{saveError}</span>
            </Alert>
          )}
          {saveSuccess && (
            <Alert variant="success">
              <i className="bi bi-check-circle me-2"></i>
              <span>{saveSuccess}</span>
            </Alert>
          )}

          <Form>
            <div className="row g-4">
              {/* Left Column - Profile Image */}
              <div className="col-12 col-lg-4">
                <div className="profile-image-section">
                  <Form.Label className="fw-semibold d-block mb-3 profile-image-label">
                    <i className="bi bi-image me-2"></i>
                    <span>Profile Picture</span>
                  </Form.Label>
                  <div className="d-flex flex-column align-items-center">
                    <div className="profile-image-container mb-3">
                      <Image
                        src={personal_photoPreview || "http://localhost:3001/static/user.png"}
                        alt="Profile"
                        width={160}
                        height={160}
                        roundedCircle
                        className="profile-image-preview"
                      />
                    </div>
                    <div className="d-flex flex-column gap-2 w-100">
                      <Form.Control
                        type="file"
                        accept="image/*"
                        onChange={handlepersonal_photoChange}
                        style={{ display: 'none' }}
                        id="profile-image-upload"
                      />
                      <label htmlFor="profile-image-upload" className="w-100">
                        <Button
                          as="span"
                          variant="outline-primary"
                          className="profile-upload-button w-100"
                        >
                          <i className="bi bi-upload me-2"></i>
                          <span>Upload Photo</span>
                        </Button>
                      </label>
                      {personal_photoPreview && personal_photoPreview !== "http://localhost:3001/static/user.png" && (
                        <Button
                          variant="outline-danger"
                          onClick={handleRemovepersonal_photo}
                          className="profile-upload-button w-100"
                        >
                          <i className="bi bi-trash me-2"></i>
                          <span>Remove Photo</span>
                        </Button>
                      )}
                    </div>
                    <small className="text-muted mt-3 text-center">
                      <i className="bi bi-info-circle me-1"></i>
                      <span>Max 5MB - JPG, PNG, GIF</span>
                    </small>
                  </div>
                </div>
              </div>

              {/* Right Column - Form Fields */}
              <div className="col-12 col-lg-8">
                <div className="profile-form-section">
                  {/* Telegram Username */}
                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold profile-form-label">
                      <i className="bi bi-telegram me-2 text-primary"></i>
                      <span>Telegram Username</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="@username"
                      value={telegram_nickname}
                      onChange={(e) => settelegram_nickname(e.target.value)}
                      className="profile-form-input"
                    />
                    <Form.Text className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      <span>Link your Telegram to receive notifications (optional)</span>
                    </Form.Text>
                  </Form.Group>

                  {/* Email Notifications Toggle */}
                  <Form.Group className="mb-4">
                    <div 
                      className={`p-4 rounded profile-notification-toggle ${mail_notifications ? 'profile-notification-active' : 'profile-notification-inactive'}`}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <i 
                            className={`bi ${mail_notifications ? 'bi-envelope-check' : 'bi-envelope-slash'} me-3 profile-notification-icon`}
                          ></i>
                          <div>
                            <strong className="profile-notification-title">
                              <span>Email Notifications</span>
                            </strong>
                            <div className="text-muted profile-notification-subtitle">
                              <span>
                                {mail_notifications 
                                  ? 'You will receive email updates' 
                                  : 'Email notifications are disabled'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Form.Check 
                          type="switch"
                          id="email-notifications-switch"
                          checked={mail_notifications}
                          onChange={(e) => setmail_notifications(e.target.checked)}
                          className="profile-notification-switch"
                        />
                      </div>
                    </div>
                  </Form.Group>

                  {/* User Info Display */}
                  <div className="profile-account-info">
                    <h6 className="mb-3 profile-account-title">
                      <i className="bi bi-person-vcard me-2"></i>
                      <span>Account Information</span>
                    </h6>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <div className="profile-info-item">
                          <small className="text-muted d-block mb-1">Full Name</small>
                          <div className="fw-semibold profile-info-value">
                            {props.user?.name} {props.user?.surname}
                          </div>
                        </div>
                      </div>
                      <div className="col-12 col-md-6">
                        <div className="profile-info-item">
                          <small className="text-muted d-block mb-1">Username</small>
                          <div className="fw-semibold profile-info-value">
                            {props.user?.username}
                          </div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="profile-info-item">
                          <small className="text-muted d-block mb-1">Email Address</small>
                          <div className="fw-semibold profile-info-value">
                            {props.user?.email || 'Not provided'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="profile-modal-footer">
          <Button 
            variant="secondary" 
            onClick={() => setShowProfileModal(false)}
            className="profile-modal-cancel-btn"
          >
            <span>Cancel</span>
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSaveProfile}
            disabled={saving}
            className="profile-modal-save-btn"
          >
            {saving ? (
              <output>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                <span>Saving...</span>
              </output>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Crop Modal */}
      <Modal 
        show={showCropModal} 
        onHide={handleCropCancel} 
        centered 
        size="lg" 
        className="crop-modal"
      >
        <Modal.Header closeButton className="crop-modal-header">
          <Modal.Title className="crop-modal-title">
            <i className="bi bi-scissors me-2"></i>
            <span>Crop Your Photo</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="crop-modal-body">
          {imageToCrop && (
            <>
              <div className="crop-container">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '400px',
                      position: 'relative',
                      background: '#f0f0f0',
                    },
                  }}
                />
              </div>
              <div className="crop-controls mt-3">
                <Form.Label className="d-block mb-2">
                  <i className="bi bi-zoom-in me-2"></i>Zoom
                </Form.Label>
                <Form.Range
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
                  className="crop-zoom-slider"
                />
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="crop-modal-footer">
          <Button 
            variant="secondary" 
            onClick={handleCropCancel}
            disabled={cropping}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleCropAndSave}
            disabled={cropping || !croppedAreaPixels}
          >
            {cropping ? (
              <output>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
                <span>Cropping...</span>
              </output>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>
                <span>Apply Crop</span>
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
NavHeader.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
    name: PropTypes.string,
    surname: PropTypes.string,
    email: PropTypes.string,
    type: PropTypes.string,
    personal_photo_path: PropTypes.string,
    telegram_nickname: PropTypes.string,
    mail_notifications: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  }),
  loggedIn: PropTypes.bool,
  handleLogout: PropTypes.func,
  onShowLogin: PropTypes.func,
  onProfileUpdate: PropTypes.func,
};

export default NavHeader;
