import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Read Manga Online For Free</h1>
          <h2 className="hero-subtitle">Unveil Your Love for Manga Online</h2>
          <Link to="/browse" className="cta-button">
            Start Reading Now
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="features-content">
            <h2>MangaQu - Read Manga Online Free</h2>
            <p className="intro-text">
              Are you looking for a platform to <strong>read manga online</strong>? Look no further than our website! 
              With over 10,000 titles, we offer an extensive collection of manga comics for all readers. Our platform 
              provides a user-friendly interface that is easy to navigate and explore, so you can quickly find your desired title.
            </p>
            
            <p>
              We have a vast range of genres and sub-genres, ensuring there is something for everyone. From romance to action, 
              we have got it all covered. We are always updating our platform with new and exciting manga titles, and all our 
              comics are high-quality. You'll never be disappointed with the quality of the images.
            </p>

            <div className="features-grid">
              <div className="feature">
                <h3>Safe to use</h3>
                <p>
                  We understand how annoying it is to deal with pop-up ads and unwanted distractions while reading, 
                  which is why we have zero pop-up ads. Our platform is completely safe to use, and your reading 
                  experience will not be disrupted by unwanted advertisements.
                </p>
              </div>

              <div className="feature">
                <h3>Smart features</h3>
                <p>
                  We also offer a smart and convenient sync feature that allows you to access your content on both 
                  your PC and mobile devices. No matter where you are, you can pick up where you left off, making 
                  reading manga comics even more enjoyable.
                </p>
              </div>

              <div className="feature">
                <h3>Completely free</h3>
                <p>
                  Our website is entirely free to use. You don't need to register or pay for anything to access 
                  our vast collection of manga comics. We also provide you with the flexibility to switch between 
                  dark and light themes for comfortable reading.
                </p>
              </div>
            </div>

            <div className="bottom-cta">
              <Link to="/browse" className="cta-button secondary">
                Browse All Manga
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;