import React from 'react';
import { Link } from "react-router-dom";
import { Eye, Clock, Heart, HelpCircle, Mail, Info } from "lucide-react";
import "../../styles/Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <h3>MangaQu</h3>
            </div>
            <p className="footer-description">
              Your ultimate destination for manga, manhwa, and manhua. 
              Read the latest chapters and discover new stories.
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <div className="footer-links">
              <Link to="/most-viewed" className="footer-link">
                <Eye size={14} className="footer-icon" />
                Most Viewed
              </Link>
              <Link to="/updated" className="footer-link">
                <Clock size={14} className="footer-icon" />
                Recently Updated
              </Link>
              <Link to="/favorites" className="footer-link">
                <Heart size={14} className="footer-icon" />
                Favorites
              </Link>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Support</h4>
            <div className="footer-links">
              <Link to="/help" className="footer-link">
                <HelpCircle size={14} className="footer-icon" />
                Help Center
              </Link>
              <Link to="/contact" className="footer-link">
                <Mail size={14} className="footer-icon" />
                Contact Us
              </Link>
              <Link to="/about" className="footer-link">
                <Info size={14} className="footer-icon" />
                About
              </Link>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Legal</h4>
            <div className="footer-links">
              <Link to="/privacy" className="footer-link">
                Privacy Policy
              </Link>
              <Link to="/terms" className="footer-link">
                Terms of Service
              </Link>
              <Link to="/dmca" className="footer-link">
                DMCA
              </Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-divider"></div>
          <div className="footer-bottom-content">
            <p className="footer-copyright">
              &copy; 2025 MangaQu. All rights reserved.
            </p>
            <div className="footer-social">
              <span className="footer-social-text">Follow us:</span>
              <div className="social-links">
                <a href="#" className="social-link" aria-label="Twitter">
                  Twitter
                </a>
                <a href="#" className="social-link" aria-label="Discord">
                  Discord
                </a>
                <a href="#" className="social-link" aria-label="GitHub">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;