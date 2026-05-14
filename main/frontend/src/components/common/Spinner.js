import React from 'react';
import './Spinner.css';

const Spinner = ({ size = 'md', text }) => (
    <div className={`spinner-container spinner--${size}`}>
        <div className="spinner-reel">
            <div className="spinner-circle"></div>
            <div className="spinner-circle spinner-circle--delay"></div>
        </div>
        {text && <p className="spinner-text">{text}</p>}
    </div>
);

export default Spinner;
