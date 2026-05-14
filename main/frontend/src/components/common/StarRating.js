import React, { useState } from 'react';
import './StarRating.css';

const StarRating = ({ rating = 0, maxStars = 5, size = 'md', interactive = false, onChange }) => {
    const [hover, setHover] = useState(0);

    const handleClick = (value) => {
        if (interactive && onChange) onChange(value);
    };

    return (
        <div className={`star-rating star-rating--${size}`}>
            {[...Array(maxStars)].map((_, i) => {
                const value = i + 1;
                const isFilled = value <= (hover || rating);
                return (
                    <span
                        key={i}
                        className={`star ${isFilled ? 'star--filled' : 'star--empty'} ${interactive ? 'star--interactive' : ''}`}
                        onClick={() => handleClick(value)}
                        onMouseEnter={() => interactive && setHover(value)}
                        onMouseLeave={() => interactive && setHover(0)}
                        role={interactive ? 'button' : 'presentation'}
                        aria-label={`${value} estrella${value > 1 ? 's' : ''}`}
                    >
                        ★
                    </span>
                );
            })}
            {rating > 0 && <span className="star-rating__value">{rating}</span>}
        </div>
    );
};

export default StarRating;
