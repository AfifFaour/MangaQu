import React from 'react';
import './../styles/Terms.css';

function TermsOfService() {
  return (
    <div className="terms-container">
      <div className="terms-content">
        <h1>Terms of Service</h1>
        <p className="terms-updated">Last updated: January 1, 2024</p>

        <div className="terms-section">
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing and using MangaQu, you accept and agree to be bound by the terms 
            and provision of this agreement. If you do not agree to these terms, please do not use our service.
          </p>
        </div>

        <div className="terms-section">
          <h2>2. User Accounts</h2>
          <p>
            To access certain features, you may be required to create an account. You are responsible for:
          </p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Providing accurate and complete information</li>
          </ul>
        </div>

        <div className="terms-section">
          <h2>3. Content Usage</h2>
          <p>
            All manga content available on MangaQu is provided for personal, non-commercial use only.
            You may not:
          </p>
          <ul>
            <li>Distribute, modify, or create derivative works</li>
            <li>Use content for commercial purposes</li>
            <li>Remove copyright or proprietary notices</li>
          </ul>
        </div>

        <div className="terms-section">
          <h2>4. User Conduct</h2>
          <p>
            You agree not to use MangaQu to:
          </p>
          <ul>
            <li>Upload or transmit any malicious software</li>
            <li>Harass or threaten other users</li>
            <li>Violate any applicable laws</li>
            <li>Attempt to gain unauthorized access</li>
          </ul>
        </div>

        <div className="terms-section">
          <h2>5. Termination</h2>
          <p>
            We reserve the right to terminate or suspend your account and access to MangaQu 
            at our sole discretion, without notice, for conduct that we believe violates these 
            Terms or is harmful to other users, us, or third parties.
          </p>
        </div>

        <div className="terms-section">
          <h2>6. Limitation of Liability</h2>
          <p>
            MangaQu shall not be liable for any indirect, incidental, special, consequential, 
            or punitive damages resulting from your use or inability to use the service.
          </p>
        </div>

        <div className="terms-section">
          <h2>7. Changes to Terms</h2>
          <p>
            We reserve the right to modify these terms at any time. We will notify users of 
            significant changes by posting the new Terms on this page.
          </p>
        </div>

        <div className="terms-section">
          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
            <br />
            Email: legal@mangaqu.com
            <br />
            Address: 123 Manga Street, Tokyo, Japan
          </p>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;