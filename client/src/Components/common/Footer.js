import React from 'react';
import { Link } from "react-router-dom";
import { Eye, Clock, Heart, HelpCircle, Mail, Info, BookOpen, Home, Search } from "lucide-react";
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
            <h4 className="footer-title">Discover</h4>
            <div className="footer-links">
              <Link to="/browse" className="footer-link">
                <BookOpen size={14} className="footer-icon" />
                Browse Manga
              </Link>
              <Link to="/newest" className="footer-link">
                <Clock size={14} className="footer-icon" />
                Newest Releases
              </Link>
              <Link to="/updated" className="footer-link">
                <Eye size={14} className="footer-icon" />
                Recently Updated
              </Link>
              <Link to="/types" className="footer-link">
                <Search size={14} className="footer-icon" />
                Manga Types
              </Link>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Account</h4>
            <div className="footer-links">
              <Link to="/login" className="footer-link">
                <Heart size={14} className="footer-icon" />
                Login
              </Link>
              <Link to="/signup" className="footer-link">
                <Heart size={14} className="footer-icon" />
                Sign Up
              </Link>
              <Link to="/profile" className="footer-link">
                <Info size={14} className="footer-icon" />
                My Profile
              </Link>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Support</h4>
            <div className="footer-links">
              <Link to="/Help" className="footer-link">
                <HelpCircle size={14} className="footer-icon" />
                Help Center
              </Link>
              <Link to="/Contact" className="footer-link">
                <Mail size={14} className="footer-icon" />
                Contact Us
              </Link>
              <Link to="/About" className="footer-link">
                <Info size={14} className="footer-icon" />
                About Us
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
              {/* DMCA link removed as we don't have that route */}
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
                <a href="#" className="social-link" aria-label="Twitter" onClick={(e) => { e.preventDefault(); alert('Twitter link coming soon!'); }}>
                  Twitter
                </a>
                <a href="#" className="social-link" aria-label="Discord" onClick={(e) => { e.preventDefault(); alert('Discord link coming soon!'); }}>
                  Discord
                </a>
                <a href="#" className="social-link" aria-label="GitHub" onClick={(e) => { e.preventDefault(); alert('GitHub link coming soon!'); }}>
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