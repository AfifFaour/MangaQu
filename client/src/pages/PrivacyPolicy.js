import React from 'react';
import './../styles/Privacy.css';

function PrivacyPolicy() {
  return (
    <div className="privacy-container">
      <div className="privacy-content">
        <h1>Privacy Policy</h1>
        <p className="privacy-updated">Last updated: January 1, 2024</p>

        <div className="privacy-section">
          <h2>1. Information We Collect</h2>
          <p>We collect information you provide directly to us, including:</p>
          <ul>
            <li><strong>Account Information:</strong> Username, email address, password</li>
            <li><strong>Profile Information:</strong> Display name, avatar, preferences</li>
            <li><strong>Reading Activity:</strong> Manga you read, bookmarks, reading progress</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>2. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Personalize your reading experience</li>
            <li>Send you service-related notifications</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Detect, prevent, and address technical issues</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>3. Information Sharing</h2>
          <p>We do not sell your personal information. We may share information:</p>
          <ul>
            <li>With your consent</li>
            <li>To comply with legal obligations</li>
            <li>To protect our rights and safety</li>
            <li>With service providers who assist our operations</li>
          </ul>
        </div>

        <div className="privacy-section">
          <h2>4. Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to track activity on our service 
            and hold certain information. Cookies are files with a small amount of data that 
            may include an anonymous unique identifier.
          </p>
        </div>

        <div className="privacy-section">
          <h2>5. Data Security</h2>
          <p>
            We implement appropriate security measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </div>

        <div className="privacy-section">
          <h2>6. Your Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Access your personal information</li>
            <li>Correct inaccurate data</li>
            <li>Request deletion of your data</li>
            <li>Opt-out of certain data processing</li>
            <li>Export your data</li>
          </ul>
          <p>To exercise these rights, contact us at privacy@mangaqu.com</p>
        </div>

        <div className="privacy-section">
          <h2>7. Children's Privacy</h2>
          <p>
            Our service is not intended for children under 13. We do not knowingly collect 
            personal information from children under 13. If you are a parent or guardian and 
            believe your child has provided us with personal information, please contact us.
          </p>
        </div>

        <div className="privacy-section">
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any 
            changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </div>

        <div className="privacy-section">
          <h2>9. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us:
            <br />
            Email: privacy@mangaqu.com
            <br />
            Address: 123 Manga Street, Tokyo, Japan
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicy;