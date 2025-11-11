import { Component } from 'react';
import { Alert } from 'react-bootstrap';

class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Map Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4">
          <Alert variant="warning">
            <Alert.Heading>Map Loading Issue</Alert.Heading>
            <p>
              The interactive map could not be loaded. Please try refreshing the page.
            </p>
            <small className="text-muted">
              Error: {this.state.error?.message || 'Unknown error'}
            </small>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MapErrorBoundary;

