import { Container, Card } from 'react-bootstrap';
import TurinMap from './TurinMap';
import MapErrorBoundary from './MapErrorBoundary';

export default function MunicipalityPage({ user }) {
  
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

  return (
    <div className="app-root d-flex flex-column min-vh-100">
      {/* Welcome Section */}
      <Container className="py-4">
        <Card className="shadow-sm">
          <Card.Body>
            <h2 className="text-primary mb-3">
              Welcome, {user?.name} {user?.surname}
            </h2>
            <p className="text-muted mb-0">
              <strong>Role:</strong> {getRoleDisplayName(user?.type)}
            </p>
          </Card.Body>
        </Card>
      </Container>

      {/* Map Section */}
      <Container className="flex-grow-1 py-4">
        <Card className="shadow-sm h-100">
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0">Turin Municipality Map</h4>
          </Card.Header>
          <Card.Body className="p-0 position-relative">
            <MapErrorBoundary>
              <TurinMap height="500px" />
            </MapErrorBoundary>
          </Card.Body>
        </Card>
      </Container>

      {/* Info Section */}
      <Container className="py-4">
        <Card className="shadow-sm">
          <Card.Body>
            <h5 className="text-secondary mb-3">Your Dashboard</h5>
            <p className="text-muted">
              As a <strong>{getRoleDisplayName(user?.type)}</strong>, you have access to municipality 
              resources and can manage civic engagement projects in your area of expertise.
            </p>
            <p className="text-muted mb-0">
              Use the map above to view and interact with projects in your jurisdiction.
            </p>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

