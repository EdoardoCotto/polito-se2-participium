import { Container, Card, Row, Col, Badge, Button, Modal, Alert, Spinner, Carousel, Form } from 'react-bootstrap';
import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import TurinMap from './TurinMap';
import MapErrorBoundary from './MapErrorBoundary';
import API from '../API/API';

export default function TechnicalOfficeStaffMember({ user }) {
  const [assignedReports, setAssignedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Photos modal state
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [photoModalTitle, setPhotoModalTitle] = useState('');

  // Map state
  const [highlightedLocation, setHighlightedLocation] = useState(null);

  // Assign to External Maintainer modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [externalMaintainers, setExternalMaintainers] = useState([]);
  const [selectedMaintainer, setSelectedMaintainer] = useState('');
  const [loadingMaintainers, setLoadingMaintainers] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Comments/Messages modal state
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentError, setCommentError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);

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

  // Get status badge variant
  const getStatusBadgeVariant = (status) => {
    const variants = {
      'pending': 'warning',
      'accepted': 'info',
      'progress': 'primary',
      'resolved': 'success',
      'rejected': 'danger'
    };
    return variants[status] || 'secondary';
  };

  // Fetch assigned reports on component mount
  useEffect(() => {
    fetchAssignedReports();
  }, []);

  const fetchAssignedReports = async () => {
    try {
      setLoading(true);
      setError('');
      const reports = await API.getAssignedReports();
      console.log('📋 Assigned Reports:', reports);
      
      // Debug: mostra struttura primo report
      if (reports.length > 0) {
        console.log('🔍 Primo report:', reports[0]);
        console.log('🔍 externalMaintainer:', reports[0].externalMaintainer);
      }
      
      setAssignedReports(reports);

      // Map external assignments - usa externalMaintainer invece di maintainerType
      const assignments = {};
      reports.forEach(report => {
        console.log(`🔍 Report ${report.id}:`, {
          hasExternal: !!report.externalMaintainer,
          externalData: report.externalMaintainer
        });
        
        // Check if assigned to external maintainer usando externalMaintainer
        if (report.externalMaintainer?.id) {
          console.log(`✅ Report ${report.id} è assegnato a external maintainer:`, report.externalMaintainer);
          assignments[report.id] = report.externalMaintainer;
        }
      });
      
      console.log('🔍 External assignments mapped:', assignments);

    } catch (err) {
      console.error('❌ Error fetching reports:', err);
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
      console.log('Report deselected');
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
      console.log('Report selected:', report.title, report.latitude, report.longitude);
    }
  };

  // Open photos modal
  const handleOpenPhotos = (report, e) => {
    e.stopPropagation();
    const photos = report.photoUrls || [];
    console.log('Photos to display:', photos);
    
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

  // Open assign to external maintainer modal
  const handleOpenAssignModal = async (report, e) => {
    e.stopPropagation();
    
    // Prevent opening if already assigned to external maintainer
    if (report.externalMaintainer?.id) {
      console.log('Report già assegnato a external maintainer:', report.externalMaintainer);
      return;
    }
    
    setSelectedReport(report);
    setSelectedMaintainer('');
    setAssignError('');
    setAssignSuccess('');
    setShowAssignModal(true);
    
    // Load external maintainers
    try {
      setLoadingMaintainers(true);
      const maintainers = await API.getExternalMaintainers();
      console.log('🔍 External maintainers loaded:', maintainers);
      setExternalMaintainers(maintainers);
    } catch (err) {
      console.error('Failed to load external maintainers:', err);
      setAssignError('Failed to load external maintainers');
    } finally {
      setLoadingMaintainers(false);
    }
  };

  // Close assign modal
  const handleCloseAssignModal = () => {
    setShowAssignModal(false);
    setSelectedReport(null);
    setSelectedMaintainer('');
    setAssignError('');
    setAssignSuccess('');
  };

  // Submit assignment to external maintainer
  const handleSubmitAssignment = async () => {
    if (!selectedMaintainer) {
      setAssignError('Please select an external maintainer');
      return;
    }

    try {
      setSubmitting(true);
      setAssignError('');
      
      await API.assignReportToExternalMaintainer(selectedReport.id, Number.parseInt(selectedMaintainer, 10));
      
      setAssignSuccess(`Report successfully assigned to external maintainer!`);
      
      // Refresh reports and close modal after delay
      setTimeout(() => {
        setShowAssignModal(false);
        setTimeout(() => {
          fetchAssignedReports();
          setSelectedReport(null);
          setSelectedMaintainer('');
          setAssignError('');
          setAssignSuccess('');
        }, 300);
      }, 1500);
      
    } catch (err) {
      setAssignError(err.message || 'Failed to assign report to external maintainer');
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

  // Format comment time - only time
  const formatCommentTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Format comment date - full date for separators
  const formatCommentDate = (dateString) => {
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
  };

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
            background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
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
    return report.photoUrls?.length > 0;
  };

  // Check if report can be assigned to external maintainer
  const canAssignToExternal = (report) => {
    console.log(`🔍 canAssignToExternal per report ${report.id}:`, {
      userType: user?.type,
      hasExternal: !!report.externalMaintainer,
      status: report.status
    });
    
    // Verifica che l'utente sia un municipal worker
    const municipalWorkerRoles = [
      'urban_planner',
      'building_permit_officer',
      'building_inspector',
      'suap_officer',
      'public_works_engineer',
      'mobility_traffic_engineer',
      'environment_technician',
      'municipal_public_relations_officer',
      'municipal_administrator',
      'technical_office_staff_member',
    ];

    if (!user || !municipalWorkerRoles.includes(user.type)) {
      console.log(`❌ User non è municipal worker`);
      return false;
    }
    
    // Non mostrare il pulsante se già assegnato a external maintainer
    if (report.externalMaintainer?.id) {
      console.log(`❌ Report già assegnato a external maintainer`);
      return false;
    }
    
    // Mostra il pulsante solo per report accepted, progress, o assigned
    const canAssign = ['accepted', 'progress', 'assigned'].includes(report.status);
    console.log(`${canAssign ? '✅' : '❌'} Status check: ${report.status}`);
    return canAssign;
  };

  // Check if report is already assigned to external maintainer
  const isAssignedToExternal = (report) => {
    const isAssigned = report.externalMaintainer?.id;
    console.log(`🔍 isAssignedToExternal per report ${report.id}: ${isAssigned}`);
    return isAssigned;
  };

  // Get external maintainer info for assigned report
  const getExternalMaintainerInfo = (report) => {
    if (report.externalMaintainer?.id) {
      return report.externalMaintainer;
    }
    return null;
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
          {/* Map Section */}
          <Col lg={6} className="d-flex flex-column">
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

          {/* Assigned Reports Section  */}
          <Col lg={6} className="d-flex flex-column">
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
                  <Badge bg="light" text="dark" className="ms-2" style={{ fontSize: 'clamp(0.75rem, 2vw, 0.9rem)' }}>
                    {assignedReports.length}
                  </Badge>
                </h4>
              </Card.Header>
              <Card.Body className="p-2 p-md-3" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
                {/* Loading State */}
                {loading && (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-3 text-muted">Loading assigned reports...</p>
                  </div>
                )}

                {/* Empty State */}
                {!loading && !error && assignedReports.length === 0 && (
                  <div className="text-center py-5">
                    <i className="bi bi-inbox" style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', color: '#dee2e6' }}></i>
                    <p className="mt-3 text-muted" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>
                      No reports assigned to you
                    </p>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <Alert variant="danger" dismissible onClose={() => setError('')}>
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
                            border: isSelected ? '0.125rem solid #0d6efd' : '0.0625rem solid #e0e0e0',
                            borderRadius: '0.75rem',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleReportClick(report)}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.transform = 'translateY(-0.125rem)';
                              e.currentTarget.style.boxShadow = '0 0.5rem 1rem rgba(0,0,0,0.15)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '';
                            }
                          }}
                        >
                        <Card.Body className="p-3">
                          {/* Report Header */}
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0 fw-bold" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)' }}>
                              {report.title}
                            </h6>
                            <Badge bg={getStatusBadgeVariant(report.status)} style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)' }}>
                              {report.status}
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
                                bg="primary"
                                style={{
                                  fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  backgroundColor: '#5e7bb3'
                                }}
                                onClick={(e) => handleOpenPhotos(report, e)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#4a6fa5';
                                  e.currentTarget.style.transform = 'scale(1.05)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#5e7bb3';
                                  e.currentTarget.style.transform = 'scale(1)';
                                }}
                              >
                                <i className="bi bi-image me-1"></i>
                                <span>
                                  {countPhotos(report)} photo{countPhotos(report) === 1 ? '' : 's'}
                                </span>
                                <i
                                  className="bi bi-box-arrow-up-right ms-1"
                                  style={{ fontSize: '0.7em' }}
                                ></i>
                              </Badge>
                            </div>
                          )}

                          {/* Assign to External Maintainer Button OR Assigned Info */}
                          {isAssignedToExternal(report) ? (
                            // Show assigned info if already assigned to external
                            <div className="mb-3">
                              <Card style={{
                                border: '2px solid #5e7bb3',
                                borderRadius: '0.75rem',
                                backgroundColor: '#e8f0ff',
                                boxShadow: '0 2px 6px rgba(94, 123, 179, 0.15)'
                              }}>
                                <Card.Body className="p-2 px-3">
                                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                                    <Badge bg="primary" style={{ 
                                      fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                                      padding: '0.4rem 0.7rem',
                                      whiteSpace: 'nowrap',
                                      backgroundColor: '#5e7bb3'
                                    }}>
                                      <i className="bi bi-person-check-fill me-1"></i>Assigned to External
                                    </Badge>
                                    <div style={{ 
                                      fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                      color: '#3d5a8f',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem'
                                    }}>
                                      <i className="bi bi-person-gear"></i>
                                      <strong>
                                        {getExternalMaintainerInfo(report).name} {getExternalMaintainerInfo(report).surname}
                                      </strong>
                                      <span className="text-muted" style={{ fontSize: '0.9em' }}>
                                        (@{getExternalMaintainerInfo(report).username})
                                      </span>
                                    </div>
                                  </div>
                                </Card.Body>
                              </Card>
                            </div>
                          ) : (
                            // Show assign button if not assigned yet
                            canAssignToExternal(report) && (
                              <div className="mb-3">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={(e) => handleOpenAssignModal(report, e)}
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
                                  <i className="bi bi-person-gear me-2"></i>Assign to External Maintainer
                                </Button>
                              </div>
                            )
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

      {/* Assign to External Maintainer Modal */}
      <Modal show={showAssignModal} onHide={handleCloseAssignModal} centered size="lg">
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
            <i className="bi bi-person-gear me-2" style={{ fontSize: '1.5rem' }}></i>Assign to External Maintainer
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4" style={{ backgroundColor: '#f8f9fa' }}>
          {assignError && (
            <Alert variant="danger" dismissible onClose={() => setAssignError('')} style={{ 
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              borderRadius: '0.75rem',
              border: 'none',
              boxShadow: '0 2px 8px rgba(220, 53, 69, 0.2)'
            }}>
              <i className="bi bi-exclamation-triangle me-2"></i>
              {assignError}
            </Alert>
          )}
          {assignSuccess && (
            <Alert variant="success" style={{ 
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              borderRadius: '0.75rem',
              border: 'none',
              boxShadow: '0 2px 8px rgba(25, 135, 84, 0.2)'
            }}>
              <i className="bi bi-check-circle me-2"></i>
              {assignSuccess}
            </Alert>
          )}
          
          {selectedReport && (
            <>
              {/* Report Details */}
              <Card className="mb-3" style={{ 
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
                      {selectedReport.category}
                    </Badge>
                    <Badge bg={getStatusBadgeVariant(selectedReport.status)} style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                      {selectedReport.status}
                    </Badge>
                  </div>
                </Card.Body>
              </Card>

              {/* External Maintainer Select */}
              <Form.Group className="mb-3" style={{
                backgroundColor: 'white',
                padding: '1.25rem',
                borderRadius: '0.75rem',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
              }}>
                <Form.Label className="fw-semibold" style={{ 
                  fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
                  color: '#2c3e50',
                  marginBottom: '0.75rem'
                }}>
                  <i className="bi bi-person-gear me-2" style={{ color: '#5e7bb3' }}></i>Select External Maintainer *
                </Form.Label>
                {loadingMaintainers ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" size="sm" className="me-2" style={{ color: '#5e7bb3' }} />
                    <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)', color: '#6c757d' }}>Loading external maintainers...</span>
                  </div>
                ) : (
                  <Form.Select
                    value={selectedMaintainer}
                    onChange={(e) => setSelectedMaintainer(e.target.value)}
                    style={{ 
                      fontSize: 'clamp(0.9rem, 2vw, 1rem)', 
                      borderRadius: '0.5rem',
                      border: '2px solid #e0e0e0',
                      padding: '0.75rem',
                      transition: 'all 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#5e7bb3';
                      e.currentTarget.style.boxShadow = '0 0 0 0.2rem rgba(94, 123, 179, 0.25)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#e0e0e0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    disabled={externalMaintainers.length === 0}
                  >
                    <option value="">Select an external maintainer...</option>
                    {externalMaintainers.map((maintainer) => (
                      <option key={maintainer.id} value={maintainer.id}>
                        {maintainer.name} {maintainer.surname} ({maintainer.username})
                      </option>
                    ))}
                  </Form.Select>
                )}
                <Form.Text className="text-muted" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                  The selected external maintainer will be responsible for this report
                </Form.Text>
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
            onClick={handleCloseAssignModal}
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
            Cancel
          </Button>
          <Button 
            variant="primary"
            onClick={handleSubmitAssignment}
            disabled={submitting || loadingMaintainers || !selectedMaintainer}
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
              if (!submitting && !loadingMaintainers && selectedMaintainer) {
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
                Assigning...
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i>Confirm Assignment
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Comments/Messages Modal */}
      <Modal show={showCommentsModal} onHide={handleCloseCommentsModal} centered size="lg">
        <Modal.Header closeButton style={{ 
          background: 'linear-gradient(135deg, #5e7bb3 0%, #7c93c3 100%)', 
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
              }}></i>
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
                    {selectedReport.status}
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
                      <img 
                        key={index}
                        src={photoUrl}
                        alt={`Photo ${index + 1}`}
                        style={{ 
                          width: '60px',
                          height: '60px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease, border-color 0.2s ease'
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPhotos(selectedReport, e);
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'scale(1.05)';
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.6)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'scale(1)';
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal.Header>
        <Modal.Body style={{ 
          backgroundColor: '#f8fafc',
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
                    background: 'linear-gradient(135deg, #5e7bb3 0%, #7c93c3 100%)',
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

TechnicalOfficeStaffMember.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    surname: PropTypes.string,
    type: PropTypes.string,
  }),
};

