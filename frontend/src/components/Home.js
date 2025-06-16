import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import speakOutImage from '../assets/speakOut.png';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  const handleReportClick = () => {
    if (isAuthenticated) {
      navigate('/report');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="hero-content">
              <h1>Report Harassment Safely and Confidentially</h1>
              <p className="lead">
                HTUharassment provides a secure platform for reporting harassment incidents.
                Your voice matters, and we're here to help you speak up against harassment.
              </p>
              <div className="hero-buttons">
                <Button
                  onClick={handleReportClick}
                  className="report-now-btn me-3"
                >
                  Report Now
                </Button>
              </div>
            </Col>
            <Col lg={6} className="hero-image">
              <img
                src={speakOutImage}
                alt="Stand against harassment"
                className="img-fluid"
              />
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Home; 