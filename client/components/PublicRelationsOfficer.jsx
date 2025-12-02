import { Container, Card, Row, Col, Badge, Button, Modal, Form, Alert, Spinner, Carousel } from 'react-bootstrap';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TurinMap from './TurinMap';
import MapErrorBoundary from './MapErrorBoundary';
import API from '../API/API';

export default function PublicRelationsOfficer({ user }) {
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

   // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reviewAction, setReviewAction] = useState(''); // 'accepted' or 'rejected'
  const [technicalOffice, setTechnicalOffice] = useState('');
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Photos modal state - Added for photo viewer
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoModalTitle, setPhotoModalTitle] = useState('');

   // Map state - stores the location to highlight on map
  const [highlightedLocation, setHighlightedLocation] = useState(null);

   // Available technical offices
  const technicalOffices = [
    { value: 'urban_planner', label: 'Urban Planner' },
    { value: 'building_permit_officer', label: 'Building Permit Officer' },
    { value: 'building_inspector', label: 'Building Inspector' },
    { value: 'suap_officer', label: 'SUAP Officer' },
    { value: 'public_works_engineer', label: 'Public Works Engineer' },
    { value: 'mobility_traffic_engineer', label: 'Mobility & Traffic Engineer' },
    { value: 'environment_technician', label: 'Environment Technician' },
    { value: 'technical_office_staff_member', label: 'Technical Office Staff' },
  ];
  
  // Get user role display name
  const getRoleDisplayName = (type) => {
    const roleMap = {
      'urban_planner': 'Urban Planner',
      'building_permit_officer': 'Building Permit Officer',
      'building_inspector': 'Building Inspector',
      'suap_officer': 'SUAP Officer',
      'public_works_engineer': 'Public Works Engineer',
      'mobility_traffic_engineer': 'Mobility & Traffic Engineer',
      'environment_technician': 'Environment Technician',
      'municipal_public_relations_officer': 'Public Relations Officer',
      'municipal_administrator': 'Municipal Administrator',
      'technical_office_staff_member': 'Technical Office Staff',
    };
    return roleMap[type] || type;
  };

   // Fetch pending reports on component mount
  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    try {
      setLoading(true);
      setError('');
      const reports = await API.getPendingReports();
      console.log('FirstReport', reports[0]);
      setPendingReports(reports);
    } catch (err) {
      setError(err.message || 'Failed to load pending reports');
    } finally {
      setLoading(false);
    }
  };

  // Handle report card click - highlight on map or clear selection with double click
  const handleReportClick = (report) => {
    // If clicking on already selected report, deselect it
    if (highlightedLocation?.reportId === report.id) {
      setHighlightedLocation(null); // Clear selection and marker
      console.log('Report deselected'); // Debug log
      return;
    }

    // Otherwise, select the report
    if (report.latitude && report.longitude) {
      setHighlightedLocation({
        lat: report.latitude,
        lng: report.longitude,
        title: report.title,
        reportId: report.id
      });
    
      console.log('Report selected:', report.title, report.latitude, report.longitude); // Debug log
    }
  };

  // Open photos modal - Added to view report photos
  const handleOpenPhotos = (report, e) => {
    e.stopPropagation(); // Prevent card click
    
    // Use photoUrls array directly from backend (already has full URLs)
    const photos = report.photoUrls || [];
    
    console.log('Photos to display:', photos); // Debug log
    
    if (photos.length === 0) {
      console.warn('No photos found for this report'); // Debug log
    }
    
    setSelectedPhotos(photos);
    setPhotoModalTitle(report.title);
    setShowPhotosModal(true);
  };

  // Close photos modal
  const handleClosePhotosModal = () => {
    setShowPhotosModal(false);
    setSelectedPhotos([]);
    setPhotoModalTitle('');
  };

  // Open review modal
  const handleReviewClick = (report, action) => {
    setSelectedReport(report);
    setReviewAction(action);
    setTechnicalOffice('');
    setExplanation('');
    setReviewError('');
    setReviewSuccess('');
    setShowModal(true);
    
    // Also highlight the report on the map
    handleReportClick(report);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReport(null);
    setReviewAction('');
    setTechnicalOffice('');
    setExplanation('');
    setReviewError('');
    setReviewSuccess('');
  };

  // Submit review
  const handleSubmitReview = async () => {
    setReviewError('');
    setReviewSuccess('');
    // Validation
    if (reviewAction === 'accepted' && !technicalOffice) {
      setReviewError('Please select a technical office');
      return;
    }
    if (reviewAction === 'rejected' && !explanation.trim()) {
      setReviewError('Please provide an explanation for rejection');
      return;
    }

    try {
      setSubmitting(true);
      
      const reviewData = {
        status: reviewAction,
        ...(reviewAction === 'accepted' && { technicalOffice }),
        ...(reviewAction === 'rejected' && { explanation: explanation.trim() }),
      };
      await API.reviewReport(selectedReport.id, reviewData);
      
      setReviewSuccess(`Report successfully ${reviewAction}!`);
      
      // Close modal first, then refresh and clear state
      setTimeout(() => {
        setShowModal(false); // Close modal
        setTimeout(() => {
          // Reset all state after modal is closed
          setSelectedReport(null);
          setReviewAction('');
          setTechnicalOffice('');
          setExplanation('');
          setReviewError('');
          setReviewSuccess('');
          setHighlightedLocation(null);
          // Refresh the pending reports list
          fetchPendingReports();
        }, 300); // Wait for modal close animation
      }, 1500);
      
    } catch (err) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
};

// Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

   // Count photos for a report - Use photoUrls
  const countPhotos = (report) => {
    return report.photoUrls ? report.photoUrls.length : 0;
  };
  
  // Check if report has photos - Use photoUrls
  const hasPhotos = (report) => {
    return report.photoUrls && report.photoUrls.length > 0;
  };

  return (
    <div className="app-root d-flex flex-column min-vh-100">
      {/* Welcome Section */}
      <Container fluid className="py-2 py-md-4 px-2 px-md-3">
        <Card className="shadow-lg" style={{ borderRadius: 'clamp(0.5rem, 2vw, 1rem)', border: 'none' }}>
          <Card.Body className="p-2 p-md-4">
            <h2 className="mb-2 mb-md-3" style={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: 'clamp(1.25rem, 4vw, 2rem)'
            }}>
              <i className="bi bi-person-circle me-2" style={{ WebkitTextFillColor: 'initial', fontSize: 'clamp(1.2rem, 4vw, 1.8rem)' }}></i>
              <span className="d-none d-sm-inline">Welcome, {user?.name} {user?.surname}!</span>
              <span className="d-inline d-sm-none">Welcome!</span>
            </h2>
            <div className="d-flex align-items-center flex-wrap">
              <span className="badge" style={{ 
                backgroundColor: '#5e7bb3', 
                fontSize: 'clamp(0.8rem, 2vw, 1rem)',
                padding: 'clamp(0.4rem, 1.5vw, 0.5rem) clamp(0.75rem, 2vw, 1rem)',
                borderRadius: '8px',
                fontWeight: '500'
              }}>
                <i className="bi bi-shield-check me-2"></i>
                {getRoleDisplayName(user?.type)}
              </span>
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* Main Content - Map and Reports */}
      <Container fluid className="flex-grow-1 py-2 py-md-4 px-2 px-md-3">
        <Row className="g-3 h-100">
          {/* Map Section - Left Side */}
          <Col lg={6} className="d-flex flex-column">
            <Card className="shadow-lg flex-grow-1" style={{ 
              borderRadius: 'clamp(0.5rem, 2vw, 1rem)', 
              border: 'none',
              minHeight: '40rem'
            }}>
              <Card.Header style={{ 
                backgroundColor: '#5e7bb3', 
                color: 'white', 
                padding: 'clamp(0.75rem, 2vw, 1.25rem)',
                borderTopLeftRadius: 'clamp(0.5rem, 2vw, 1rem)',
                borderTopRightRadius: 'clamp(0.5rem, 2vw, 1rem)'
              }}>
                <h4 className="mb-0 d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>
                  <i className="bi bi-map me-2"></i>
                  Reports Map View
                  {highlightedLocation && ( // Show indicator when location is highlighted
                    <Badge bg="info" className="ms-2" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)' }}>
                      <i className="bi bi-geo-alt-fill me-1"></i>Selected
                    </Badge>
                  )}
                </h4>
              </Card.Header>
              <Card.Body className="p-0" style={{ height: 'calc(100% - 3.5rem)' }}>
                <TurinMap 
                  selectedLocation={highlightedLocation}
                  readOnly={true}
                  showAllReports={false}
                />
              </Card.Body>
            </Card>
          </Col>
           {/* Pending Reports Section - Right Side */}
          <Col lg={6} className="d-flex flex-column">
            <Card className="shadow-lg flex-grow-1 pending-reports-container" style={{ 
              borderRadius: 'clamp(0.5rem, 2vw, 1rem)', 
              border: 'none',
              minHeight: '40rem'
            }}>
              <Card.Header className="pending-reports-header" style={{ 
                color: 'white', 
                padding: 'clamp(0.75rem, 2vw, 1.25rem)',
                borderTopLeftRadius: 'clamp(0.5rem, 2vw, 1rem)',
                borderTopRightRadius: 'clamp(0.5rem, 2vw, 1rem)'
              }}>
                <h4 className="mb-0 d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>
                  <i className="bi bi-clipboard-check me-2"></i>
                  Pending Reports
                  <Badge className="ms-2 pending-reports-count-badge" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.9rem)' }}>
                    {pendingReports.length}
                  </Badge>
                </h4>
              </Card.Header>
              <Card.Body className="p-2 p-md-3" style={{ maxHeight: '75vh', overflowY: 'auto', scrollbarWidth: 'thin' }}>
                {/* Loading State */}
                {loading && (
                  <div className="pending-reports-loading">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>Loading pending reports...</p>
                  </div>
                )}
                {/* Empty State */}
                {!loading && !error && pendingReports.length === 0 && (
                  <div className="pending-reports-empty-state">
                    <i className="bi bi-inbox" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', color: '#dee2e6' }}></i>
                    <p className="mt-3 text-muted" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>
                      No pending reports to review
                    </p>
                  </div>
                )}
                {/* Error State */}
                {error && !loading && ( // Added error state display
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}
                {/* Reports List */}
                {!loading && !error && pendingReports.length > 0 && (
                  <div className="d-flex flex-column gap-3">
                    {pendingReports.map((report) => (
                      <Card 
                        key={report.id} 
                        className={`pending-report-card ${highlightedLocation?.reportId === report.id ? 'selected' : ''}`}
                        onClick={() => handleReportClick(report)}
                      >
                        <Card.Body className="p-3">
                          {/* Report Header */}
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="pending-report-title mb-0" style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', fontWeight: '600' }}>
                              {report.title}
                            </h6>
                            <Badge className="pending-status-badge" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                              Pending
                            </Badge>
                          </div>

                          {/* Category */}
                          <div className="mb-2">
                            <Badge className="pending-category-badge" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                              <i className="bi bi-tag me-1"></i>
                              {report.category}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="pending-report-description mb-2" style={{ 
                            fontSize: 'clamp(1rem, 2vw, 1.1rem)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.5'
                          }}>
                            {report.description || 'No description provided'}
                          </p>

                          {/* Location */}
                          <div className="pending-report-info">
                            <i className="bi bi-geo-alt"></i>
                            <small style={{ fontSize: 'clamp(0.95rem, 2vw, 1.05rem)' }}>
                              {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
                            </small>
                          </div>

                          {/* Submitted By & Date */}
                          <div className="pending-report-info">
                            <i className="bi bi-person"></i>
                            <small style={{ fontSize: 'clamp(0.95rem, 2vw, 1.05rem)' }}>{report.user?.username || 'Anonymous'}</small>
                          </div>
                          <div className="pending-report-info mb-2">
                            <i className="bi bi-calendar"></i>
                            <small style={{ fontSize: 'clamp(0.95rem, 2vw, 1.05rem)' }}>{formatDate(report.created_at)}</small>
                          </div>

                           {/* Photos Badge - Clickable to open photos modal */}
                          {hasPhotos(report) && (
                            <div className="mb-3">
                              <Badge 
                                className="pending-report-photo-badge"
                                style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}
                                onClick={(e) => handleOpenPhotos(report, e)}
                              >
                                <i className="bi bi-image me-1"></i>
                                {countPhotos(report)} photo{countPhotos(report) !== 1 ? 's' : ''}
                                <i className="bi bi-box-arrow-up-right ms-1" style={{ fontSize: '0.7em' }}></i>
                              </Badge>
                            </div>
                          )}
                          {/* Click hint */}
                          <div className={`pending-report-hint ${highlightedLocation?.reportId === report.id ? 'selected' : ''}`} style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
                            <i className={`bi ${highlightedLocation?.reportId === report.id ? 'bi-check-circle' : 'bi-hand-index'}`}></i>
                            <span>
                              {highlightedLocation?.reportId === report.id 
                                ? 'Selected - Click again to deselect' 
                                : 'Click to show on map'}
                            </span>
                          </div>
                            {/* Action Buttons */}
                          <div className="pending-report-actions">
                            <Button 
                              className="pending-report-btn-accept flex-grow-1"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReviewClick(report, 'accepted');
                              }}
                              style={{ fontSize: 'clamp(0.95rem, 2vw, 1.05rem)' }}
                            >
                              <i className="bi bi-check-circle me-1"></i>Accept
                            </Button>
                            <Button 
                              className="pending-report-btn-reject flex-grow-1"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReviewClick(report, 'rejected');
                              }}
                              style={{ fontSize: 'clamp(0.95rem, 2vw, 1.05rem)' }}
                            >
                              <i className="bi bi-x-circle me-1"></i>Reject
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

       {/* Photos Modal - Added for viewing report photos */}
      <Modal show={showPhotosModal} onHide={handleClosePhotosModal} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
          <Modal.Title style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
            <i className="bi bi-images me-2"></i>
            {photoModalTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedPhotos.length > 0 ? (
            selectedPhotos.length === 1 ? (
              // Single photo - Just show the image
              <div style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: '#000',
                minHeight: '25rem'
              }}>
                <img 
                  src={selectedPhotos[0]} 
                  alt={photoModalTitle || "Report"}
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '80vh',
                    objectFit: 'contain'
                  }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                /></div>
            ) : (
              // Multiple photos - Show carousel
              <Carousel 
                interval={null} 
                style={{ backgroundColor: '#000' }}
                indicators={true}
                controls={true}
              >
                {selectedPhotos.map((photo, index) => (
                  <Carousel.Item key={index}>
                    <div style={{ 
                      width: '100%', 
                      height: '31.25rem',
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      backgroundColor: '#000'
                    }}>
                      <img
                        src={photo}
                        alt={`${photoModalTitle || 'Report'} ${index + 1}`}
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '100%',
                          objectFit: 'contain'
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                        }}
                         />
                    </div>
                    <Carousel.Caption style={{ 
                      backgroundColor: 'rgba(0,0,0,0.7)', 
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem'
                    }}>
                      <p style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', margin: 0 }}>
                        Photo {index + 1} of {selectedPhotos.length}
                      </p>
                    </Carousel.Caption>
                  </Carousel.Item>
                ))}
              </Carousel>
            )
          ) : (
            <div className="text-center py-5">
              <i className="bi bi-image" style={{ fontSize: '3rem', color: '#dee2e6' }}></i>
              <p className="mt-3 text-muted">No photos available</p>
            </div>
          )}
          </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePhotosModal} style={{ borderRadius: '0.5rem' }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Review Modal */}
      <Modal show={showModal} onHide={handleCloseModal} centered size="lg" className="review-report-modal">
        <Modal.Header closeButton className={`review-modal-header ${reviewAction === 'accepted' ? 'accept-header' : 'reject-header'}`}>
          <Modal.Title className="review-modal-title" style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)' }}>
            <i className={`bi ${reviewAction === 'accepted' ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
            {reviewAction === 'accepted' ? 'Accept Report' : 'Reject Report'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="review-modal-body p-4">
          {reviewError && (
            <Alert variant="danger" dismissible onClose={() => setReviewError('')} style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {reviewError}
            </Alert>
          )}
          {reviewSuccess && (
            <Alert variant="success" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>
              <i className="bi bi-check-circle me-2"></i>
              {reviewSuccess}
            </Alert>
          )}
          {selectedReport && (
            <>
              {/* Report Details */}
              <Card className="review-report-card mb-3">
                <Card.Body className="p-3">
                  <h6 className="review-report-title fw-bold mb-2" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}>
                    {selectedReport.title}
                  </h6>
                  <p className="review-report-description text-muted mb-2" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.05rem)' }}>
                    {selectedReport.description || 'No description provided'}
                  </p>
                  <div className="review-report-meta">
                    <Badge bg="secondary" className="review-category-badge me-2" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>{selectedReport.category}</Badge>
                    <small className="text-muted" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                      <i className="bi bi-person me-1"></i>
                      {selectedReport.user?.username || 'Anonymous'}
                    </small>
                  </div>
                </Card.Body>
              </Card>
              {/* Accept: Technical Office Selection */}
              {reviewAction === 'accepted' && (
                <Form.Group className="review-form-group mb-3">
                  <Form.Label className="review-form-label fw-semibold" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.05rem)' }}>
                    <i className="bi bi-building me-2"></i>Assign to Technical Office *
                  </Form.Label>
                  <Form.Select
                    value={technicalOffice}
                    onChange={(e) => setTechnicalOffice(e.target.value)}
                    className="review-form-select"
                    style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}
                  >
                    <option value="">Select a technical office...</option>
                    {technicalOffices.map((office) => (
                      <option key={office.value} value={office.value}>
                        {office.label}
                      </option>
                    ))}
                  </Form.Select>
                  <Form.Text className="review-form-help text-muted" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                    Select the appropriate technical office to handle this report
                  </Form.Text>
                </Form.Group>
              )}
               {/* Reject: Explanation */}
              {reviewAction === 'rejected' && (
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold" style={{ fontSize: 'clamp(0.95rem, 2vw, 1.05rem)' }}>
                    <i className="bi bi-chat-left-text me-2"></i>Explanation for Rejection *
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Provide a clear explanation for why this report is being rejected..."
                    style={{ borderRadius: '0.5rem', fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}
                  />
                  <Form.Text className="text-muted" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                    This explanation will be sent to the citizen who submitted the report
                  </Form.Text>
                </Form.Group>
              )}
            </>
          )}
           </Modal.Body>
        <Modal.Footer className="review-modal-footer">
          <Button 
            variant="secondary" 
            onClick={handleCloseModal}
            disabled={submitting}
            className="review-modal-btn-cancel"
            style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}
          >
            Cancel
          </Button>
          <Button 
            variant={reviewAction === 'accepted' ? 'success' : 'danger'}
            onClick={handleSubmitReview}
            disabled={submitting}
            className={`review-modal-btn-confirm ${reviewAction === 'accepted' ? 'accept-btn' : 'reject-btn'}`}
            style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Submitting...
              </>
            ) : (
              <>
                <i className={`bi ${reviewAction === 'accepted' ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
                Confirm {reviewAction === 'accepted' ? 'Accept' : 'Reject'}
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
     </div>
  );
}

PublicRelationsOfficer.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    surname: PropTypes.string,
    type: PropTypes.string,
  }),
};
