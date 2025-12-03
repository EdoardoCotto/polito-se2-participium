import {Card} from "react-bootstrap";
function Body(props) {
    return (
        <main className="body">
            <div className="app-root">
            <div className="d-flex justify-content-center align-items-center min-vh-100 px-2">
                <Card style={{
                    width: '90%',
                    maxWidth: '30rem',
                    boxShadow: '0 0.5rem 1.5rem rgba(0,0,0,0.2)',
                    borderRadius: 'clamp(0.5rem, 2vw, 1rem)',
                    border: 'none'
                }}>
                    <Card.Body className="text-center p-3 p-md-5">
                        <h1 style={{
                            fontSize: 'clamp(1.5rem, 5vw, 3rem)',
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: 'clamp(0.05rem, 0.5vw, 0.15rem)'
                        }}>
                            Welcome to Participium!
                        </h1>
                    </Card.Body>
                </Card>
            </div>
            </div>
        </main>
    );
}
export default Body;