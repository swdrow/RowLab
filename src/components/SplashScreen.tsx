import { useEffect } from 'react';

/**
 * SplashScreen component - fades out and removes the inline splash screen
 *
 * The splash screen is rendered inline in index.html to show immediately
 * before any JavaScript loads. This React component removes it with a
 * smooth fade-out transition once the app is ready.
 */
export function SplashScreen() {
  useEffect(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      // Fade out over 300ms
      splash.style.transition = 'opacity 300ms ease-out';
      splash.style.opacity = '0';

      // Remove from DOM after fade completes
      setTimeout(() => splash.remove(), 300);
    }
  }, []);

  // This component renders nothing - it just removes the inline splash
  return null;
}
