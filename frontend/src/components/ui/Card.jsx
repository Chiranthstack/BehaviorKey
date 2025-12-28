import React from 'react';
import { twMerge } from 'tailwind-merge';

const Card = ({ children, className, ...props }) => {
    return (
        <div
            className={twMerge("glass-panel rounded-2xl p-6", className)}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
