import React from 'react';
import '../App.css'; // Ensure we have styles

const Footer = () => {
    return (
        <footer className="app-footer">
            <div className="footer-container">
                <div className="footer-section developer-info">
                    <span className="label">The Developer:</span>
                    <span className="name">Diana Mukatayeva</span>
                </div>
                
                <div className="footer-separator"></div>

                <div className="footer-section pm-info">
                    <p>
                        PM Accelerator is a US based company with a global reach premiering in AI learning and as a development hub, 
                        featuring award-winning AI products and mentors from top-tier companies such as Google, Meta, Apple, and Nvidia. 
                        We offer a dynamic AI PM Bootcamp, designed to empower the next generation of AI professionals through 
                        hands-on experience, mentorship, and real-world projects.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
