import { useEffect, useState } from 'react';

/**
 * Dark mode hook with localStorage persistence
 */
export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('rowlab-dark-mode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('rowlab-dark-mode', JSON.stringify(isDark));
  }, [isDark]);

  const toggleDarkMode = () => setIsDark(!isDark);

  return [isDark, toggleDarkMode];
};
