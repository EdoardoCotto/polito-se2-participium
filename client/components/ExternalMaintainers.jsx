import { Container, Card, Row, Col, Badge, Button, Modal, Alert, Spinner, Carousel, Form } from 'react-bootstrap';
import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import TurinMap from './TurinMap';
import MapErrorBoundary from './MapErrorBoundary';
import API from '../API/API';

export default function ExternalMaintainer({ user }) {
  const [assignedReports, setAssignedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Photos modal state
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoModalTitle, setPhotoModalTitle] = useState('');

  // Map state
  const [highlightedLocation, setHighlightedLocation] = useState(null);

  // Status update modal state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusError, setStatusError] = useState('');
  const [statusSuccess, setStatusSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Comments/Messages modal state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

  // Available status options (based on backend API)
  const statusOptions = [
    { value: 'progress', label: 'In Progress', icon: 'bi-hourglass-split', variant: 'primary', description: 'Work has started on this report' },
    { value: 'suspended', label: 'Suspended', icon: 'bi-pause-circle', variant: 'warning', description: 'Work is temporarily paused' },
    { value: 'resolved', label: 'Resolved', icon: 'bi-check-circle', variant: 'success', description: 'Issue has been fixed' },
  ];
  
  // Get user role display name
  const getRoleDisplayName = (type) => {
    const roleMap = {
      'external_maintainer': 'External Maintainer'
    };
    return roleMap[type] || type;
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    const variants = {
      'pending': 'warning',
      'accepted': 'info',
      'assigned': 'primary',
      'progress': 'primary',
      'resolved': 'success',
      'rejected': 'danger',
      'suspended': 'warning'
    };
    return variants[status] || 'secondary';
  };

  // Get status display label
  const getStatusLabel = (status) => {
    const labels = {
      'pending': 'Pending',
      'accepted': 'Accepted',
      'assigned': 'Assigned',
      'progress': 'In Progress',
      'resolved': 'Resolved',
      'rejected': 'Rejected',
      'suspended': 'Suspended'
    };
    return labels[status] || status;
  };

  // Fetch assigned reports on component mount
  useEffect(() => {
    fetchAssignedReports();
  }, []);

  const fetchAssignedReports = async () => {
    try {
      setLoading(true);
      setError('');
      const reports = await API.getExternalAssignedReports();
      setAssignedReports(reports);
    } catch (err) {
      setError(err.message || 'Failed to load assigned reports');
    } finally {
      setLoading(false);
    }
  };

  // Handle report card click - highlight on map
  const handleReportClick = (report) => {
    // If clicking on already selected report, deselect it
    if (highlightedLocation?.reportId === report.id) {
      setHighlightedLocation(null);
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

    }
  };

  // Open photos modal
  const handleOpenPhotos = (report, e) => {
    e.stopPropagation();
    const photos = report.photoUrls || [];

    
    if (photos.length === 0) {
      console.warn('No photos found for this report');
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

  // Open status update modal
  const handleOpenStatusModal = (report, e) => {
    e.stopPropagation();
    setSelectedReport(report);
    setNewStatus('');
    setStatusError('');
    setStatusSuccess('');
    setShowStatusModal(true);
  };

  // Close status modal
  const handleCloseStatusModal = () => {
    setShowStatusModal(false);
    setSelectedReport(null);
    setNewStatus('');
    setStatusError('');
    setStatusSuccess('');
  };

  // Submit status update
  const handleSubmitStatusUpdate = async () => {
    if (!newStatus) {
      setStatusError('Please select a new status');
      return;
    }

    try {
      setSubmitting(true);
      setStatusError('');
      
      // Use the existing API method
      await API.updateStatus(selectedReport.id, newStatus);
      
      const selectedStatusOption = statusOptions.find(s => s.value === newStatus);
      setStatusSuccess(`Report status updated to "${selectedStatusOption?.label}"!`);
      
      // Refresh reports and close modal after delay
      setTimeout(() => {
        setShowStatusModal(false);
        setTimeout(() => {
          fetchAssignedReports();
          setSelectedReport(null);
          setNewStatus('');
          setStatusError('');
          setStatusSuccess('');
        }, 300);
      }, 1500);
      
    } catch (err) {
      setStatusError(err.message || 'Failed to update report status');
    } finally {
      setSubmitting(false);
    }
  };

  // Open comments modal
  const handleOpenCommentsModal = async (report, e) => {
    e.stopPropagation();
    setSelectedReport(report);
    setComments([]);
    setNewComment('');
    setCommentError('');
    setShowCommentsModal(true);
    await fetchComments(report.id);
  };

  // Close comments modal
  const handleCloseCommentsModal = () => {
    setShowCommentsModal(false);
    setSelectedReport(null);
    setComments([]);
    setNewComment('');
    setCommentError('');
  };

  // Fetch comments for a report
  const fetchComments = async (reportId) => {
    try {
      setLoadingComments(true);
      setCommentError('');
      const fetchedComments = await API.getComments(reportId);
      console.log('Comments loaded:', fetchedComments);
      setComments(fetchedComments);
    } catch (err) {
      console.error('Failed to load comments:', err);
      setCommentError(err.message || 'Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  // Send new comment
  const handleSendComment = async () => {
    if (!newComment.trim()) {
      setCommentError('Please enter a message');
      return;
    }

    try {
      setSendingComment(true);
      setCommentError('');
      
      await API.createComment(selectedReport.id, newComment.trim());
      setNewComment('');
      
      // Refresh comments
      await fetchComments(selectedReport.id);
      
    } catch (err) {
      console.error('Failed to send comment:', err);
      setCommentError(err.message || 'Failed to send message');
    } finally {
      setSendingComment(false);
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

  // Format comment date - only time
  /*const formatCommentTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };*/

  // Format comment date - full date for separators
  /*const formatCommentDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset time to compare only dates
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric'
      });
    }
  };*/

  // Group comments by date
  const groupCommentsByDate = (comments) => {
    const groups = {};
    comments.forEach(comment => {
      const date = new Date(comment.created_at);
      const dateKey = date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(comment);
    });
    return groups;
  };

  // Render comments content based on loading/error/data state
  const renderCommentsContent = () => {
    if (loadingComments) {
      return (
        <div className="text-center py-5">
          <Spinner animation="border" style={{ color: '#5e7bb3', width: '2.5rem', height: '2.5rem' }} />
          <p className="mt-3 text-muted fw-medium">Loading messages...</p>
        </div>
      );
    }

    if (commentError && comments.length === 0) {
      return (
        <Alert variant="danger" style={{ 
          borderRadius: '1rem',
          border: 'none',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
          background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
        }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {commentError}
        </Alert>
      );
    }

    if (comments.length === 0) {
      return (
        <div className="text-center py-5">
          <div style={{
            background: 'linear-gradient(135deg, #e8f0ff 0%, #d6e5ff 100%)',
            borderRadius: '50%',
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
            boxShadow: '0 8px 24px rgba(94, 123, 179, 0.15)'
          }}>
            <i className="bi bi-chat-heart" style={{ fontSize: '3.5rem', color: '#5e7bb3' }}></i>
          </div>
          <p className="mt-3 text-muted fw-medium" style={{ fontSize: '1.1rem' }}>
            No messages yet. Start the conversation!
          </p>
        </div>
      );
    }

    // Render comments grouped by date
    return (
      <>
        {Object.entries(groupCommentsByDate(comments)).map(([dateKey, dayComments]) => (
          <div key={dateKey}>
            {renderDateSeparator(dateKey)}
            {dayComments.map((comment, idx) => renderComment(comment, idx))}
          </div>
        ))}
      </>
    );
  };

  // Render date separator helper
  const renderDateSeparator = (dateKey) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      margin: '1.5rem 0',
      gap: '1rem'
    }}>
      <div style={{ 
        flex: 1, 
        height: '2px', 
        background: 'linear-gradient(to right, transparent, rgba(94, 123, 179, 0.3), rgba(94, 123, 179, 0.15))',
        borderRadius: '1px'
      }}></div>
      <div style={{
        padding: '0.5rem 1.3rem',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e8f0ff 100%)',
        borderRadius: '2rem',
        fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
        fontWeight: '600',
        color: '#5e7bb3',
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        boxShadow: '0 2px 8px rgba(94, 123, 179, 0.1)',
        border: '1px solid rgba(94, 123, 179, 0.1)'
      }}>
        {dateKey === new Date().toDateString() ? 'Today' : dateKey}
      </div>
      <div style={{ 
        flex: 1, 
        height: '2px', 
        background: 'linear-gradient(to left, transparent, rgba(94, 123, 179, 0.3), rgba(94, 123, 179, 0.15))',
        borderRadius: '1px'
      }}></div>
    </div>
  );

  // Render individual comment helper
  const renderComment = (comment, idx) => {
    const isCurrentUser = comment.authorId === user.id;
    const displayTime = new Date(comment.created_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return (
      <div
        key={idx}
        style={{
          display: 'flex',
          justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
          marginBottom: '1rem',
          animation: 'slideIn 0.3s ease-out'
        }}
      >
        <div style={{
          maxWidth: '75%',
          background: isCurrentUser 
            ? 'linear-gradient(135deg, #5e7bb3 0%, #4a5f8f 100%)'
            : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          color: isCurrentUser ? '#fff' : '#1e293b',
          padding: '1rem 1.3rem',
          borderRadius: isCurrentUser
            ? '1.5rem 1.5rem 0.3rem 1.5rem'
            : '1.5rem 1.5rem 1.5rem 0.3rem',
          boxShadow: isCurrentUser 
            ? '0 6px 20px rgba(94, 123, 179, 0.3)'
            : '0 4px 16px rgba(0, 0, 0, 0.08)',
          border: isCurrentUser ? 'none' : '1px solid rgba(0, 0, 0, 0.05)',
          position: 'relative',
          wordBreak: 'break-word'
        }}>
          {!isCurrentUser && (
            <div style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              marginBottom: '0.5rem',
              color: '#5e7bb3',
              letterSpacing: '0.02em'
            }}>
              {comment.name} {comment.surname}
              <span style={{
                marginLeft: '0.5rem',
                fontWeight: '500',
                color: '#64748b',
                fontSize: '0.7rem'
              }}>
                ({getCommentAuthorRole(comment.authorRole)})
              </span>
            </div>
          )}
          <div style={{
            fontSize: '0.95rem',
            lineHeight: '1.5',
            marginBottom: '0.5rem'
          }}>
            {comment.comment}
          </div>
          <div style={{
            fontSize: '0.7rem',
            opacity: 0.8,
            textAlign: 'right',
            fontWeight: '500',
            letterSpacing: '0.02em'
          }}>
            {displayTime}
          </div>
        </div>
      </div>
    );
  };

  // Get role display name for comment author
  const getCommentAuthorRole = (role) => {
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
      'external_maintainer': 'External Maintainer',
      'citizen': 'Citizen',
      'admin': 'Administrator'
    };
    return roleMap[role] || role;
  };

  // Count photos for a report
  const countPhotos = (report) => {
    return report.photoUrls ? report.photoUrls.length : 0;
  };
  
  // Check if report has photos
  const hasPhotos = (report) => {
    return report.photoUrls && report.photoUrls.length > 0;
  };

  // Check if status can be updated
  const canUpdateStatus = (report) => {
    const updatableStatuses = ['assigned', 'progress', 'suspended'];
    return updatableStatuses.includes(report.status);
  };

  // Precompute modal body content to avoid nested ternary in JSX
  const photosModalContent = useMemo(() => {
    if (selectedPhotos.length === 0) {
      return (
        <div className="text-center py-5">
          <i className="bi bi-image" style={{ fontSize: '3rem', color: '#dee2e6' }}></i>
          <p className="mt-3 text-muted">No photos available</p>
        </div>
      );
    }

    if (selectedPhotos.length === 1) {
      return (
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
            alt={photoModalTitle || 'Report attachment'}
            style={{ 
              maxWidth: '100%', 
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      );
    }

    return (
      <Carousel interval={null} style={{ backgroundColor: '#000' }}>
        {selectedPhotos.map((photo, index) => (
          <Carousel.Item key={photo}>
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
                alt={photoModalTitle ? `${photoModalTitle} - attachment ${index + 1}` : `Report attachment ${index + 1}`}
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
    );
  }, [selectedPhotos, photoModalTitle]);

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
          {/* Map Section - Left Side (1/3) */}
          <Col lg={4} className="d-flex flex-column">
            <Card className="shadow-lg flex-grow-1" style={{ 
              borderRadius: 'clamp(0.5rem, 2vw, 1rem)', 
              border: 'none',
              minHeight: '31.25rem'
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
                  Map View
                  {highlightedLocation && (
                    <Badge bg="info" className="ms-2" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)' }}>
                      <i className="bi bi-geo-alt-fill me-1"></i>Selected
                    </Badge>
                  )}
                </h4>
              </Card.Header>
              <Card.Body className="p-0" style={{ height: 'calc(100% - 3.5rem)' }}>
                <MapErrorBoundary>
                  <TurinMap 
                    selectedLocation={highlightedLocation}
                    readOnly={true}
                    shouldZoomToSelection={highlightedLocation !== null}
                  />
                </MapErrorBoundary>
              </Card.Body>
            </Card>
          </Col>

          {/* Assigned Reports Section - Right Side (2/3) */}
          <Col lg={8} className="d-flex flex-column">
            <Card className="shadow-lg flex-grow-1" style={{ 
              borderRadius: 'clamp(0.5rem, 2vw, 1rem)', 
              border: 'none'
            }}>
              <Card.Header style={{ 
                backgroundColor: '#5e7bb3', 
                color: 'white', 
                padding: 'clamp(0.75rem, 2vw, 1.25rem)',
                borderTopLeftRadius: 'clamp(0.5rem, 2vw, 1rem)',
                borderTopRightRadius: 'clamp(0.5rem, 2vw, 1rem)'
              }}>
                <h4 className="mb-0 d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 3vw, 1.5rem)' }}>
                  <i className="bi bi-clipboard-check me-2"></i>
                  Assigned Reports
                  <Badge bg="light" text="dark" className="ms-2" style={{ 
                    fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                    fontWeight: '600',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.5rem',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                  }}>
                    {assignedReports.length}
                  </Badge>
                </h4>
              </Card.Header>
              <Card.Body className="p-2 p-md-3" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-5">
                    <Spinner animation="border" style={{ color: '#5e7bb3', width: '3rem', height: '3rem' }} />
                    <p className="mt-3 text-muted" style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)', fontWeight: '500' }}>
                      Loading assigned reports...
                    </p>
                  </div>
                )}

                {/* Empty State */}
                {!loading && !error && assignedReports.length === 0 && (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox" style={{ 
                      fontSize: 'clamp(3rem, 8vw, 5rem)', 
                      color: '#cbd5e1',
                      filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))'
                    }}></i>
                    <p className="mt-3 text-muted" style={{ 
                      fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                      fontWeight: '500'
                    }}>
                      No reports assigned to you
                    </p>
                    <p className="text-muted" style={{ 
                      fontSize: 'clamp(0.8rem, 2vw, 0.95rem)'
                    }}>
                      Reports will appear here once assigned
                    </p>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <Alert variant="danger" dismissible onClose={() => setError('')} style={{
                    borderRadius: '0.75rem',
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(220, 53, 69, 0.2)',
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)'
                  }}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                )}

                {/* Reports List */}
                {!loading && !error && assignedReports.length > 0 && (
                  <div className="d-flex flex-column gap-3">
                    {assignedReports.map((report) => {
                      const isSelected = highlightedLocation?.reportId === report.id;
                      
                      return (
                        <Card 
                          key={report.id} 
                          className={`shadow-sm ${isSelected ? 'border-primary' : ''}`}
                          style={{ 
                            border: isSelected ? '2px solid #5e7bb3' : '1px solid #e8ecef',
                            borderRadius: '0.875rem',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? '#f8fafc' : 'white',
                            boxShadow: isSelected ? '0 4px 12px rgba(94, 123, 179, 0.25)' : '0 2px 4px rgba(0, 0, 0, 0.06)'
                          }}
                          onClick={() => handleReportClick(report)}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.transform = 'translateY(-3px)';
                              e.currentTarget.style.boxShadow = '0 8px 16px rgba(94, 123, 179, 0.15)';
                              e.currentTarget.style.borderColor = '#5e7bb3';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.06)';
                              e.currentTarget.style.borderColor = '#e8ecef';
                            }
                          }}
                        >
                        <Card.Body className="p-3 p-md-4">
                          {/* Report Header */}
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>
                              {report.title}
                            </h6>
                            <Badge bg={getStatusBadgeVariant(report.status)} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)' }}>
                              {getStatusLabel(report.status)}
                            </Badge>
                          </div>

                          {/* Category */}
                          <div className="mb-2">
                            <Badge bg="secondary" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)' }}>
                              <i className="bi bi-tag me-1"></i>
                              {report.category}
                            </Badge>
                          </div>

                          {/* Description */}
                          <p className="text-muted mb-2" style={{ 
                            fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {report.description || 'No description provided'}
                          </p>

                          {/* Location */}
                          <div className="mb-2" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>
                            <i className="bi bi-geo-alt text-primary me-1"></i>
                            <small className="text-muted">
                              {report.latitude?.toFixed(5)}, {report.longitude?.toFixed(5)}
                            </small>
                          </div>

                          {/* Submitted By & Date */}
                          <div className="mb-3" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>
                            <i className="bi bi-person text-primary me-1"></i>
                            <small className="text-muted">
                              {report.user?.username || 'Anonymous'}
                            </small>
                            <br />
                            <i className="bi bi-calendar text-primary me-1"></i>
                            <small className="text-muted">
                              {formatDate(report.created_at)}
                            </small>
                          </div>

                          {/* Photos Badge */}
                          {hasPhotos(report) && (
                            <div className="mb-3">
                              <Badge
                                style={{
                                  fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  padding: '0.5rem 0.875rem',
                                  fontWeight: '600',
                                  background: 'linear-gradient(135deg, #5e7bb3 0%, #4a6fa5 100%)',
                                  border: 'none',
                                  borderRadius: '0.5rem',
                                  boxShadow: '0 2px 6px rgba(94, 123, 179, 0.25)',
                                  color: 'white'
                                }}
                                onClick={(e) => handleOpenPhotos(report, e)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #4a6fa5 0%, #3d5c8f 100%)';
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 123, 179, 0.4)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'linear-gradient(135deg, #5e7bb3 0%, #4a6fa5 100%)';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(94, 123, 179, 0.25)';
                                }}
                              >
                                <i className="bi bi-images me-2"></i>
                                <span>
                                  {countPhotos(report)} photo{countPhotos(report) === 1 ? '' : 's'}
                                </span>
                                <i
                                  className="bi bi-box-arrow-up-right ms-2"
                                  style={{ fontSize: '0.75em' }}
                                ></i>
                              </Badge>
                            </div>
                            )}

                            {/* Update Status Button */}
                            {canUpdateStatus(report) && (
                              <div className="mb-3">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  style={{
                                    fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                                    borderRadius: '0.5rem',
                                    padding: '0.5rem 0.875rem',
                                    fontWeight: '600',
                                    border: '2px solid #5e7bb3',
                                    color: '#5e7bb3',
                                    boxShadow: '0 2px 4px rgba(94, 123, 179, 0.2)',
                                    transition: 'all 0.3s ease'
                                  }}
                                  onClick={(e) => handleOpenStatusModal(report, e)}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'linear-gradient(135deg, #5e7bb3 0%, #7b9fd9 100%)';
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 123, 179, 0.4)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '';
                                    e.currentTarget.style.color = '#5e7bb3';
                                    e.currentTarget.style.transform = '';
                                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(94, 123, 179, 0.2)';
                                  }}
                                >
                                  <i className="bi bi-arrow-repeat me-1"></i>Update Status
                                </Button>
                              </div>
                            )}

                          {/* Comments/Messages Button */}
                          <div className="mb-3">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={(e) => handleOpenCommentsModal(report, e)}
                              style={{
                                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                                borderRadius: '0.5rem',
                                transition: 'all 0.3s ease',
                                fontWeight: '600',
                                padding: '0.5rem 1rem',
                                border: '2px solid #5e7bb3',
                                color: '#5e7bb3',
                                boxShadow: '0 2px 4px rgba(94, 123, 179, 0.2)'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'linear-gradient(135deg, #5e7bb3 0%, #7c93c3 100%)';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 123, 179, 0.4)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = '';
                                e.currentTarget.style.color = '#5e7bb3';
                                e.currentTarget.style.transform = '';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(94, 123, 179, 0.2)';
                              }}
                            >
                              <i className="bi bi-chat-dots me-2"></i>Messages
                            </Button>
                          </div>

                          {/* Click hints */}
                          {isSelected ? (
                            <div className="mb-0">
                              <small className="text-primary" style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontStyle: 'italic' }}>
                                <i className="bi bi-check-circle me-1"></i>
                                {' '}Selected - Click again to deselect
                              </small>
                            </div>
                          ) : (
                            <div className="mb-0">
                              <small className="text-muted" style={{ fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)', fontStyle: 'italic' }}>
                                <i className="bi bi-hand-index me-1"></i>
                                {' '}Click to show on map
                              </small>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                      );
                    })}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Photos Modal */}
      <Modal show={showPhotosModal} onHide={handleClosePhotosModal} centered size="lg">
        <Modal.Header closeButton style={{ backgroundColor: '#f8f9fa' }}>
          <Modal.Title style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
            <i className="bi bi-images me-2"></i>
            {photoModalTitle}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {photosModalContent}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClosePhotosModal} style={{ borderRadius: '0.5rem' }}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Update Status Modal */}
      <Modal show={showStatusModal} onHide={handleCloseStatusModal} centered size="lg">
        <Modal.Header closeButton style={{ 
          background: 'linear-gradient(135deg, #5e7bb3 0%, #7b9fd9 100%)', 
          color: 'white',
          borderBottom: 'none',
          padding: '1.5rem'
        }}>
          <Modal.Title style={{ 
            fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center'
          }}>
            <i className="bi bi-arrow-repeat me-2" style={{ fontSize: '1.5rem' }}></i>Update Report Status
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
          {statusError && (
            <Alert variant="danger" dismissible onClose={() => setStatusError('')} style={{ 
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              borderRadius: '0.75rem',
              border: 'none',
              boxShadow: '0 2px 8px rgba(220, 53, 69, 0.2)'
            }}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {statusError}
            </Alert>
          )}
          {statusSuccess && (
            <Alert variant="success" style={{ 
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              borderRadius: '0.75rem',
              border: 'none',
              boxShadow: '0 2px 8px rgba(25, 135, 84, 0.2)'
            }}>
              <i className="bi bi-check-circle me-2"></i>
              {statusSuccess}
            </Alert>
          )}
          
          {selectedReport && (
            <>
              {/* Report Details */}
              <Card className="mb-4" style={{ 
                border: 'none',
                borderRadius: '0.75rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <Card.Body className="p-3" style={{ backgroundColor: 'white' }}>
                  <h6 className="fw-bold mb-2" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}>
                    {selectedReport.title}
                  </h6>
                  <p className="text-muted mb-2" style={{ fontSize: 'clamp(0.9rem, 2vw, 1.05rem)' }}>
                    {selectedReport.description || 'No description provided'}
                  </p>
                  <div>
                    <Badge bg="secondary" className="me-2" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                      <i className="bi bi-tag me-1"></i>
                      {selectedReport.category}
                    </Badge>
                    <Badge bg={getStatusBadgeVariant(selectedReport.status)} style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                      Current: {getStatusLabel(selectedReport.status)}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>

              {/* Status Selection */}
              <Form.Group className="mb-3" style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <Form.Label className="fw-semibold mb-3" style={{ 
                  fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                  color: '#2c3e50'
                }}>
                  <i className="bi bi-arrow-repeat me-2" style={{ color: '#5e7bb3' }}></i>Select New Status *
                </Form.Label>
                <div className="d-flex flex-column gap-3">
                  {statusOptions.map((option) => (
                    <Card
                      key={option.value}
                      className={`status-option-card ${newStatus === option.value ? 'border-primary' : ''}`}
                      style={{
                        cursor: 'pointer',
                        border: newStatus === option.value ? '2px solid #5e7bb3' : '2px solid #dee2e6',
                        borderRadius: '0.75rem',
                        transition: 'all 0.3s ease',
                        backgroundColor: newStatus === option.value ? '#f0f5fb' : 'white',
                        boxShadow: newStatus === option.value ? '0 4px 12px rgba(94, 123, 179, 0.25)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                      }}
                      onClick={() => setNewStatus(option.value)}
                      onMouseEnter={(e) => {
                        if (newStatus !== option.value) {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                          e.currentTarget.style.borderColor = '#5e7bb3';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(94, 123, 179, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (newStatus !== option.value) {
                          e.currentTarget.style.backgroundColor = 'white';
                          e.currentTarget.style.borderColor = '#dee2e6';
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                        }
                      }}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-start">
                          <Form.Check
                            type="radio"
                            id={`status-${option.value}`}
                            checked={newStatus === option.value}
                            onChange={() => setNewStatus(option.value)}
                            className="me-3 mt-1"
                          />
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center mb-2">
                              <Badge bg={option.variant} style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                                <i className={`${option.icon} me-1`}></i>
                                {option.label}
                              </Badge>
                            </div>
                            <small className="text-muted" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                              {option.description}
                            </small>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ 
          backgroundColor: '#f8f9fa',
          borderTop: 'none',
          padding: '1.25rem'
        }}>
          <Button 
            variant="secondary" 
            onClick={handleCloseStatusModal}
            disabled={submitting}
            style={{ 
              fontSize: 'clamp(0.9rem, 2vw, 1rem)', 
              borderRadius: '0.5rem',
              padding: '0.6rem 1.5rem',
              fontWeight: '600',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!submitting) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            <i className="bi bi-x-circle me-2"></i>Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleSubmitStatusUpdate}
            disabled={submitting || !newStatus}
            style={{ 
              fontSize: 'clamp(0.9rem, 2vw, 1rem)', 
              borderRadius: '0.5rem',
              padding: '0.6rem 1.5rem',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #5e7bb3 0%, #7b9fd9 100%)',
              border: 'none',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              if (!submitting && newStatus) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(94, 123, 179, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '';
            }}
          >
            {submitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Updating...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>Confirm Update
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Comments/Messages Modal */}
      <Modal show={showCommentsModal} onHide={handleCloseCommentsModal} centered size="lg">
        <Modal.Header closeButton style={{ 
          background: 'linear-gradient(135deg, #5e7bb3 0%, #4a6fa5 100%)', 
          color: 'white',
          borderBottom: 'none',
          padding: '1.5rem 2rem',
          boxShadow: '0 4px 12px rgba(94, 123, 179, 0.15)'
        }}>
          <div style={{ width: '100%' }}>
            <Modal.Title style={{ 
              fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              letterSpacing: '-0.02em',
              marginBottom: '0.75rem'
            }}>
              <i className="bi bi-chat-dots-fill me-3" style={{ 
                fontSize: '1.6rem',
                animation: 'pulse 2s ease-in-out infinite'
              }}></i>{' '}
              Messages
            </Modal.Title>
            {selectedReport && (
              <div style={{ width: '100%' }}>
                <div style={{ 
                  fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                  fontWeight: '600',
                  opacity: 0.95,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                  marginBottom: '0.75rem'
                }}>
                  <i className="bi bi-file-text me-1" style={{ fontSize: '1rem' }}></i>
                  <span>{selectedReport.title}</span>
                  <Badge 
                    bg="light" 
                    text="dark" 
                    style={{ 
                      fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                      padding: '0.35rem 0.6rem',
                      fontWeight: '600'
                    }}
                  >
                    {selectedReport.category}
                  </Badge>
                  <Badge 
                    bg={getStatusBadgeVariant(selectedReport.status)} 
                    style={{ 
                      fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                      padding: '0.35rem 0.6rem',
                      fontWeight: '600'
                    }}
                  >
                    {getStatusLabel(selectedReport.status)}
                  </Badge>
                </div>
                {selectedReport.description && (
                  <div style={{ 
                    fontSize: 'clamp(0.85rem, 2.3vw, 0.95rem)',
                    opacity: 0.9,
                    lineHeight: '1.5',
                    marginBottom: '0.75rem',
                    fontStyle: 'italic'
                  }}>
                    <i className="bi bi-quote me-2"></i>
                    {selectedReport.description}
                    <i className="bi bi-quote ms-2" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}></i>
                  </div>
                )}
                {hasPhotos(selectedReport) && (
                  <div style={{ 
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    marginTop: '0.5rem'
                  }}>
                    {selectedReport.photoUrls && selectedReport.photoUrls.slice(0, 3).map((photoUrl, index) => (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPhotos(selectedReport, e);
                        }}
                        style={{
                          padding: 0,
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer'
                        }}
                        aria-label={`View report photo ${index + 1}`}
                      >
                        <img 
                          key={index}
                          src={photoUrl}
                          alt={`Report detail ${index + 1}`}
                          style={{ 
                            width: '60px',
                            height: '60px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '2px solid rgba(255, 255, 255, 0.3)',
                            transition: 'transform 0.2s ease, border-color 0.2s ease'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal.Header>
        <Modal.Body style={{ 
          backgroundColor: '#f8f9fc',
          padding: '0',
          maxHeight: '65vh',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Messages Container */}
          <div style={{ 
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            scrollBehavior: 'smooth',
            background: 'linear-gradient(to bottom, #f8fafc 0%, #f1f5f9 100%)'
          }}
          className="messages-container"
          >
            {renderCommentsContent()}
          </div>

          {/* Message Input */}
          <div style={{ 
            padding: '1.25rem 2rem 1.5rem',
            backgroundColor: '#ffffff',
            borderTop: '2px solid #e2e8f0',
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)'
          }}>
            {commentError && comments.length > 0 && (
              <Alert 
                variant="danger" 
                dismissible 
                onClose={() => setCommentError('')} 
                className="mb-3" 
                style={{ 
                  fontSize: '0.85rem',
                  borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.15)'
                }}
              >
                <i className="bi bi-exclamation-circle-fill me-2"></i>
                {commentError}
              </Alert>
            )}
            <Form.Group>
              <div className="d-flex gap-3 align-items-end">
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Type your message..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendComment();
                    }
                  }}
                  disabled={sendingComment}
                  className="message-input"
                  style={{
                    fontSize: 'clamp(0.9rem, 2vw, 1rem)',
                    borderRadius: '1rem',
                    border: '2px solid #e2e8f0',
                    resize: 'none',
                    padding: '0.75rem 1rem',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#f8fafc',
                    lineHeight: '1.5'
                  }}
                />
                <Button
                  variant="primary"
                  onClick={handleSendComment}
                  disabled={sendingComment || !newComment.trim()}
                  className="send-button"
                  style={{
                    borderRadius: '1rem',
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(135deg, #5e7bb3 0%, #4a6fa5 100%)',
                    border: 'none',
                    fontWeight: '700',
                    minWidth: '90px',
                    height: '52px',
                    boxShadow: '0 4px 12px rgba(94, 123, 179, 0.3)',
                    transition: 'all 0.2s ease',
                    fontSize: '1rem'
                  }}
                >
                  {sendingComment ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <i className="bi bi-send-fill"></i>
                  )}
                </Button>
              </div>
              <small className="text-muted d-block mt-2" style={{ 
                fontSize: 'clamp(0.7rem, 1.8vw, 0.75rem)',
                fontWeight: '500'
              }}>
                <i className="bi bi-info-circle me-1"></i>Press Enter to send, Shift+Enter for new line
              </small>
            </Form.Group>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}

ExternalMaintainer.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    surname: PropTypes.string,
    type: PropTypes.string,
  }),
};

