import { Image } from 'react-bootstrap';

function Footer() {
    return (
        <footer className="bg-dark text-white mt-auto d-flex flex-column">
            <div className="container py-4">
                <div className="row">
                    <div className="col-md-12 text-center pb-2 pt-2">
                        <h4 className="h6">Participium</h4>
                        <p className="mb-3">
                            Platform dedicated to civic participation and citizen engagement.
                        </p>
                        
                        {/* Official Logos */}
                        <div className="d-flex justify-content-center align-items-center gap-4 mt-3">
                            <Image
                                src="http://localhost:3001/static/piemonte-logo.png"
                                alt="Regione Piemonte"
                                height={45}
                                style={{ objectFit: 'contain', opacity: '0.9' }}
                            />
                            <Image
                                src="http://localhost:3001/static/torino-clean.png"
                                alt="Città di Torino"
                                height={45}
                                style={{ objectFit: 'contain', opacity: '0.9' }}
                            />
                        </div>
                    </div>

                </div>
            </div>
            <div className="border-top pt-3 pb-3 text-center text-secondary">
                <p className="mb-0">&copy; 2025 Participium. All rights reserved.</p>
            </div>
        </footer>
    );
}
export default Footer;