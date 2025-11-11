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
            <Card className="citizen-card map-card shadow h-100">
              <Card.Header className="citizen-card-header">
                <Card.Title className="mb-0">Select a location on the map</Card.Title>
              </Card.Header>
              <Card.Body className="p-0">
                <TurinMap onLocationSelected={setSelectedLocation} />
              </Card.Body>
            </Card>
          </Col>

          {/* Report panel */}
          <Col lg={4}>
            <Card className="shadow h-100">
              <Card.Header>
                <Card.Title className="mb-0">Create Report</Card.Title>
              </Card.Header>
              <Card.Body>
                {submitError && <Alert variant="danger">{submitError}</Alert>}
                {submitOk && <Alert variant="success">{submitOk}</Alert>}

                <Form className="mb-3">
                  <Form.Group className="mb-2">
                    <Form.Label>Title</Form.Label>
                    <Form.Control
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Pothole on the asphalt in Via ..."
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Description (optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Additional details for the municipality..."
                    />
                  </Form.Group>

                  <Form.Group className="mb-2">
                    <Form.Label>Location</Form.Label>
                    <div className="text-muted">
                      {selectedLocation
                        ? <>Lat: {selectedLocation.lat.toFixed(5)} — Lon: {selectedLocation.lng.toFixed(5)}</>
                        : <>No location selected</>}
                    </div>
                  </Form.Group>
                </Form>

                <div className="d-flex gap-2">
                  <Button disabled={submitting} onClick={handleCreateReport}>
                    {submitting ? 'Submitting...' : 'Submit Report'}
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
