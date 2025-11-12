// components/CitizenPage.jsx
import { Container, Card, Row, Col, Button, Form, Alert, Modal } from 'react-bootstrap';
import { useState, useEffect} from 'react';
import TurinMap from './TurinMap';
import API from '../API/API.js';

export default function CitizenPage({ user }) {
  const [selectedLocation, setSelectedLocation] = useState(null); // {lat, lng}
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitOk, setSubmitOk] = useState('');

  const [categories, setCategories] = useState([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState('');

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
  console.log('Categories loaded:', categories);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && photos.length < 3) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos([...photos, { name: file.name, data: reader.result }]);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
    }
  };

  const handleRemovePhoto = (index) => {
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
    if (photos.length === 0) {
      setSubmitError('Please upload at least one photo.');
      return;
    }
    try {
      setSubmitting(true);
      const { createReport } = (await import('../API/API.js')).default;

      await createReport({
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        photo1: photos[0]?.data,
        photo2: photos[1]?.data || null,
        photo3: photos[2]?.data || null
      });

      setSubmitOk('Report created successfully!');
      setTitle('');
      setCategory('');
      setDescription('');
      setPhotos([]);
      setSelectedLocation(null);
    } catch (err) {
      setSubmitError(err.message || 'An error occurred while creating the report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-root d-flex flex-column min-vh-100">
      <Container className="flex-grow-1 py-4">
        <Row className="g-4">
          {/* Map */}
          <Col lg={8}>
            <Card className="citizen-card map-card shadow h-100" style={{ border: '1px solid #e0e0e0' }}>
              <Card.Header style={{ backgroundColor: '#5e7bb3', color: 'white', padding: '1rem' }}>
                <Card.Title className="mb-0 d-flex align-items-center">
                  <i className="bi bi-pin-map me-2"></i>
                  Select a location on the map
                </Card.Title>
              </Card.Header>
              <Card.Body className="p-0" style={{ height: 'calc(100% - 4rem)' }}>
                <div style={{ height: '100%', width: '100%' }}>
                  <TurinMap onLocationSelected={setSelectedLocation} />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Report panel */}
          <Col lg={4}>
            <Card className="shadow h-100" style={{ border: '1px solid #e0e0e0' }}>
              <Card.Header style={{ backgroundColor: '#5e7bb3', color: 'white', padding: '1rem' }}>
                <Card.Title className="mb-0 d-flex align-items-center">
                  <i className="bi bi-file-earmark-plus me-2"></i>
                  Create Report
                </Card.Title>
              </Card.Header>
              <Card.Body className="p-4">
                {submitError && (
                  <Alert variant="danger" dismissible onClose={() => setSubmitError('')}>
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {submitError}
                  </Alert>
                )}
                {submitOk && (
                  <Alert variant="success" dismissible onClose={() => setSubmitOk('')}>
                    <i className="bi bi-check-circle me-2"></i>
                    {submitOk}
                  </Alert>
                )}

                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-pencil me-2"></i>Title
                    </Form.Label>
                    <Form.Control
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Pothole on Via Roma"
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-tags me-2"></i>Category 
                    </Form.Label>
                    <Form.Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{ borderRadius: '8px' }}
                    >
                      <option value="">Select a category...</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-text-left me-2"></i>Description (optional)
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide additional details to help the municipality address this issue..."
                      style={{ borderRadius: '8px' }}
                    />
                  </Form.Group>

                  {/* Photos Section */}
                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold">
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
                              <span className="text-truncate" style={{ maxWidth: '200px' }}>
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
                            Add Photo ({photos.length+1}/3)
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

                  <Form.Group className="mb-4">
                    <Form.Label className="fw-semibold">
                      <i className="bi bi-geo-alt me-2"></i>Location
                    </Form.Label>
                    <div 
                      className={`p-3 rounded ${selectedLocation ? 'bg-light border border-success' : 'bg-light border border-secondary'}`}
                      style={{ borderRadius: '8px' }}
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
                          Click on the map to select a location
                        </div>
                      )}
                    </div>
                  </Form.Group>
                </Form>

                <div className="d-grid">
                  <Button 
                    variant="primary"
                    size="lg"
                    disabled={submitting}
                    onClick={handleCreateReport}
                    style={{ 
                      backgroundColor: '#5e7bb3', 
                      borderColor: '#5e7bb3',
                      borderRadius: '8px',
                      fontWeight: '600'
                    }}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send me-2"></i>
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
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
              src={selectedPhoto.data} 
              alt={selectedPhoto.name} 
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
