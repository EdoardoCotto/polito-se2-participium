import { Container, Card, Row, Col, Button, Alert, ListGroup, Badge, InputGroup, Form, Modal, Carousel } from 'react-bootstrap';
import { useState, useEffect, useMemo } from 'react';
import TurinMap from './TurinMap';
import API from '../API/API.js';

export default function Map() {
  const [allReports, setAllReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportsError, setReportsError] = useState('');
  const [highlightedReportId, setHighlightedReportId] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
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
  const [streetSearchQuery, setStreetSearchQuery] = useState('');
  const [streetSuggestions, setStreetSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load reports on mount
  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        setReportsError('');
        const reports = await API.getApprovedReports();
        setAllReports(reports);
      } catch (err) {
        setReportsError(err.message || 'Failed to load reports');
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, []);

  // Street suggestions debounce
  useEffect(() => {
    const delayTimer = setTimeout(async () => {
      if (streetSearchQuery.trim().length >= 3) {
        try {
          const streets = await API.getStreets(streetSearchQuery);
          setStreetSuggestions(streets);
          setShowSuggestions(true);
        } catch (err) {
          console.error('Error fetching streets:', err);
        }
      }
    }, 300);

    return () => clearTimeout(delayTimer);
  }, [streetSearchQuery]);

  // Filtered reports
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

  const availableCategories = useMemo(() => {
    return [...new Set(allReports.map(r => r.category))].sort((a, b) => a.localeCompare(b));
  }, [allReports]);
  
  const availableStatuses = useMemo(() => {
    return [...new Set(allReports.map(r => r.status))].sort((a, b) => a.localeCompare(b));
  }, [allReports]);

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

  const handleViewReportPhotos = (report, e) => {
    e.stopPropagation();
    if (report.photoUrls && report.photoUrls.length > 0) {
      setSelectedReportPhotos(report.photoUrls);
      setShowReportPhotosModal(true);
    }
  };

  const handleCloseReportDetail = () => {
    setShowReportDetailModal(false);
    setSelectedReportDetail(null);
    setHighlightedReportId(null);
    setSelectedLocation(null);
  };

  const handleStreetSuggestionClick = (streetName) => {
    setStreetSearchQuery(streetName);
    setShowSuggestions(false);
    setTimeout(() => {
      handleStreetSearchWithName(streetName);
    }, 100);
  };

  const handleStreetSearchWithName = async (name) => {
    const searchName = name || streetSearchQuery.trim();
    
    if (!searchName || searchName.length < 3) {
      return;
    }
    
    try {
      setSearchingStreet(true);
      const data = await API.getReportsByStreet(searchName);
      
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
      setShowSuggestions(false);
      
    } catch (err) {
      setReportsError(err.message || 'Street not found or no reports in this area');
    } finally {
      setSearchingStreet(false);
    }
  };

  const handleStreetSearch = async () => {
    await handleStreetSearchWithName();
  };

  const handleClearStreetArea = async () => {
    setSelectedStreetArea(null);
    setStreetSearchQuery('');
    setStreetSuggestions([]);
    setShowSuggestions(false);
    
    try {
      setLoadingReports(true);
      const reports = await API.getApprovedReports();
      setAllReports(reports);
    } catch (err) {
      setReportsError(err.message || 'Failed to load reports');
    } finally {
      setLoadingReports(false);
    }
  };

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

  const getReportCountBadge = () => {
    if (allReports.length === 0) return null;
    
    const count = filteredReports.length === allReports.length 
      ? allReports.length 
      : `${filteredReports.length}/${allReports.length}`;
    const label = filteredReports.length === 1 ? 'report' : 'reports';
    
    return `${count} ${label}`;
  };

  return (
    <div className="app-root d-flex flex-column min-vh-100">
      <Container fluid className="flex-grow-1 py-2 py-md-4 px-2 px-md-3">
        <Row className="g-2 g-md-4">
          {/* Map */}
          <Col lg={8} className="order-1 order-lg-1">
            <Card className="citizen-card map-card shadow h-100" style={{ border: '1px solid #e0e0e0', minHeight: '750px' }}>
              <Card.Header style={{ backgroundColor: '#5e7bb3', color: 'white', padding: 'clamp(0.5rem, 2vw, 1rem)' }}>
                <Card.Title className="mb-0 d-flex align-items-center justify-content-between flex-wrap" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>
                  <div className="d-flex align-items-center">
                    <i className="bi bi-pin-map me-2"></i>
                    <span className="d-none d-sm-inline">Reports Map View</span>
                    <span className="d-inline d-sm-none">Map View</span>
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
                    selectedLocation={selectedLocation}
                    readOnly={true}
                    allReports={filteredReports}
                    onReportMarkerClick={handleReportMarkerClick}
                    highlightedReportId={highlightedReportId}
                    shouldZoomToSelection={highlightedReportId !== null}
                    streetArea={selectedStreetArea}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Reports List Panel */}
          <Col lg={4} className="order-2 order-lg-2">
            <Card className="shadow h-100" style={{ border: '1px solid #e0e0e0', minHeight: '750px' }}>
              <Card.Header style={{ backgroundColor: '#5e7bb3', color: 'white', padding: 'clamp(0.5rem, 2vw, 1rem)' }}>
                <h5 className="mb-0">
                  <i className="bi bi-list-ul me-2"></i>{' '}
                  Reports
                </h5>
              </Card.Header>
              <Card.Body className="p-2 p-md-4" style={{ maxHeight: 'calc(750px - 4rem)', overflowY: 'auto' }}>

                {loadingReports && (
                  <div className="text-center py-5 report-loading-state">
                    <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }}>
                      <span className="visually-hidden">Loading reports...</span>
                    </div>
                    <output className="mt-3 text-muted fw-semibold d-block">Loading reports...</output>
                  </div>
                )}

                {reportsError && (
                  <Alert variant="danger" dismissible onClose={() => setReportsError('')}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {reportsError}
                  </Alert>
                )}

                {!loadingReports && !reportsError && allReports.length > 0 && (
                  <div>
                    {/* Search and Filters */}
                    <div className="mb-3">
                      {/* Street Search */}
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
                        
                        {/* Street Suggestions */}
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
                                key={index}
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
                        <i className="bi bi-search me-2"></i>Search by Text
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
                      <i className="bi bi-list-ul"></i> Click on a report to view details
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
                            action
                            active={highlightedReportId === report.id}
                            onClick={() => handleReportListClick(report.id)}
                            className="mb-2 report-list-item"
                            style={{ 
                              borderRadius: '12px',
                              cursor: 'pointer',
                              border: highlightedReportId === report.id ? '2px solid #5e7bb3' : '1px solid #dee2e6',
                              backgroundColor: highlightedReportId === report.id ? '#e8f0ff' : 'white',
                              transition: 'all 0.3s ease',
                              boxShadow: highlightedReportId === report.id ? '0 4px 12px rgba(94, 123, 179, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
                            }}
                            onMouseEnter={(e) => {
                              if (highlightedReportId !== report.id) {
                                e.currentTarget.style.transform = 'translateX(4px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
                                e.currentTarget.style.borderColor = '#5e7bb3';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (highlightedReportId !== report.id) {
                                e.currentTarget.style.transform = 'translateX(0)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                                e.currentTarget.style.borderColor = '#dee2e6';
                              }
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
                          </ListGroup.Item>
                        ))
                      )}
                    </ListGroup>
                  </div>
                )}

                {!loadingReports && !reportsError && allReports.length === 0 && (
                  <div className="text-center py-5 report-empty-state">
                    <div className="report-empty-icon mb-3">
                      <i className="bi bi-inbox" style={{ fontSize: '3rem', color: '#dee2e6' }}></i>
                    </div>
                    <h5 className="mt-3 mb-2 fw-bold">
                      {selectedStreetArea ? 'No Reports in This Area' : 'No Reports Available'}
                    </h5>
                    <p className="text-muted" style={{ fontSize: 'clamp(0.85rem, 2vw, 0.95rem)' }}>
                      {selectedStreetArea 
                        ? `No reports found in the area of ${selectedStreetArea.streetName}.`
                        : 'There are no approved reports to display at the moment.'
                      }
                    </p>
                    {selectedStreetArea && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleClearStreetArea}
                        className="mt-2"
                      >
                        <i className="bi bi-arrow-left me-2"></i>{' '}
                        View All Reports
                      </Button>
                    )}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

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
    </div>
  );
}