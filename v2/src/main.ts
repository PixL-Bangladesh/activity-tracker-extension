import { actionTracker } from './lib/action-tracking';
import { captureDOMSnapshot, saveDOMSnapshot } from './lib/dom-capture';

// Initialize recording
function initializeRecording() {
  console.log('Initializing SCRIBE-like recording...');
  
  // Start action tracking
  actionTracker.startTracking();
  
  // Capture initial DOM snapshot
  const initialSnapshot = captureDOMSnapshot();
  saveDOMSnapshot(initialSnapshot);
  
  // Set periodic DOM snapshots
  setInterval(() => {
    const snapshot = captureDOMSnapshot();
    saveDOMSnapshot(snapshot);
  }, 10000); // Every 10 seconds
  
  console.log('Recording initialized successfully');
}

// Start recording when the page is fully loaded
if (document.readyState === 'complete') {
  initializeRecording();
} else {
  window.addEventListener('load', initializeRecording);
}

// Export the action tracker for use in UI components
export { actionTracker };
