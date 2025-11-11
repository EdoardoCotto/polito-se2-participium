import { Container, Card, Row, Col, Button, Badge } from 'react-bootstrap';
import TurinMap from './TurinMap';
import MapErrorBoundary from './MapErrorBoundary';

export default function CitizenPage({ user }) {
  
  return (
    <div className="app-root d-flex flex-column min-vh-100">

      {/* Main Content */}
      <Container className="flex-grow-1 py-4">
        <Row className="g-4">
          {/* Map Section */}
          <Col lg={8}>
            <Card className="citizen-card map-card shadow h-100">
              <Card.Header className="citizen-card-header">
                <div className="d-flex align-items-center justify-content-between">
                  <h4 className="mb-0">
                    <i className="bi bi-map me-2"></i>
                    Turin City Map
                  </h4>
                  <Badge bg="light" text="dark" className="map-badge">
                    Interactive
                  </Badge>
                </div>
              </Card.Header>
              <Card.Body className="p-0 position-relative">
                <MapErrorBoundary>
                  <TurinMap height="500px" />
                </MapErrorBoundary>
              </Card.Body>
            </Card>
          </Col>

          {/* Sidebar */}
          <Col lg={4}>
            {/* Quick Actions Card */}
            <Card className="citizen-card action-card shadow mb-3">
              <Card.Header className="citizen-card-header bg-gradient-primary">
                <h5 className="mb-0">
                  <i className="bi bi-lightning-charge-fill me-2"></i>
                  Quick Actions
                </h5>
              </Card.Header>
              <Card.Body className="citizen-card-body">
                <p className="card-description mb-3">
                  <i className="bi bi-info-circle-fill me-2 text-primary"></i>
                  Participate in civic engagement initiatives and contribute to your community.
                </p>
                <div className="d-grid gap-3">
                  <Button variant="primary" size="lg" className="action-button">
                    <i className="bi bi-plus-circle-fill me-2"></i>
                    Report an Issue
                  </Button>
                  <Button variant="outline-primary" size="lg" className="action-button">
                    <i className="bi bi-list-ul me-2"></i>
                    View My Reports
                  </Button>
                  <Button variant="outline-secondary" size="lg" className="action-button">
                    <i className="bi bi-bell me-2"></i>
                    Notifications
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Statistics Card */}
            <Card className="citizen-card stats-card shadow">
              <Card.Header className="citizen-card-header bg-gradient-success">
                <h5 className="mb-0">
                  <i className="bi bi-graph-up-arrow me-2"></i>
                  Your Activity
                </h5>
              </Card.Header>
              <Card.Body className="citizen-card-body">
                <div className="stat-item">
                  <div className="stat-icon bg-primary">
                    <i className="bi bi-file-text"></i>
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Reports Submitted</span>
                    <span className="stat-value">0</span>
                  </div>
                </div>
                <div className="stat-item">
                  <div className="stat-icon bg-success">
                    <i className="bi bi-check-circle"></i>
                  </div>
                  <div className="stat-content">
                    <span className="stat-label">Reports Resolved</span>
                    <span className="stat-value">0</span>
                  </div>
                </div>

              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

