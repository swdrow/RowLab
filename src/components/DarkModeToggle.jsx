import React from 'react';

/**
 * Apple-inspired dark mode toggle
 */
const DarkModeToggle = ({ isDark, toggle }) => {
  return (
    <button
      onClick={toggle}
      className="relative w-20 h-8 rounded-full transition-all duration-150 glass-card hover:scale-105 active:scale-95"
      aria-label="Toggle dark mode"
    >
      {/* Track */}
      <div className={`absolute inset-0 rounded-full transition-all duration-150 ${
        isDark ? 'bg-blade-blue/20' : 'bg-gray-300/50'
      }`} />

      {/* Slider */}
      <div className={`absolute top-1 left-1 w-6 h-6 rounded-full shadow-lg transition-all duration-150 transform ${
        isDark ? 'translate-x-12 bg-blade-blue' : 'translate-x-0 bg-white'
      }`}>
        {/* Icon */}
        <div className="w-full h-full flex items-center justify-center">
          {isDark ? (
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          ) : (
            <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </button>
  );
};

export default DarkModeToggle;
