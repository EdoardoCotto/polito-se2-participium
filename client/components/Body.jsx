import { Image, Row, Button, Card} from "react-bootstrap";
function Body(props) {
    return (
        <main className="body">
            <div className="app-root">
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <Card style={{
                    width: '40%',
                    maxWidth: '30rem',
                    boxShadow: '0 0.5rem 1.5rem rgba(0,0,0,0.2)',
                    borderRadius: '1rem',
                    border: 'none'
                }}>
                    <Card.Body className="text-center p-5">
                        <h1 style={{
                            fontSize: '3rem',
                            fontWeight: 'bold',
                            background: 'linear-gradient(45deg, #0d6efd, #0dcaf0)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            letterSpacing: '0.15rem'
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