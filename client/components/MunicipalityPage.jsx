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

      {/* Map Section */}
      <Container fluid className="flex-grow-1 py-2 py-md-4 px-2 px-md-3">
        <Card className="shadow-lg h-100" style={{ borderRadius: 'clamp(0.5rem, 2vw, 1rem)', border: 'none', minHeight: '400px' }}>
          <Card.Header style={{ 
            backgroundColor: '#5e7bb3',
            color: 'white',
            padding: 'clamp(0.75rem, 2vw, 1.5rem)',
            borderTopLeftRadius: 'clamp(0.5rem, 2vw, 1rem)',
            borderTopRightRadius: 'clamp(0.5rem, 2vw, 1rem)'
          }}>
            <h4 className="mb-0 d-flex align-items-center" style={{ fontSize: 'clamp(1rem, 2.5vw, 1.5rem)' }}>
              <i className="bi bi-map me-2 me-md-3"></i>
              <span className="d-none d-sm-inline">Turin Municipality Map</span>
              <span className="d-inline d-sm-none">Turin Map</span>
            </h4>
          </Card.Header>
          <Card.Body className="p-0 position-relative" style={{ minHeight: '350px' }}>
            <MapErrorBoundary>
              <TurinMap height="500px" />
            </MapErrorBoundary>
          </Card.Body>
        </Card>
      </Container>

      {/* Info Section */}
      <Container fluid className="py-2 py-md-4 px-2 px-md-3">
        <Card className="shadow-lg" style={{ borderRadius: 'clamp(0.5rem, 2vw, 1rem)', border: 'none' }}>
          <Card.Body className="p-2 p-md-4">
            <h5 className="mb-2 mb-md-3 d-flex align-items-center" style={{ 
              fontWeight: '600',
              color: '#5e7bb3',
              fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)'
            }}>
              <i className="bi bi-speedometer2 me-2"></i>
              Your Dashboard
            </h5>
            <div className="mb-2 mb-md-3">
              <p className="text-muted mb-2" style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
                <i className="bi bi-check-circle-fill me-2" style={{ color: '#5e7bb3' }}></i>
                As a <strong style={{ color: '#5e7bb3' }}>{getRoleDisplayName(user?.type)}</strong>, you have access to municipality 
                resources and can manage civic engagement projects in your area of expertise.
              </p>
              <p className="text-muted mb-0" style={{ fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
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

