import React from 'react';

export const EraserIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19.4 7.34L16.66 4.6A2 2 0 0015.24 4H8.76a2 2 0 00-1.42.59L4.6 7.34a2 2 0 000 2.82l6.36 6.36a2 2 0 002.82 0l6.36-6.36a2 2 0 000-2.82z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16" />
  </svg>
);

export const DownloadIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

export const MagicIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M5 3v4M3 5h4M6.027 8.368L4.243 9.757m15.514-5.514L18.368 5.632M21 5h-4M19 3v4M12 3v4M12 21v-4M9.757 19.757L8.368 18.37m5.632 0L14.243 19.757M18.368 18.37l1.389 1.389M4.243 14.243L5.632 12.85m12.736 1.389l1.389-1.389M12 8a4 4 0 100 8 4 4 0 000-8z" 
    />
  </svg>
);

export const SparklesIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        d="M5 3v4M3 5h4M19 3v4M17 5h4M14 5.344l-1.46-1.46a.5.5 0 00-.707 0L10.375 5.344M10 14l-1.46-1.46a.5.5 0 00-.707 0L6.375 14M12 21v-4M10 3H6a3 3 0 00-3 3v4M14 21h4a3 3 0 003-3v-4M10 19h4" 
    />
  </svg>
);


interface LoadingSpinnerProps {
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className = "h-10 w-10" }) => (
    <svg 
        className={`animate-spin text-white ${className}`} 
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
    >
        <circle 
            className="opacity-25" 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4"
        ></circle>
        <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
    </svg>
);