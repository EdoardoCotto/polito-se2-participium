import { Image } from 'react-bootstrap';

function Footer() {
    return (
        <footer className="text-white mt-auto d-flex flex-column" style={{ backgroundColor: '#5e7bb3' }}>
            <div className="container py-4">
                <div className="row">
                    <div className="col-md-12 text-center pb-2 pt-2">
                        <h4 className="h6">Participium</h4>
                        <p className="mb-3">
                            Platform dedicated to civic participation and citizen engagement.
                        </p>
                    </div>

                </div>
            </div>
            <div className="border-top pt-3 pb-3 text-center text-dark">
                <p className="mb-0">&copy; 2025 Participium. All rights reserved.</p>
            </div>
        </footer>
    );
}
export default Footer;