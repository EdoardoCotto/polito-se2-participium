// components/CitizenPage.jsx
import { Container, Card, Row, Col, Button, Form, Alert, Modal, Dropdown, ListGroup, Badge, InputGroup, Carousel, Toast, ToastContainer } from 'react-bootstrap';
import { useState, useEffect, useMemo} from 'react';
import PropTypes from 'prop-types';
import TurinMap from './TurinMap';
import API from '../API/API.js';

export default function CitizenPage({ user }) {
  const [selectedLocation, setSelectedLocation] = useState(null); 
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

   // View mode state - 'create' or 'view'
  const [viewMode, setViewMode] = useState('create');
  const [allReports, setAllReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [highlightedReportId, setHighlightedReportId] = useState(null);
  
  // Filtering and search state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Report detail modal state
  const [showReportDetailModal, setShowReportDetailModal] = useState(false);
  const [selectedReportDetail, setSelectedReportDetail] = useState(null);
  const [showReportPhotosModal, setShowReportPhotosModal] = useState(false);
  const [selectedReportPhotos, setSelectedReportPhotos] = useState([]);

  // Street area state
  const [selectedStreetArea, setSelectedStreetArea] = useState(null);
  const [searchingStreet, setSearchingStreet] = useState(false);
  const [streetSearchQuery, setStreetSearchQuery] = useState(''); // Nuovo stato separato per la ricerca via
  const [streetSuggestions, setStreetSuggestions] = useState([]); // Nuovo stato per i suggerimenti delle vie
  const [showSuggestions, setShowSuggestions] = useState(false); // Stato per mostrare/nascondere i suggerimenti

  // Notifications state - ADD THIS
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Chat with Municipality state - ADD THIS after notification states
  const [showMunicipalityChat, setShowMunicipalityChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedReportForChat, setSelectedReportForChat] = useState(null);

  // ADD THIS STATE
  const [myReports, setMyReports] = useState([]);
  const [loadingMyReports, setLoadingMyReports] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await API.getCategories();
        setCategories(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        // no-op
      }
    };

    fetchCategories();
  }, []);

  // Nuovo useEffect per il debounce della ricerca delle vie
  useEffect(() => {
    const delayTimer = setTimeout(async () => {
      if (streetSearchQuery.trim().length >= 3) {
        try {
          const streets = await API.getStreets(streetSearchQuery);
          setStreetSuggestions(streets); // Nuovo state
          setShowSuggestions(true);
        } catch (err) {
          console.error('Error fetching streets:', err);
        }
      }
    }, 300);

    return () => clearTimeout(delayTimer);
  }, [streetSearchQuery]);

  // Fetch messages for a report - ADD THIS
const fetchMessages = async (reportId) => {
  try {
    setLoadingMessages(true);
    setMessageError('');
    
    console.log('🔍 Fetching messages for report:', reportId);
    const messages = await API.getMessages(reportId);
    console.log('📨 Messages received:', messages);
    
    setChatMessages(messages || []);
  } catch (err) {
    console.error('❌ Failed to load messages:', err);
    setMessageError(err.message || 'Failed to load messages');
    setChatMessages([]);
  } finally {
    setLoadingMessages(false);
  }
};

// ADD THIS FUNCTION - Fetch citizen's own reports
const fetchMyReports = async () => {
  try {
    setLoadingMyReports(true);
    setReportsError('');
    const reports = await API.getMyCitizenReports();
    console.log('📋 My reports:', reports);
    setMyReports(reports);
    setAllReports(reports); // Use the same state for filtering
    setTimeout(() => setSelectedLocation(null), 100);
  } catch (err) {
    console.error('Failed to fetch my reports:', err);
    setReportsError(err.message || 'Failed to load your reports');
  } finally {
    setLoadingMyReports(false);
  }
};

// Send message to municipality - ADD THIS
const handleSendMessage = async () => {
  if (!newMessage.trim() || !selectedReportForChat) {
    setMessageError('Please enter a message');
    return;
  }

  try {
    setSendingMessage(true);
    setMessageError('');
    
    console.log('📤 Sending message for report:', selectedReportForChat.id);
    await API.createMessage(selectedReportForChat.id, newMessage.trim());
    
    setNewMessage('');
    
    // Refresh messages
    await fetchMessages(selectedReportForChat.id);
    
  } catch (err) {
    console.error('❌ Failed to send message:', err);
    setMessageError(err.message || 'Failed to send message');
  } finally {
    setSendingMessage(false);
  }
};

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

    console.log('isAnonymous before submit:', isAnonymous); // Debug

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
      console.log('Creating report with isAnonymous:', isAnonymous); // Debug
      
      // Use createAnonymousReport if isAnonymous is true, otherwise createReport
      const apiMethod = isAnonymous 
        ? (await import('../API/API.js')).default.createAnonymousReport
        : (await import('../API/API.js')).default.createReport;

      console.log('API method selected:', isAnonymous ? 'createAnonymousReport' : 'createReport'); // Debug

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
      
      console.log('Resetting form, isAnonymous before reset:', isAnonymous); // Debug
      
      setTitle('');
      setCategory('');
      setDescription('');
      setPhotos([]);
      setSelectedLocation(null);
      setIsAnonymous(false); // Reset to false after submit
      
      console.log('isAnonymous after reset:', false); // Debug
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSubmitOk('');
      }, 3000);
    } catch (err) {
      setSubmitError(err.message || 'An error occurred while creating the report.');
      console.error('Error creating report:', err); // Debug
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
    } else if (mode === 'myReports') {
    // Fetch only current user's reports - ADD THIS
    await fetchMyReports();
    } else if (mode === 'create') {
      // Clear reports and street area when switching to create mode
      setAllReports([]);
      setSelectedStreetArea(null); 
      setStreetSearchQuery(''); 
      setStreetSuggestions([]); 
      setShowSuggestions(false); 
      setTimeout(() => setSelectedLocation(null), 100);
    }
  };

  // Open municipality chat - ADD THIS
    const handleOpenMunicipalityChat = async (report) => {
      setSelectedReportForChat(report);
      setChatMessages([]);
      setNewMessage('');
      setMessageError('');
      setShowMunicipalityChat(true);
      await fetchMessages(report.id);
    };

    // Close municipality chat - ADD THIS
    const handleCloseMunicipalityChat = () => {
      setShowMunicipalityChat(false);
      setSelectedReportForChat(null);
      setChatMessages([]);
      setNewMessage('');
      setMessageError('');
    };

    // Render chat message - ADD THIS
    const renderChatMessage = (message, idx) => {
      const isCurrentUser = message.authorId === user.id;
      const displayTime = new Date(message.created_at).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      const messageText = message.message || message.comment || message.text || '';
      const authorName = message.name || message.senderName || message.authorName || '';
      const authorSurname = message.surname || message.senderSurname || message.authorSurname || '';

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
              ? 'linear-gradient(135deg, #28a745 0%, #20c997 100%)'
              : 'linear-gradient(135deg, #5e7bb3 0%, #4a5f8f 100%)',
            color: '#fff',
            padding: '1rem 1.3rem',
            borderRadius: isCurrentUser
              ? '1.5rem 1.5rem 0.3rem 1.5rem'
              : '1.5rem 1.5rem 1.5rem 0.3rem',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
            position: 'relative',
            wordBreak: 'break-word'
          }}>
            {!isCurrentUser && (
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                marginBottom: '0.5rem',
                opacity: 0.9
              }}>
                {authorName} {authorSurname}
                <span style={{
                  marginLeft: '0.5rem',
                  fontWeight: '500',
                  opacity: 0.8,
                  fontSize: '0.7rem'
                }}>
                  (Municipality)
                </span>
              </div>
            )}
            <div style={{
              fontSize: '0.95rem',
              lineHeight: '1.5',
              marginBottom: '0.5rem'
            }}>
              {messageText || '(No message text)'}
            </div>
            <div style={{
              fontSize: '0.7rem',
              opacity: 0.8,
              textAlign: 'right',
              fontWeight: '500'
            }}>
              {displayTime}
            </div>
          </div>
        </div>
      );

    };

    // Render chat messages content - ADD THIS
    const renderChatMessagesContent = () => {
      if (loadingMessages) {
        return (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" style={{ width: '2.5rem', height: '2.5rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted fw-medium">Loading messages...</p>
          </div>
        );
      }

      if (messageError && chatMessages.length === 0) {
        return (
          <Alert variant="danger" style={{ 
            borderRadius: '1rem',
            border: 'none',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
            background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)'
          }}>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {messageError}
          </Alert>
        );
      }

      if (chatMessages.length === 0) {
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

      return chatMessages.map((message, idx) => renderChatMessage(message, idx));
    };

  // Handle report marker click in view mode - Show detail modal
  const handleReportMarkerClick = (report) => {
    setSelectedReportDetail(report);
    setShowReportDetailModal(true);
    setHighlightedReportId(report.id);
    if (report?.latitude && report?.longitude) {
      setSelectedLocation({
        lat: report.latitude,
        lng: report.longitude,
        reportId: report.id,
        title: report.title
      });
    }
  };

  // Handle report click in the list - show detail modal
  const handleReportListClick = (reportId) => {
    const report = allReports.find(r => r.id === reportId);
    if (report) {
      setSelectedReportDetail(report);
      setShowReportDetailModal(true);
      setHighlightedReportId(reportId);
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
  
  // Handle viewing report photos
  const handleViewReportPhotos = (report, e) => {
    e.stopPropagation();
    if (report.photoUrls && report.photoUrls.length > 0) {
      setSelectedReportPhotos(report.photoUrls);
      setShowReportPhotosModal(true);
    }
  };
  
  // Modified filtered reports to include street search
  const filteredReports = useMemo(() => {
    let filtered = [...allReports];
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(query) ||
        report.description?.toLowerCase().includes(query) ||
        report.category.toLowerCase().includes(query) ||
        report.address?.toLowerCase().includes(query)
      );
    }
    
    if (filterCategory) {
      filtered = filtered.filter(report => report.category === filterCategory);
    }
    
    if (filterStatus) {
      filtered = filtered.filter(report => report.status === filterStatus);
    }
    
    return filtered;
  }, [allReports, searchQuery, filterCategory, filterStatus]);
  
  // Get unique categories and statuses
  const availableCategories = useMemo(() => {
    return [...new Set(allReports.map(r => r.category))].sort((a, b) => a.localeCompare(b));
  }, [allReports]);
  
  const availableStatuses = useMemo(() => {
    return [...new Set(allReports.map(r => r.status))].sort((a, b) => a.localeCompare(b));
  }, [allReports]);

  // Memoized content for Report Photos Modal to avoid nested ternaries and noisy inline logic
  const reportPhotosContent = useMemo(() => {
    if (selectedReportPhotos.length === 0) {
      return (
        <div className="text-center py-5">
          <i className="bi bi-image" style={{ fontSize: '3rem', color: '#dee2e6' }}></i>
          <p className="mt-3 text-muted">No photos available</p>
        </div>
      );
    }

    if (selectedReportPhotos.length === 1) {
      return (
        <div className="report-photo-single-container">
          <img
            src={selectedReportPhotos[0]}
            alt="Report visual detail"
            className="report-photo-single-image"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
      );
    }

    return (
      <Carousel interval={null} className="report-photos-carousel">
        {selectedReportPhotos.map((photo, index) => (
          <Carousel.Item key={photo}>
            <div className="report-photo-container">
              <img
                src={photo}
                alt={`Report visual detail ${index + 1}`}
                className="report-photo-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
            <Carousel.Caption className="report-photo-caption">
              <p>Photo {index + 1} of {selectedReportPhotos.length}</p>
            </Carousel.Caption>
          </Carousel.Item>
        ))}
      </Carousel>
    );
  }, [selectedReportPhotos]);

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
      'progress': 'info',
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
      case 'myReports':
        return 'My Reports';
      default:
        return 'Create Report';
    }
  };

  // Helper functions to reduce cognitive complexity
  const getMapTitle = () => {
     switch (viewMode) {
    case 'create':
      return 'Select a location on the map';
    case 'view':
      return 'All Reports Map View';
    case 'myReports':
      return 'My Reports Map View';
    default:
      return 'Select a location on the map';
  }
  };

  const getMapTitleMobile = () => {
    switch (viewMode) {
    case 'create':
      return 'Select Location';
    case 'view':
      return 'All Reports';
    case 'myReports':
      return 'My Reports';
    default:
      return 'Select Location';
    }
  };

  const getReportCountBadge = () => {
    if ((viewMode !== 'view' && viewMode !== 'myReports') || allReports.length === 0) return null;
  
  const count = filteredReports.length === allReports.length 
    ? allReports.length 
    : `${filteredReports.length}/${allReports.length}`;
  const label = filteredReports.length === 1 ? 'report' : 'reports';
  
  return `${count} ${label}`;
};

  const getLocationStatusStyles = () => {
    return {
      className: `p-2 p-md-3 rounded ${selectedLocation ? 'bg-light border border-success' : 'bg-light border border-secondary'}`,
      style: { borderRadius: '8px', fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }
    };
  };

  const getAnonymousModeStyles = () => {
    return {
      backgroundColor: isAnonymous ? '#fff3cd' : '#e8f0ff',
      border: `1px solid ${isAnonymous ? '#ffc107' : '#5e7bb3'}`,
      transition: 'all 0.3s ease'
    };
  };

  const getAnonymousIconStyles = () => {
    return {
      className: `bi ${isAnonymous ? 'bi-incognito' : 'bi-person-badge'} me-2`,
      style: { fontSize: '1.5rem', color: isAnonymous ? '#856404' : '#5e7bb3' }
    };
  };

  const getAnonymousModeText = () => {
    return {
      title: isAnonymous ? 'Anonymous Report' : 'Public Report',
      subtitle: isAnonymous ? 'Your identity will not be shown' : 'Your username will be visible'
    };
  };

  const getSubmitButtonContent = () => {
    if (submitting) {
      return (
        <>
          <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          <output>Submitting...</output>
        </>
      );
    }
    
    return (
      <>
        <i className={`bi ${isAnonymous ? 'bi-incognito' : 'bi-send'} me-2`}></i>
        {isAnonymous ? 'Submit Anonymous Report' : 'Submit Report'}
      </>
    );
  };

  const getViewModeIcon = () => {
    switch (viewMode) {
    case 'create':
      return 'bi-file-earmark-plus';
    case 'view':
      return 'bi-eye';
    case 'myReports':
      return 'bi-person-lines-fill';
    default:
      return 'bi-file-earmark-plus';
    }
  };

  // Handle street suggestion selection
  const handleStreetSuggestionClick = (streetName) => {
    setStreetSearchQuery(streetName);
    setShowSuggestions(false);
    // Automatically trigger search when selecting a suggestion
    setTimeout(() => {
      handleStreetSearchWithName(streetName);
    }, 100);
  };

  // Search for street area with specific name
  const handleStreetSearchWithName = async (name) => {
    const searchName = name || streetSearchQuery.trim();
    
    if (!searchName || searchName.length < 3) {
      return;
    }
    
    try {
      setSearchingStreet(true);
      const data = await API.getReportsByStreet(searchName);
      console.log('Street search data:', data);
      
      if (data.mapFocus) {
        setSelectedStreetArea({
          center: data.mapFocus.center,
          boundingBox: data.mapFocus.boundingBox,
          geometry: data.street.geometry,
          streetName: searchName
        });
        
        setSelectedLocation(null);
      }
      
      setAllReports(data.reports || []);
      
      // Hide suggestions
      setShowSuggestions(false);
      
    } catch (err) {
      console.log('Street search did not return results');
      setReportsError(err.message || 'Street not found or no reports in this area');
    } finally {
      setSearchingStreet(false);
    }
  };

  // Search for street area
  const handleStreetSearch = async () => {
    await handleStreetSearchWithName();
  };

  // Clear street area filter
  const handleClearStreetArea = () => {
    setSelectedStreetArea(null);
    setStreetSearchQuery('');
    setStreetSuggestions([]);
    setShowSuggestions(false);
    // Reload all reports
    handleViewModeChange('view');
  };

  // Handle closing report detail modal and deselecting report
  const handleCloseReportDetail = () => {
    setShowReportDetailModal(false);
    setSelectedReportDetail(null);
    setHighlightedReportId(null);
    setSelectedLocation(null);
  };

  // Fetch notifications - ADD THIS
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const allNotifications = await API.getNotifications();
      const unread = await API.getUnreadNotifications();
      setNotifications(allNotifications);
      setUnreadCount(unread.length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Poll notifications every 10 minutes - ADD THIS
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 600000); // Poll every 10 minutes
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  // Mark notification as read - ADD THIS
  const handleMarkAsRead = async (notificationId) => {
    try {
      await API.markNotificationAsRead(notificationId);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  // Mark all notifications as read - ADD THIS
  const handleMarkAllAsRead = async () => {
    try {
      await API.markAllNotificationsAsRead();
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  // Delete notification - ADD THIS
  const handleDeleteNotification = async (notificationId) => {
    try {
      await API.deleteNotification(notificationId);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  // Format notification date - ADD THIS
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="app-root d-flex flex-column min-vh-100">
      {/* ADD THIS: Notification Bell Button - Improved and Responsive */}
      <div style={{
        position: 'fixed',
        top: 'clamp(70px, 10vh, 80px)',
        right: 'clamp(10px, 2vw, 20px)',
        zIndex: 1000
      }}>
        <Button
          variant={unreadCount > 0 ? 'danger' : 'primary'}
          onClick={() => setShowNotifications(!showNotifications)}
          className="notification-bell-button"
          style={{
            borderRadius: '50%',
            width: 'clamp(50px, 8vw, 65px)',
            height: 'clamp(50px, 8vw, 65px)',
            position: 'relative',
            boxShadow: unreadCount > 0 
              ? '0 6px 20px rgba(220, 53, 69, 0.4), 0 0 30px rgba(220, 53, 69, 0.2)'
              : '0 6px 20px rgba(94, 123, 179, 0.4)',
            border: '3px solid white',
            background: unreadCount > 0 
              ? 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)'
              : 'linear-gradient(135deg, #5e7bb3 0%, #7b9fd9 100%)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: showNotifications ? 'scale(0.95)' : 'scale(1)',
            animation: unreadCount > 0 ? 'bellShake 2s ease-in-out infinite' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = unreadCount > 0
              ? '0 8px 28px rgba(220, 53, 69, 0.5), 0 0 40px rgba(220, 53, 69, 0.3)'
              : '0 8px 28px rgba(94, 123, 179, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = showNotifications ? 'scale(0.95)' : 'scale(1)';
            e.currentTarget.style.boxShadow = unreadCount > 0
              ? '0 6px 20px rgba(220, 53, 69, 0.4), 0 0 30px rgba(220, 53, 69, 0.2)'
              : '0 6px 20px rgba(94, 123, 179, 0.4)';
          }}
        >
          <i 
            className={`bi ${unreadCount > 0 ? 'bi-bell-fill' : 'bi-bell'}`}
            style={{ 
              fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2))',
              animation: unreadCount > 0 ? 'bellRing 1s ease-in-out infinite' : 'none'
            }}
          ></i>
          {unreadCount > 0 && (
            <>
              {/* Pulsating ring effect */}
              <div style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                bottom: '-4px',
                left: '-4px',
                borderRadius: '50%',
                border: '2px solid rgba(220, 53, 69, 0.5)',
                animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }} />
              
              {/* Badge with improved styling */}
              <Badge
                bg="light"
                text="danger"
                pill
                style={{
                  position: 'absolute',
                  top: '-3px',
                  right: '-3px',
                  fontSize: 'clamp(0.65rem, 1.5vw, 0.75rem)',
                  fontWeight: '800',
                  minWidth: 'clamp(20px, 4vw, 24px)',
                  height: 'clamp(20px, 4vw, 24px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid white',
                  boxShadow: '0 2px 8px rgba(220, 53, 69, 0.4)',
                  background: 'linear-gradient(135deg, #fff 0%, #ffe0e0 100%)',
                  animation: 'badge-pop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                  padding: 'clamp(2px, 0.5vw, 4px)'
                }}
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            </>
          )}
        </Button>
      </div>

      {/* ADD THIS: Notifications Panel - Fully Responsive */}
      <div style={{
        position: 'fixed',
        top: 'clamp(140px, 18vh, 150px)',
        right: showNotifications ? 'clamp(10px, 2vw, 20px)' : '-100vw',
        width: 'clamp(280px, 90vw, 380px)',
        maxWidth: '95vw',
        maxHeight: 'calc(100vh - clamp(160px, 20vh, 170px))',
        backgroundColor: 'white',
        borderRadius: 'clamp(12px, 2vw, 16px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        transition: 'right 0.3s ease-in-out',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Notifications Header */}
        <div style={{
          padding: 'clamp(1rem, 2.5vw, 1.25rem)',
          background: 'linear-gradient(135deg, #5e7bb3 0%, #7b9fd9 100%)',
          color: 'white',
          borderTopLeftRadius: 'clamp(12px, 2vw, 16px)',
          borderTopRightRadius: 'clamp(12px, 2vw, 16px)'
        }}>
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0 fw-bold" style={{ fontSize: 'clamp(1rem, 3vw, 1.25rem)' }}>
              <i className="bi bi-bell-fill me-2"></i>Notifications
            </h5>
            <Button
              variant="link"
              size="sm"
              className="text-white p-0"
              onClick={() => setShowNotifications(false)}
              style={{ textDecoration: 'none' }}
            >
              <i className="bi bi-x-lg" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)' }}></i>
            </Button>
          </div>
          {unreadCount > 0 && (
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <small style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' }}>
                {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
              </small>
              <Button
                variant="link"
                size="sm"
                className="text-white p-0"
                onClick={handleMarkAllAsRead}
                style={{ 
                  textDecoration: 'underline', 
                  fontSize: 'clamp(0.75rem, 2vw, 0.85rem)' 
                }}
              >
                Mark all as read
              </Button>
            </div>
          )}
        </div>

        {/* Notifications List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'clamp(0.25rem, 1vw, 0.5rem)'
        }}>
          {loadingNotifications ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" style={{ 
                width: 'clamp(1.5rem, 4vw, 2rem)', 
                height: 'clamp(1.5rem, 4vw, 2rem)' 
              }}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-bell-slash" style={{ 
                fontSize: 'clamp(2rem, 6vw, 3rem)', 
                color: '#dee2e6' 
              }}></i>
              <p className="mt-3 text-muted" style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)' }}>
                No notifications yet
              </p>
            </div>
          ) : (
            <ListGroup variant="flush">
              {notifications.map((notification) => (
                <ListGroup.Item
                  key={notification.id}
                  style={{
                    backgroundColor: notification.is_read ? 'white' : '#f0f7ff',
                    border: 'none',
                    borderBottom: '1px solid #e9ecef',
                    borderRadius: 'clamp(6px, 1.5vw, 8px)',
                    marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)',
                    padding: 'clamp(0.75rem, 2vw, 1rem)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = notification.is_read ? '#f8f9fa' : '#e3f2fd';
                    e.currentTarget.style.transform = 'translateX(-4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = notification.is_read ? 'white' : '#f0f7ff';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                  onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center flex-grow-1">
                      {!notification.is_read && (
                        <div style={{
                          width: 'clamp(6px, 1.5vw, 8px)',
                          height: 'clamp(6px, 1.5vw, 8px)',
                          borderRadius: '50%',
                          backgroundColor: '#dc3545',
                          marginRight: 'clamp(6px, 1.5vw, 8px)',
                          flexShrink: 0
                        }} />
                      )}
                      <strong style={{
                        fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
                        color: '#2c3e50',
                        fontWeight: notification.is_read ? '600' : '700',
                        lineHeight: '1.3'
                      }}>
                        {notification.title}
                      </strong>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-danger p-0 ms-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      style={{ flexShrink: 0 }}
                    >
                      <i className="bi bi-x-circle" style={{ fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}></i>
                    </Button>
                  </div>
                  <p style={{
                    fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)',
                    color: '#6c757d',
                    marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)',
                    lineHeight: '1.4'
                  }}>
                    {notification.message}
                  </p>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <small className="text-muted" style={{ fontSize: 'clamp(0.7rem, 1.6vw, 0.75rem)' }}>
                      <i className="bi bi-clock me-1"></i>
                      {formatNotificationDate(notification.created_at)}
                    </small>
                    {notification.reportId && (
                      <Badge bg="primary" style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.7rem)' }}>
                        Report #{notification.reportId}
                      </Badge>
                    )}
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
      </div>

      <Container fluid className="flex-grow-1 py-2 py-md-4 px-2 px-md-3">
        <Row className="g-2 g-md-4">
          {/* Map */}
          <Col lg={8} className="order-1 order-lg-1">
            <Card className="citizen-card map-card shadow h-100" style={{ border: '1px solid #e0e0e0', minHeight: '750px' }}>
              <Card.Header style={{ backgroundColor: '#5e7bb3', color: 'white', padding: 'clamp(0.5rem, 2vw, 1rem)' }}>
                <Card.Title className="mb-0 d-flex align-items-center justify-content-between flex-wrap" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-pin-map me-2"></i>
                    <span className="d-none d-sm-inline">{getMapTitle()}</span>
                    <span className="d-inline d-sm-none">{getMapTitleMobile()}</span>
                    {getReportCountBadge() && (
                      <span className="badge bg-light text-dark ms-2" style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)' }}>
                        {getReportCountBadge()}
                      </span>
                    )}
                  </div>
                  {selectedStreetArea && (
                    <Badge bg="warning" text="dark" className="mt-2 mt-lg-0">
                      <i className="bi bi-geo-alt-fill me-1"></i>
                      Area: {selectedStreetArea.streetName}
                      <Button
                        variant="link"
                        size="sm"
                        className="text-dark p-0 ms-2"
                        onClick={handleClearStreetArea}
                        style={{ textDecoration: 'none' }}
                      >
                        <i className="bi bi-x-circle"></i>
                      </Button>
                    </Badge>
                  )}
                </Card.Title>
              </Card.Header>
              <Card.Body className="p-0" style={{ height: 'calc(100% - 3rem)', minHeight: '350px' }}>
                <div style={{ height: '100%', width: '100%' }}>
                  <TurinMap 
                    onLocationSelected={viewMode === 'create' ? setSelectedLocation : undefined}
                    selectedLocation={selectedLocation}
                    readOnly={viewMode === 'view' || viewMode === 'myReports'} // ADD myReports here
                    allReports={(viewMode === 'view' || viewMode === 'myReports') ? filteredReports : []} // ADD myReports here
                    onReportMarkerClick={(viewMode === 'view' || viewMode === 'myReports') ? handleReportMarkerClick : undefined} // ADD myReports here
                    highlightedReportId={highlightedReportId}
                    shouldZoomToSelection={(viewMode === 'view' || viewMode === 'myReports') && highlightedReportId !== null} // ADD myReports here
                    streetArea={selectedStreetArea}
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
                      <i className={`bi ${getViewModeIcon()} me-2`}></i>
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
                      <i className="bi bi-file-earmark-plus me-2"></i>Create Report
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
                      <i className="bi bi-eye me-2"></i>View Reports on Map
                    </Dropdown.Item>
                     <Dropdown.Item 
                      active={viewMode === 'myReports'}
                      onClick={() => handleViewModeChange('myReports')}
                      className="d-flex align-items-center"
                      style={{ 
                        fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                        padding: 'clamp(0.5rem, 1.5vw, 0.75rem) clamp(0.75rem, 2vw, 1rem)'
                      }}
                    >
                      <i className="bi bi-person-lines-fill me-2"></i>My Reports
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Card.Header>
              <Card.Body className="p-2 p-md-4" style={{ maxHeight: 'calc(750px - 4rem)', overflowY: 'auto' }}>

                {/* Show loading state when fetching reports */}
                {(viewMode === 'view' || viewMode === 'myReports') && (loadingReports || loadingMyReports) && (
                  <div className="text-center py-5 report-loading-state">
                    <div className="spinner-border text-primary mb-3" aria-hidden="true" style={{ width: '3rem', height: '3rem' }}>
                      <span className="visually-hidden">Loading reports...</span>
                    </div>
                    <output className="mt-3 text-muted fw-semibold d-block">
                      {viewMode === 'myReports' ? 'Loading your reports...' : 'Loading reports...'}
                    </output>
                  </div>
                )}

                {/* Show error if reports failed to load */}
                {(viewMode === 'view' || viewMode === 'myReports') && reportsError && (
                  <Alert variant="danger" dismissible onClose={() => setReportsError('')}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {reportsError}
                  </Alert>
                )}

                {/* Show reports list when in view mode and reports loaded */}
                {(viewMode === 'view' || viewMode === 'myReports') && !loadingReports && !loadingMyReports && !reportsError && allReports.length > 0 && (
                  <div>
                    {/* Search and Filters */}
                    <div className="mb-3">
                      {/* Street Search - Separate field */}
                      <Form.Label className="fw-semibold mb-2" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                        <i className="bi bi-signpost-2 me-2"></i>Search by Street
                      </Form.Label>
                      <div className="position-relative">
                        <InputGroup className="mb-3 report-street-search-input-group">
                          <InputGroup.Text>
                            <i className={`bi ${searchingStreet ? 'bi-hourglass-split' : 'bi-signpost'}`}></i>
                          </InputGroup.Text>
                          <Form.Control
                            type="text"
                            placeholder="e.g., Via Roma, Corso Vittorio..."
                            value={streetSearchQuery}
                            onChange={(e) => setStreetSearchQuery(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && streetSearchQuery.trim().length >= 3) {
                                e.preventDefault();
                                handleStreetSearch();
                              }
                            }}
                            onFocus={() => streetSuggestions.length > 0 && setShowSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            disabled={searchingStreet}
                            className="report-street-search-input"
                            style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', borderLeft: 'none' }}
                          />
                          {streetSearchQuery && !searchingStreet && (
                            <Button
                              variant="outline-secondary"
                              onClick={() => {
                                setStreetSearchQuery('');
                                setStreetSuggestions([]);
                                setShowSuggestions(false);
                                if (selectedStreetArea) {
                                  handleClearStreetArea();
                                }
                              }}
                              style={{ borderLeft: 'none' }}
                            >
                              <i className="bi bi-x"></i>
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            onClick={handleStreetSearch}
                            disabled={searchingStreet || streetSearchQuery.trim().length < 3}
                            title="Search for street area"
                            style={{ borderLeft: 'none' }}
                          >
                            <i className="bi bi-search"></i>
                          </Button>
                        </InputGroup>
                        
                        {/* Street Suggestions Dropdown */}
                        {showSuggestions && streetSuggestions.length > 0 && (
                          <ListGroup
                            className="position-absolute w-100 shadow-lg"
                            style={{
                              zIndex: 1000,
                              maxHeight: '250px',
                              overflowY: 'auto',
                              borderRadius: '8px',
                              marginTop: '-12px',
                              border: '1px solid #dee2e6'
                            }}
                          >
                            {streetSuggestions.map((street, index) => (
                              <ListGroup.Item
                                key={`${street.street_name}-${street.city || index}`}
                                action
                                onClick={() => handleStreetSuggestionClick(street.street_name)}
                                className="d-flex align-items-center"
                                style={{
                                  cursor: 'pointer',
                                  fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                                  padding: '0.75rem 1rem',
                                  borderLeft: 'none',
                                  borderRight: 'none',
                                  borderTop: index === 0 ? 'none' : '1px solid #dee2e6'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'white';
                                }}
                              >
                                <i className="bi bi-signpost-2-fill me-2 text-primary"></i>
                                <div>
                                  <div className="fw-semibold">{street.street_name}</div>
                                  {street.city && (
                                    <small className="text-muted">{street.city}</small>
                                  )}
                                </div>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        )}
                        
                        {streetSearchQuery.trim().length >= 3 && !searchingStreet && streetSuggestions.length === 0 && (
                          <small className="text-muted d-block mt-1">
                            <i className="bi bi-info-circle me-1"></i>{' '}
                            No streets found. Press Enter to search anyway.
                          </small>
                        )}
                      </div>
                      
                      {/* Text Search */}
                      <Form.Label className="fw-semibold mb-2" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                        <i className="bi bi-search me-2"></i>{' '}Search by Text
                      </Form.Label>
                      <InputGroup className="mb-2 report-search-input-group">
                        <InputGroup.Text>
                          <i className="bi bi-search"></i>
                        </InputGroup.Text>
                        <Form.Control
                          type="text"
                          placeholder="Search by title, description, category..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="report-search-input"
                          style={{ fontSize: 'clamp(0.8rem, 2vw, 0.9rem)', borderLeft: 'none' }}
                        />
                        {searchQuery && (
                          <Button
                            variant="outline-secondary"
                            onClick={() => setSearchQuery('')}
                            style={{ borderLeft: 'none' }}
                          >
                            <i className="bi bi-x"></i>
                          </Button>
                        )}
                      </InputGroup>
                      
                      <Row className="g-2 mb-2">
                        <Col xs={6}>
                          <Form.Select
                            size="sm"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="report-filter-select"
                            style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)' }}
                          >
                            <option value="">All Categories</option>
                            {availableCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Select
                            size="sm"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="report-filter-select"
                            style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)' }}
                          >
                            <option value="">All Statuses</option>
                            {availableStatuses.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </Form.Select>
                        </Col>
                      </Row>
                      
                      {(filteredReports.length !== allReports.length || selectedStreetArea) && (
                        <Alert variant="info" className="py-2 mt-2 mb-0 report-filter-alert" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)' }}>
                          <i className="bi bi-funnel me-2"></i>
                          {selectedStreetArea && (
                            <div>
                              Showing reports in area: <strong>{selectedStreetArea.streetName}</strong>
                              {filteredReports.length !== allReports.length && (
                                <> ({filteredReports.length} of {allReports.length} reports)</>
                              )}
                            </div>
                          )}
                          {!selectedStreetArea && filteredReports.length !== allReports.length && (
                            <div>Showing {filteredReports.length} of {allReports.length} reports</div>
                          )}
                        </Alert>
                      )}
                    </div>
                    
                    <h6 className="mb-3 report-view-section-header">
                      <i className="bi bi-list-ul"></i>Click on a report to view details
                    </h6>
                    <ListGroup className="report-list-group">
                      {filteredReports.length === 0 ? (
                        <Alert variant="info" className="mt-3">
                          <i className="bi bi-info-circle me-2"></i>No reports match your filters. Try adjusting your search or filters.
                        </Alert>
                      ) : (
                        filteredReports.map((report) => (
  <ListGroup.Item
    key={report.id}
    className="mb-2 report-list-item"
    style={{ 
      borderRadius: '12px',
      border: highlightedReportId === report.id ? '2px solid #5e7bb3' : '1px solid #dee2e6',
      backgroundColor: highlightedReportId === report.id ? '#e8f0ff' : 'white',
      transition: 'all 0.3s ease',
      boxShadow: highlightedReportId === report.id ? '0 4px 12px rgba(94, 123, 179, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
    }}
  >
    <div 
      style={{ cursor: 'pointer' }}
      onClick={() => handleReportListClick(report.id)}
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
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              <i className="bi bi-calendar me-1"></i>
              {new Date(report.created_at).toLocaleDateString()}
            </small>
            {report.photoUrls && report.photoUrls.length > 0 && (
              <Badge 
                bg="info" 
                className="report-photo-badge"
                style={{ cursor: 'pointer', fontSize: 'clamp(0.7rem, 1.8vw, 0.8rem)' }}
                onClick={(e) => handleViewReportPhotos(report, e)}
              >
                <i className="bi bi-image me-1"></i>
                {report.photoUrls.length}
              </Badge>
            )}
          </div>
        </div>
        {highlightedReportId === report.id && (
          <i className="bi bi-check-circle-fill text-primary ms-2" style={{ fontSize: '1.2rem' }}></i>
        )}
      </div>
    </div>

    {/* ADD THIS: Chat Button - Only for My Reports */}
    {viewMode === 'myReports' && (
      <div className="mt-3 pt-3" style={{ borderTop: '1px solid #dee2e6' }}>
        <Button
          variant="outline-primary"
          size="sm"
          className="w-100"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenMunicipalityChat(report);
          }}
          style={{
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #5e7bb3 0%, #7b9fd9 100%)';
            e.currentTarget.style.color = 'white';
            e.currentTarget.style.borderColor = '#5e7bb3';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '';
            e.currentTarget.style.color = '';
            e.currentTarget.style.borderColor = '';
          }}
        >
          <i className="bi bi-chat-dots-fill me-2"></i>
          Chat with Municipality
        </Button>
      </div>
    )}
  </ListGroup.Item>
                        ))
                      )}
                    </ListGroup>
                  </div>
                )}

                {/* Show message when in view mode with no reports */}
                {(viewMode === 'view' || viewMode === 'myReports') && !loadingReports && !loadingMyReports && !reportsError && allReports.length === 0 && (
                  <div className="text-center py-5 report-empty-state">
                    <div className="report-empty-icon mb-3">
                      <i className="bi bi-inbox"></i>
                    </div>
                    <h5 className="mt-3 mb-2 fw-bold">
                      {viewMode === 'myReports' ? 'No Reports Yet' : 'No Reports Available'}
                    </h5>
                    <p className="text-muted" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                      {viewMode === 'myReports' 
                        ? 'You haven\'t created any reports yet. Start by creating your first report!'
                        : selectedStreetArea 
                          ? `No reports found in the area of ${selectedStreetArea.streetName}.`
                          : 'There are no approved reports to display at the moment.'
                      }
                    </p>
                    {selectedStreetArea && viewMode === 'view' && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleClearStreetArea}
                        className="mt-2"
                      >
                        <i className="bi bi-arrow-left me-2"></i>
                        View All Reports
                      </Button>
                    )}
                    {viewMode === 'myReports' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleViewModeChange('create')}
                        className="mt-2"
                      >
                        <i className="bi bi-plus-circle me-2"></i>
                        Create Your First Report
                      </Button>
                    )}
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
                            {photos.map((photo) => (
                              <div 
                                key={`${photo.name}-${photo.preview}`} 
                                className="d-flex align-items-center justify-content-between p-2 mb-2 bg-light rounded"
                                style={{ border: '1px solid #dee2e6' }}
                              >
                                <button
                                  type="button"
                                  className="d-flex align-items-center flex-grow-1 btn btn-link text-decoration-none p-0"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => handlePhotoClick(photo)}
                                  aria-label={`View photo ${photo.name}`}
                                >
                                  <i className="bi bi-file-earmark-image me-2 text-primary"></i>
                                  <span className="text-truncate" style={{ maxWidth: '12.5rem' }}>
                                    {photo.name}
                                  </span>
                                  <i className="bi bi-eye ms-2 text-muted small"></i>
                                </button>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-danger p-0"
                                  onClick={() => handleRemovePhoto(photos.findIndex(p => p.preview === photo.preview))}
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
                                <i className="bi bi-plus-circle me-2"></i>Add Photo
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
                        <div {...getLocationStatusStyles()}>
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
                    <div className="mb-3 p-3 rounded" style={getAnonymousModeStyles()}>
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                          <i {...getAnonymousIconStyles()}></i>
                          <div>
                            <strong style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                              {getAnonymousModeText().title}
                            </strong>
                            <div style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.85rem)' }} className="text-muted">
                              {getAnonymousModeText().subtitle}
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
                        {getSubmitButtonContent()}
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

      {/* Report Detail Modal */}
      <Modal show={showReportDetailModal} onHide={handleCloseReportDetail} size="lg" centered className="report-detail-modal">
        <Modal.Header closeButton className="report-detail-header">
          <Modal.Title>
            <i className="bi bi-file-text me-2"></i>Report Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="report-detail-body">
          {selectedReportDetail && (
            <>
              <div className="mb-3">
                <h5 className="fw-bold report-detail-title">{selectedReportDetail.title}</h5>
                <div className="d-flex gap-2 flex-wrap mb-2">
                  <Badge bg={getStatusColor(selectedReportDetail.status)} className="report-status-badge">
                    {selectedReportDetail.status}
                  </Badge>
                  <Badge bg="secondary" className="report-category-badge">
                    <i className={`bi ${getCategoryIcon(selectedReportDetail.category)} me-1`}></i>
                    {selectedReportDetail.category}
                  </Badge>
                </div>
              </div>
              
              {selectedReportDetail.description && (
                <div className="mb-3">
                  <h6 className="fw-semibold report-detail-section-title">
                    <i className="bi bi-text-left me-2"></i>Description
                  </h6>
                  <p className="text-muted report-detail-description">{selectedReportDetail.description}</p>
                </div>
              )}
              
              <Row className="mb-3">
                <Col md={6}>
                  <div className="report-detail-info-item">
                    <small className="text-muted d-block">Submitted by:</small>
                    <div>
                      <i className="bi bi-person-circle me-1 text-primary"></i>
                      {selectedReportDetail.user?.username || selectedReportDetail.user?.name || 'Anonymous'}
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="report-detail-info-item">
                    <small className="text-muted d-block">Date:</small>
                    <div>
                      <i className="bi bi-calendar me-1 text-primary"></i>
                      {new Date(selectedReportDetail.created_at).toLocaleString()}
                    </div>
                  </div>
                </Col>
              </Row>
              
              {selectedReportDetail.latitude && selectedReportDetail.longitude && (
                <div className="mb-3 report-detail-info-item">
                  <small className="text-muted d-block">Location:</small>
                  <div>
                    <i className="bi bi-geo-alt me-1 text-primary"></i>
                    {selectedReportDetail.latitude.toFixed(5)}, {selectedReportDetail.longitude.toFixed(5)}
                  </div>
                </div>
              )}
              
              {selectedReportDetail.photoUrls && selectedReportDetail.photoUrls.length > 0 && (
                <div>
                  <h6 className="fw-semibold mb-2 report-detail-section-title">
                    <i className="bi bi-images me-2"></i>Photos ({selectedReportDetail.photoUrls.length})
                  </h6>
                  <Carousel interval={null} className="report-photo-carousel">
                    {selectedReportDetail.photoUrls.map((photoUrl, index) => (
                      <Carousel.Item key={photoUrl}>
                        <div className="report-photo-container">
                          <img
                            src={photoUrl}
                            alt={`Report visual detail ${index + 1}`}
                            className="report-photo-image"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>
                        <Carousel.Caption className="report-photo-caption">
                          <p>Photo {index + 1} of {selectedReportDetail.photoUrls.length}</p>
                        </Carousel.Caption>
                      </Carousel.Item>
                    ))}
                  </Carousel>
                </div>
              )}
            </>
          )}
       
        </Modal.Body>
        <Modal.Footer className="report-detail-footer">
          <Button variant="secondary" onClick={handleCloseReportDetail}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Report Photos Modal */}
      <Modal
        show={showReportPhotosModal}
        onHide={() => {
          setShowReportPhotosModal(false);
          setSelectedReportPhotos([]);
        }}
        size="lg"
        centered
        className="report-photos-modal"
      >
        <Modal.Header closeButton className="report-photos-header">
          <Modal.Title>
            <i className="bi bi-images me-2"></i>Report Photos
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {reportPhotosContent}
        </Modal.Body>
        <Modal.Footer className="report-photos-footer">
          <Button
            variant="secondary"
            onClick={() => {
              setShowReportPhotosModal(false);
              setSelectedReportPhotos([]);
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Municipality Chat Modal - ADD THIS at the end, before closing div */}
      <Modal show={showMunicipalityChat} onHide={handleCloseMunicipalityChat} centered size="lg">
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
        Chat with Municipality
      </Modal.Title>
      {selectedReportForChat && (
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
            <span>{selectedReportForChat.title}</span>
            <Badge 
              bg="light" 
              text="dark" 
              style={{ 
                fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                padding: '0.35rem 0.6rem',
                fontWeight: '600'
              }}
            >
              {selectedReportForChat.category}
            </Badge>
            <Badge 
              bg={getStatusColor(selectedReportForChat.status)} 
              style={{ 
                fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                padding: '0.35rem 0.6rem',
                fontWeight: '600'
              }}
            >
              {selectedReportForChat.status}
            </Badge>
          </div>
          {selectedReportForChat.description && (
            <div style={{ 
              fontSize: 'clamp(0.85rem, 2.3vw, 0.95rem)',
              opacity: 0.9,
              lineHeight: '1.5',
              fontStyle: 'italic'
            }}>
              <i className="bi bi-quote me-2"></i>
              {selectedReportForChat.description}
              <i className="bi bi-quote ms-2" style={{ transform: 'scaleX(-1)', display: 'inline-block' }}></i>
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
      {renderChatMessagesContent()}
    </div>

    {/* Message Input */}
    <div style={{ 
      padding: '1.25rem 2rem 1.5rem',
      backgroundColor: '#ffffff',
      borderTop: '2px solid #e2e8f0',
      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.05)'
    }}>
      {messageError && chatMessages.length > 0 && (
        <Alert 
          variant="danger" 
          dismissible 
          onClose={() => setMessageError('')} 
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
          {messageError}
        </Alert>
      )}
      <Form.Group>
        <div className="d-flex gap-3 align-items-end">
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Type your message to the municipality..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sendingMessage}
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
            onClick={handleSendMessage}
            disabled={sendingMessage || !newMessage.trim()}
            className="send-button"
            style={{
              borderRadius: '1rem',
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              border: 'none',
              fontWeight: '700',
              minWidth: '90px',
              height: '52px',
              boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
              transition: 'all 0.2s ease',
              fontSize: '1rem'
            }}
          >
            {sendingMessage ? (
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Sending...</span>
              </div>
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

CitizenPage.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.number,
    username: PropTypes.string,
    name: PropTypes.string,
    role: PropTypes.string,
  }),
};
