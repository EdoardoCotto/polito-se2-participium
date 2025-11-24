// components/CitizenPage.jsx
import { Container, Card, Row, Col, Button, Form, Alert, Modal, Dropdown, ListGroup, Badge } from 'react-bootstrap';
import { useState, useEffect} from 'react';
import TurinMap from './TurinMap';
import API from '../API/API.js';

export default function CitizenPage({ user }) {
  const [selectedLocation, setSelectedLocation] = useState(null); // {lat, lng}
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitOk, setSubmitOk] = useState('');

  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

   // View mode state - 'create' or 'view'
  const [viewMode, setViewMode] = useState('create');
  const [allReports, setAllReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [highlightedReportId, setHighlightedReportId] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await API.getCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        setCategoriesError(error.message);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && photos.length < 3) {
      setPhotos([...photos, { name: file.name, file: file, preview: URL.createObjectURL(file) }]);
    e.target.value = ''; // Reset input
    }
  };

  const handleRemovePhoto = (index) => {
    URL.revokeObjectURL(photos[index].preview);
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setShowPhotoModal(true);
  };

  const handleCreateReport = async () => {
    setSubmitError('');
    setSubmitOk('');

    if (!selectedLocation) {
      setSubmitError('Please select a point on the map within the city boundaries.');
      return;
    }
    if (!title.trim()) {
      setSubmitError('Please enter a title.');
      return;
    }
    if (!category.trim()) {
      setSubmitError('Please select a category.');
      return;
    }
    if (photos.length < 1) {
      setSubmitError('Please upload at least one photo.');
      return;
    }
    try {
      setSubmitting(true);
      // Use createAnonymousReport if isAnonymous is true, otherwise createReport
      const apiMethod = isAnonymous 
        ? (await import('../API/API.js')).default.createAnonymousReport
        : (await import('../API/API.js')).default.createReport;

      const files = photos.map(p => p.file);

      await apiMethod({
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        files: files,
      });

      // Cleanup URLs
      photos.forEach(p => URL.revokeObjectURL(p.preview));

      setSubmitOk(isAnonymous ? 'Anonymous report created successfully!' : 'Report created successfully!');
      setTitle('');
      setCategory('');
      setDescription('');
      setPhotos([]);
      setSelectedLocation(null);
      setIsAnonymous(false);
    } catch (err) {
      setSubmitError(err.message || 'An error occurred while creating the report.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle view mode change
  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    
    if (mode === 'view') {
      // Fetch all reports to display on map
      try {
        setLoadingReports(true);
        setReportsError('');
        const reports = await API.getCitizenReports();
        setAllReports(reports);
        // Don't clear selected location immediately to avoid map re-render
        setTimeout(() => setSelectedLocation(null), 100);
      } catch (err) {
        setReportsError(err.message || 'Failed to load reports');
      } finally {
        setLoadingReports(false);
      }
    } else if (mode === 'create') {
      // Clear reports when switching to create mode
      setAllReports([]);
      setTimeout(() => setSelectedLocation(null), 100);
    }
  };

  // Handle report marker click in view mode - Just open popup, don't set location
  const handleReportMarkerClick = (report) => {
    // In view mode, we don't need to set selected location
    // The popup will be shown automatically by Leaflet
    console.log('Report clicked:', report.title);
  };

  // Handle report click in the list - toggle highlight
  const handleReportListClick = (reportId) => {
    if (highlightedReportId === reportId) {
      // If already highlighted, remove highlight
      setHighlightedReportId(null);
      setSelectedLocation(null);
    } else {
      // Otherwise highlight this report
      setHighlightedReportId(reportId);
      // Find the report and set its location
      const report = allReports.find(r => r.id === reportId);
      if (report?.latitude && report?.longitude) {
        setSelectedLocation({
          lat: report.latitude,
          lng: report.longitude,
          reportId: report.id,
          title: report.title
        });
      }
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    const icons = {
      'Road': 'bi-sign-stop',
      'Lighting': 'bi-lightbulb',
      'Waste': 'bi-trash',
      'Vandalism': 'bi-exclamation-triangle',
      'Parks': 'bi-tree',
      'Other': 'bi-three-dots'
    };
    return icons[category] || 'bi-flag';
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'warning',
      'approved': 'success',
      'in_progress': 'info',
      'resolved': 'primary',
      'rejected': 'danger'
    };
    return colors[status] || 'secondary';
  };

  // Get view mode display text
  const getViewModeText = () => {
    switch (viewMode) {
      case 'create':
        return 'Create Report';
      case 'view':
        return 'View Reports on Map';
      default:
        return 'Create Report';
    }
  };

  return (
    <div className="app-root d-flex flex-column min-vh-100">
      <Container fluid className="flex-grow-1 py-2 py-md-4 px-2 px-md-3">
        <Row className="g-2 g-md-4">
          {/* Map */}
          <Col lg={8} className="order-1 order-lg-1">
            <Card className="citizen-card map-card shadow h-100" style={{ border: '1px solid #e0e0e0', minHeight: '750px' }}>
              <Card.Header style={{ backgroundColor: '#5e7bb3', color: 'white', padding: 'clamp(0.5rem, 2vw, 1rem)' }}>
                <Card.Title className="mb-0 d-flex align-items-center" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>
                  <i className="bi bi-pin-map me-2"></i>
                   <span className="d-none d-sm-inline">
                    {viewMode === 'create' ? 'Select a location on the map' : 'Reports Map View'}
                  </span>
                  <span className="d-inline d-sm-none">
                    {viewMode === 'create' ? 'Select Location' : 'Map View'}
                  </span>
                  {viewMode === 'view' && allReports.length > 0 && (
                    <span className="badge bg-light text-dark ms-2" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)' }}>
                      {allReports.length} report{allReports.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </Card.Title>
              </Card.Header>
              <Card.Body className="p-0" style={{ height: 'calc(100% - 3rem)', minHeight: '350px' }}>
                <div style={{ height: '100%', width: '100%' }}>
                  <TurinMap 
                    onLocationSelected={viewMode === 'create' ? setSelectedLocation : undefined}
                    selectedLocation={selectedLocation}
                    readOnly={viewMode === 'view'}
                    allReports={viewMode === 'view' ? allReports : []}
                    onReportMarkerClick={viewMode === 'view' ? handleReportMarkerClick : undefined}
                    highlightedReportId={highlightedReportId}
                    shouldZoomToSelection={viewMode === 'view' && highlightedReportId !== null}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Report panel */}
          <Col lg={4} className="order-2 order-lg-2">
            <Card className="shadow h-100" style={{ border: '1px solid #e0e0e0' , minHeight: '750px' }}>
              <Card.Header style={{ backgroundColor: '#5e7bb3', color: 'white', padding: 'clamp(0.5rem, 2vw, 1rem)' }}>
                <Dropdown className="w-100">
                  <Dropdown.Toggle 
                    variant="light" 
                    id="view-mode-dropdown"
                    className="w-100 d-flex align-items-center justify-content-between"
                    style={{ 
                      borderRadius: '0.5rem',
                      fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                      fontWeight: '500',
                      padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: 'white'
                    }}
                  >
                    <span className="d-flex align-items-center">
                      <i className={`bi ${viewMode === 'create' ? 'bi-file-earmark-plus' : 'bi-eye'} me-2`}></i>
                      {getViewModeText()}
                    </span>
                  </Dropdown.Toggle>
                   <Dropdown.Menu className="w-100" style={{ borderRadius: '0.5rem' }}>
                    <Dropdown.Item 
                      active={viewMode === 'create'}
                      onClick={() => handleViewModeChange('create')}
                      className="d-flex align-items-center"
                      style={{ 
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)'
                      }}
                    >
                      <i className="bi bi-file-earmark-plus me-2"></i>
                      Create Report
                    </Dropdown.Item>
                    <Dropdown.Item 
                      active={viewMode === 'view'}
                      onClick={() => handleViewModeChange('view')}
                      className="d-flex align-items-center"
                      style={{ 
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)'
                      }}
                    >
                      <i className="bi bi-eye me-2"></i>
                      View Reports on Map
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Card.Header>
              <Card.Body className="p-2 p-md-4" style={{ maxHeight: 'calc(750px - 4rem)', overflowY: 'auto' }}>

                {/* Show loading state when fetching reports */}
                {viewMode === 'view' && loadingReports && (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading reports...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading reports...</p>
                  </div>
                )}

                {/* Show error if reports failed to load */}
                {viewMode === 'view' && reportsError && (
                  <Alert variant="danger" dismissible onClose={() => setReportsError('')}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {reportsError}
                  </Alert>
                )}

                {/* Show reports list when in view mode and reports loaded */}
                {viewMode === 'view' && !loadingReports && !reportsError && allReports.length > 0 && (
                  <div>
                    <h6 className="mb-3 text-muted" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                      <i className="bi bi-list-ul me-2"></i>
                      Click on a report to highlight it on the map
                    </h6>
                    <ListGroup>
                      {allReports.map((report) => (
                        <ListGroup.Item
                          key={report.id}
                          action
                          active={highlightedReportId === report.id}
                          onClick={() => handleReportListClick(report.id)}
                          className="mb-2"
                          style={{ 
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: highlightedReportId === report.id ? '2px solid #5e7bb3' : '1px solid #dee2e6',
                            backgroundColor: highlightedReportId === report.id ? '#e8f0ff' : 'white'
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center mb-1">
                                <i className={`bi ${getCategoryIcon(report.category)} me-2 text-primary`}></i>
                                <strong style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                                  {report.title}
                                </strong>
                              </div>
                              {/* Username */}
                              {report.user && (
                                <div className="mb-2" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)' }}>
                                  <i className="bi bi-person-circle me-1 text-secondary"></i>
                                  <span className="text-secondary">
                                    {report.user.username || report.user.name || 'Anonymous'}
                                  </span>
                                </div>
                              )}
                              <div className="mb-1">
                                <Badge bg={getStatusColor(report.status)} className="me-2">
                                  {report.status}
                                </Badge>
                                <Badge bg="secondary">
                                  {report.category}
                                </Badge>
                              </div>
                              {report.description && (
                                <p className="mb-1 text-muted small" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)' }}>
                                  {report.description.length > 80 
                                    ? `${report.description.substring(0, 80)}...` 
                                    : report.description
                                  }
                                </p>
                              )}
                              <small className="text-muted">
                                <i className="bi bi-calendar me-1"></i>
                                {new Date(report.created_at).toLocaleDateString()}
                              </small>
                            </div>
                            {highlightedReportId === report.id && (
                              <i className="bi bi-check-circle-fill text-primary ms-2" style={{ fontSize: '1.2rem' }}></i>
                            )}
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </div>
                )}

                {/* Show message when in view mode with no reports */}
                {viewMode === 'view' && !loadingReports && !reportsError && allReports.length === 0 && (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#ccc' }}></i>
                    <h5 className="mt-3 mb-2">No Reports Available</h5>
                    <p className="text-muted" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                      There are no approved reports to display at the moment.
                    </p>
                  </div>
                )}

                {/* Show create report form only in create mode */}
                {viewMode === 'create' && (
                  <>
                    {submitError && (
                      <Alert variant="danger" dismissible onClose={() => setSubmitError('')} className="mb-2" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {submitError}
                      </Alert>
                    )}
                    {submitOk && (
                      <Alert variant="success" dismissible onClose={() => setSubmitOk('')} className="mb-2" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                        <i className="bi bi-check-circle me-2"></i>
                        {submitOk}
                      </Alert>
                    )}

                    <Form>
                      <Form.Group className="mb-2 mb-md-3">
                        <Form.Label className="fw-semibold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                          <i className="bi bi-pencil me-2"></i>Title
                        </Form.Label>
                        <Form.Control
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g., Pothole on Via Roma"
                          style={{ borderRadius: '8px', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}
                        />
                      </Form.Group>

                      <Form.Group className="mb-2 mb-md-3">
                        <Form.Label className="fw-semibold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                          <i className="bi bi-tags me-2"></i>Category 
                        </Form.Label>
                        <Form.Select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          style={{ borderRadius: '8px', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}
                        >
                          <option value="">Select a category...</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>

                      <Form.Group className="mb-2 mb-md-3">
                        <Form.Label className="fw-semibold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                          <i className="bi bi-text-left me-2"></i>Description 
                        </Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Provide additional details to help the municipality address this issue..."
                          style={{ borderRadius: '8px', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}
                        />
                      </Form.Group>

                      {/* Photos Section */}
                      <Form.Group className="mb-2 mb-md-3">
                        <Form.Label className="fw-semibold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                          <i className="bi bi-camera me-2"></i>Photos  (min 1, max 3)
                        </Form.Label>
                        {/* Lista foto caricate */}
                        {photos.length > 0 && (
                          <div className="mb-2">
                            {photos.map((photo, index) => (
                              <div 
                                key={index} 
                                className="d-flex align-items-center justify-content-between p-2 mb-2 bg-light rounded"
                                style={{ border: '1px solid #dee2e6' }}
                              >
                                <div 
                                  className="d-flex align-items-center flex-grow-1"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handlePhotoClick(photo)}
                                >
                                  <i className="bi bi-file-earmark-image me-2 text-primary"></i>
                                  <span className="text-truncate" style={{ maxWidth: '12.5rem' }}>
                                    {photo.name}
                                  </span>
                                  <i className="bi bi-eye ms-2 text-muted small"></i>
                                </div>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-danger p-0"
                                  onClick={() => handleRemovePhoto(index)}
                                >
                                  <i className="bi bi-trash"></i>
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div>
                        {/* Bottone per aggiungere foto */}
                        {photos.length < 3 && (
                          <>
                            <Form.Control
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              style={{ display: 'none' }}
                              id="photo-upload"
                            />
                            <label htmlFor="photo-upload">
                              <Button
                                as="span"
                                variant="outline-primary"
                                className="w-100"
                                style={{ borderRadius: '8px', cursor: 'pointer' }}
                              >
                                <i className="bi bi-plus-circle me-2"></i>
                                Add Photo
                              </Button>
                            </label>
                          </>
                        )}
                        </div>
                        {photos.length === 3 && (
                          <Alert variant="info" className="mt-2 mb-0 py-2">
                            <small>Maximum 3 photos reached</small>
                          </Alert>
                        )}
                      </Form.Group>

                      <Form.Group className="mb-3 mb-md-4">
                        <Form.Label className="fw-semibold" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                          <i className="bi bi-geo-alt me-2"></i>Location
                        </Form.Label>
                        <div 
                          className={`p-2 p-md-3 rounded ${selectedLocation ? 'bg-light border border-success' : 'bg-light border border-secondary'}`}
                          style={{ borderRadius: '8px', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}
                        >
                          {selectedLocation ? (
                            <div className="text-success">
                              <i className="bi bi-check-circle-fill me-2"></i>
                              <strong>Selected:</strong>
                              <div className="mt-1 small">
                                Lat: {selectedLocation.lat.toFixed(5)}, Lng: {selectedLocation.lng.toFixed(5)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-muted">
                              <i className="bi bi-pin-map me-2"></i>
                              <span className="d-none d-sm-inline">Click on the map to select a location</span>
                              <span className="d-inline d-sm-none">Select on map</span>
                            </div>
                          )}
                        </div>
                      </Form.Group>
                    </Form>

                    {/* Anonymous Mode Toggle - Spostato in fondo */}
                    <div className="mb-3 p-3 rounded" style={{ 
                      backgroundColor: isAnonymous ? '#fff3cd' : '#e8f0ff',
                      border: `1px solid ${isAnonymous ? '#ffc107' : '#5e7bb3'}`,
                      transition: 'all 0.3s ease'
                    }}>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <i className={`bi ${isAnonymous ? 'bi-incognito' : 'bi-person-badge'} me-2`} 
                             style={{ fontSize: '1.5rem', color: isAnonymous ? '#856404' : '#5e7bb3' }}></i>
                          <div>
                            <strong style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                              {isAnonymous ? 'Anonymous Report' : 'Public Report'}
                            </strong>
                            <div style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)' }} className="text-muted">
                              {isAnonymous 
                                ? 'Your identity will not be shown' 
                                : 'Your username will be visible'}
                            </div>
                          </div>
                        </div>
                        <Form.Check 
                          type="switch"
                          id="anonymous-switch"
                          checked={isAnonymous}
                          onChange={(e) => setIsAnonymous(e.target.checked)}
                          style={{ transform: 'scale(1.3)' }}
                        />
                      </div>
                    </div>

                    <div className="d-grid">
                      <Button 
                        variant="success"
                        size="lg"
                        disabled={submitting}
                        onClick={handleCreateReport}
                        style={{ 
                          backgroundColor: '#28a745', 
                          borderColor: '#28a745',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                          padding: 'clamp(0.5rem, 2vw, 0.75rem)'
                        }}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className={`bi ${isAnonymous ? 'bi-incognito' : 'bi-send'} me-2`}></i>
                            Submit {isAnonymous ? 'Anonymous' : ''} Report
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Modal per visualizzare la foto */}
      <Modal show={showPhotoModal} onHide={() => setShowPhotoModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{selectedPhoto?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          {selectedPhoto && (
            <img 
              src={selectedPhoto.preview} 
              alt={selectedPhoto.name} 
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
