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
        <Card className="shadow-lg" style={{ borderRadius: '1rem', border: 'none' }}>
          <Card.Body className="p-4">
            <h2 className="mb-3" style={{ 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: '2rem'
            }}>
              <i className="bi bi-person-circle me-2" style={{ WebkitTextFillColor: 'initial' }}></i>
              Welcome, {user?.name} {user?.surname}!
            </h2>
            <div className="d-flex align-items-center">
              <span className="badge" style={{ 
                backgroundColor: '#5e7bb3', 
                fontSize: '1rem',
                padding: '0.5rem 1rem',
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

      {/* Map Section */}
      <Container className="flex-grow-1 py-4">
        <Card className="shadow-lg h-100" style={{ borderRadius: '1rem', border: 'none' }}>
          <Card.Header style={{ 
            backgroundColor: '#5e7bb3',
            color: 'white',
            padding: '1.5rem',
            borderTopLeftRadius: '1rem',
            borderTopRightRadius: '1rem'
          }}>
            <h4 className="mb-0 d-flex align-items-center">
              <i className="bi bi-map me-3"></i>
              Turin Municipality Map
            </h4>
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
        <Card className="shadow-lg" style={{ borderRadius: '1rem', border: 'none' }}>
          <Card.Body className="p-4">
            <h5 className="mb-3 d-flex align-items-center" style={{ 
              fontWeight: '600',
              color: '#5e7bb3'
            }}>
              <i className="bi bi-speedometer2 me-2"></i>
              Your Dashboard
            </h5>
            <div className="mb-3">
              <p className="text-muted mb-2">
                <i className="bi bi-check-circle-fill me-2" style={{ color: '#5e7bb3' }}></i>
                As a <strong style={{ color: '#5e7bb3' }}>{getRoleDisplayName(user?.type)}</strong>, you have access to municipality 
                resources and can manage civic engagement projects in your area of expertise.
              </p>
              <p className="text-muted mb-0">
                <i className="bi bi-info-circle-fill me-2" style={{ color: '#5e7bb3' }}></i>
                Use the map above to view and interact with projects in your jurisdiction.
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}

