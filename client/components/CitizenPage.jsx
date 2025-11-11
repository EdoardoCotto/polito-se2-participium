import { Container, Card, Image, Row, Col, Button } from 'react-bootstrap';

export default function CitizenPage({ user }) {
  
  return (
    <div className="app-root d-flex flex-column min-vh-100">
      {/* Main Content */}
      <Container className="flex-grow-1 py-4">
        <Row className="g-4">
          {/* Map Section */}
          <Col lg={8}>
            <Card className="shadow-sm h-100">
              <Card.Header className="bg-primary text-white">
                <h4 className="mb-0">
                  <i className="bi bi-map me-2"></i>
                  Turin City Map
                </h4>
              </Card.Header>
              <Card.Body className="p-0 position-relative">
                <div className="w-100 h-100 d-flex justify-content-center align-items-center" style={{ minHeight: '500px' }}>
                  <Image
                    src="http://localhost:3001/static/TurinMap.jpeg"
                    alt="Turin Map"
                    fluid
                    className="w-100 h-100"
                    style={{ objectFit: 'contain' }}
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Info & Actions Section */}
          <Col lg={4}>
            <Card className="shadow-sm mb-3">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  Your Dashboard
                </h5>
              </Card.Header>
              <Card.Body>
                <p className="text-muted">
                  As a registered citizen, you can participate in civic engagement initiatives and contribute to your community.
                </p>
                <div className="d-grid gap-2">
                  <Button variant="primary" size="lg">
                    <i className="bi bi-plus-circle me-2"></i>
                    Report an Issue
                  </Button>
                  <Button variant="outline-primary" size="lg">
                    <i className="bi bi-list-ul me-2"></i>
                    View My Reports
                  </Button>
                </div>
              </Card.Body>
            </Card>

            {/* Statistics Card */}
            <Card className="shadow-sm">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">
                  <i className="bi bi-graph-up me-2"></i>
                  Your Activity
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="text-muted">Reports Submitted:</span>
                  <span className="badge bg-primary fs-6">0</span>
                </div>
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted">Reports Resolved:</span>
                  <span className="badge bg-success fs-6">0</span>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

