// components/CitizenPage.jsx
import { Container, Card, Row, Col, Button, Form, Alert } from 'react-bootstrap';
import { useState } from 'react';
import TurinMap from './TurinMap';

export default function CitizenPage({ user }) {
  const [selectedLocation, setSelectedLocation] = useState(null); // {lat, lng}
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitOk, setSubmitOk] = useState('');

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

    try {
      setSubmitting(true);
      const { createReport } = (await import('../API/API.js')).default;

      await createReport({
        title: title.trim(),
        description: description.trim(),
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
      });

      setSubmitOk('Report created successfully!');
      setTitle('');
      setDescription('');
      // Optional: clear location after submission
      // setSelectedLocation(null);
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
              <Card.Body className="p-0">
                <TurinMap onLocationSelected={setSelectedLocation} />
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
    </div>
  );
}
