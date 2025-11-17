import { Image } from 'react-bootstrap';

function Footer() {
    return (
        <footer className="text-white mt-auto d-flex flex-column" style={{ backgroundColor: '#5e7bb3' }}>
            <div className="container py-2 py-md-4 px-2">
                <div className="row">
                    <div className="col-12 text-center pb-2 pt-2">
                        <h4 className="h6" style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)' }}>Participium</h4>
                        <p className="mb-2 mb-md-3" style={{ fontSize: 'clamp(0.8rem, 2vw, 1rem)' }}>
                            Platform dedicated to civic participation and citizen engagement.
                        </p>
                    </div>
                </div>
            </div>
            <div className="border-top pt-2 pt-md-3 pb-2 pb-md-3 text-center text-dark">
                <p className="mb-0" style={{ fontSize: 'clamp(0.75rem, 1.8vw, 0.9rem)' }}>&copy; 2025 Participium. All rights reserved.</p>
            </div>
        </footer>
    );
}
export default Footer;