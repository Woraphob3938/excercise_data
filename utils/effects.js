/**
 * Triggers a beautiful confetti explosion when a personal record (PR) is broken.
 * Safe to call in Next.js Server Side Rendering (SSR) environments.
 */
export function triggerPRConfetti() {
  if (typeof window !== 'undefined') {
    import('canvas-confetti').then((module) => {
      const confetti = module.default;
      
      // Fire confetti from multiple directions for a premium feel
      const duration = 2 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

      function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Confetti shooting from left and right corners
        confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
        }));
        confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
        }));
      }, 250);
    });
  }
}
