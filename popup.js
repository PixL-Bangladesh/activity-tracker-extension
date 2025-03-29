document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const startButton = document.getElementById('start-recording');
  const stopButton = document.getElementById('stop-recording');
  const exportButton = document.getElementById('export-data');
  const screenshotButton = document.getElementById('take-screenshot');
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');
  const sessionIdElement = document.getElementById('session-id');
  const sessionDurationElement = document.getElementById('session-duration');
  const eventsCountElement = document.getElementById('events-count');
  const screenshotResultElement = document.getElementById('screenshot-result');
  const recordScreenButton = document.getElementById('record-screen');
  
  // Settings checkboxes
  const captureMouse = document.getElementById('capture-mouse');
  const captureKeyboard = document.getElementById('capture-keyboard');
  const captureDom = document.getElementById('capture-dom');
  const captureNetwork = document.getElementById('capture-network');
  const captureConsole = document.getElementById('capture-console');
  
  let recordingStartTime = null;
  let durationInterval = null;
  let hasRecordedData = false;
  
  // Load saved settings
  chrome.storage.local.get(['captureSettings', 'hasRecordedData'], function(result) {
    if (result.captureSettings) {
      captureMouse.checked = result.captureSettings.mouse;
      captureKeyboard.checked = result.captureSettings.keyboard;
      captureDom.checked = result.captureSettings.dom;
      captureNetwork.checked = result.captureSettings.network;
      captureConsole.checked = result.captureSettings.console;
    }
    
    // Check if we have recorded data to enable export button
    if (result.hasRecordedData) {
      hasRecordedData = true;
      if (exportButton) {
        exportButton.disabled = false;
      }
    }
  });
  
  // Check current recording status
  chrome.storage.local.get(['isRecording', 'sessionId', 'startTime', 'eventsCount'], function(result) {
    if (result.isRecording) {
      updateUIForRecording(true);
      sessionIdElement.textContent = result.sessionId || 'Unknown';
      recordingStartTime = result.startTime;
      eventsCountElement.textContent = result.eventsCount || '0';
      startDurationTimer();
    } else if (result.eventsCount && result.eventsCount > 0) {
      // Enable export button if we have events
      hasRecordedData = true;
      if (exportButton) {
        exportButton.disabled = false;
      }
    }
  });
  
  // Start recording
  startButton.addEventListener('click', function() {
    const sessionId = generateSessionId();
    const startTime = Date.now();
    const captureSettings = {
      mouse: captureMouse.checked,
      keyboard: captureKeyboard.checked,
      dom: captureDom.checked,
      network: captureNetwork.checked,
      console: captureConsole.checked
    };
    
    // Save settings
    chrome.storage.local.set({
      isRecording: true,
      sessionId: sessionId,
      startTime: startTime,
      captureSettings: captureSettings,
      eventsCount: 0
    });
    
    // Send message to background script to start recording
    chrome.runtime.sendMessage({
      action: 'startRecording',
      sessionId: sessionId,
      settings: captureSettings
    });
    
    // Update UI
    updateUIForRecording(true);
    sessionIdElement.textContent = sessionId;
    recordingStartTime = startTime;
    eventsCountElement.textContent = '0';
    startDurationTimer();
  });
  
  // Stop recording
  stopButton.addEventListener('click', function() {
    console.log('[Action Tracker] Stop button clicked');
    
    // Disable the button to prevent multiple clicks
    stopButton.disabled = true;
    stopButton.textContent = 'Stopping...';
    
    chrome.runtime.sendMessage({ action: 'stopRecording' }, function(response) {
      // Re-enable the button regardless of response
      stopButton.disabled = false;
      stopButton.textContent = 'Stop Recording';
      
      if (chrome.runtime.lastError) {
        console.error('[Action Tracker] Error stopping recording:', chrome.runtime.lastError);
        alert('Error stopping recording: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (response && response.success) {
        console.log('[Action Tracker] Recording stopped successfully');
        chrome.storage.local.set({ 
          isRecording: false,
          hasRecordedData: true  // Set flag to indicate we have data to export
        });
        updateUIForRecording(false);
        stopDurationTimer();
        
        // Enable export button
        if (exportButton) {
          exportButton.disabled = false;
          hasRecordedData = true;
        }
      } else {
        console.error('[Action Tracker] Failed to stop recording:', response);
        alert('Failed to stop recording. Please try again.');
      }
    });
  });
  
  // Export data
  exportButton.addEventListener('click', function() {
    // Disable the button to prevent multiple clicks
    exportButton.disabled = true;
    exportButton.textContent = 'Exporting...';
    
    console.log('[Action Tracker] Export button clicked');
    
    chrome.runtime.sendMessage({ action: 'exportData' }, function(response) {
      // Re-enable the button regardless of response
      exportButton.disabled = false;
      exportButton.textContent = 'Export Data';
      
      if (chrome.runtime.lastError) {
        console.error('[Action Tracker] Error exporting data:', chrome.runtime.lastError);
        alert('Error exporting data: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (response && response.success) {
        console.log('[Action Tracker] Data exported successfully to:', response.path);
        alert('Data exported successfully to: ' + response.path);
      } else {
        console.error('[Action Tracker] Failed to export data:', response);
        
        // Show a more detailed error message if available
        if (response && response.error) {
          alert('Failed to export data: ' + response.error);
        } else {
          alert('Failed to export data. Please try again.');
        }
      }
    });
  });
  
  // Screenshot button
  screenshotButton.addEventListener('click', function() {
    screenshotButton.disabled = true;
    screenshotButton.textContent = 'Processing...';
    
    // Clear previous results
    screenshotResultElement.innerHTML = '';
    
    // Use chrome.tabs API to capture the current tab
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs && tabs.length > 0) {
        const activeTab = tabs[0];
        
        // Send message to background script to capture the screen
        chrome.runtime.sendMessage({
          action: 'captureScreen',
          tabId: activeTab.id
        }, function(response) {
          if (chrome.runtime.lastError) {
            screenshotResultElement.innerHTML = `<p style="color: red;">Error: ${chrome.runtime.lastError.message}</p>`;
            screenshotButton.disabled = false;
            screenshotButton.textContent = 'Take Screenshot';
            return;
          }
          
          if (response && response.success) {
            // Create an image from the data URL
            const img = new Image();
            img.src = response.imageData;
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
            img.style.border = '1px solid #ccc';
            
            // Add the image to the result div
            screenshotResultElement.appendChild(img);
            
            // Add download button
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn secondary';
            downloadBtn.style.marginTop = '10px';
            downloadBtn.textContent = 'Download Screenshot';
            downloadBtn.addEventListener('click', function() {
              const link = document.createElement('a');
              link.download = 'action-tracker-screenshot.png';
              link.href = response.imageData;
              link.click();
            });
            
            screenshotResultElement.appendChild(downloadBtn);
          } else {
            screenshotResultElement.innerHTML = `<p style="color: red;">Error capturing screenshot: ${response?.error || 'Unknown error'}</p>`;
          }
          
          screenshotButton.disabled = false;
          screenshotButton.textContent = 'Take Screenshot';
        });
      } else {
        screenshotResultElement.innerHTML = '<p style="color: red;">No active tab found</p>';
        screenshotButton.disabled = false;
        screenshotButton.textContent = 'Take Screenshot';
      }
    });
  });
  
  // Listen for events count updates
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'updateEventsCount') {
      eventsCountElement.textContent = request.count;
      
      // If we have events, we have data to export
      if (request.count > 0) {
        hasRecordedData = true;
      }
    }
  });
  
  // Helper functions
  function updateUIForRecording(isRecording) {
    // Add null checks for all DOM elements
    if (!startButton || !stopButton || !statusDot || !statusText) {
      console.error('[Action Tracker] Required UI elements not found');
      return;
    }
    
    if (isRecording) {
      startButton.style.display = 'none';
      stopButton.style.display = 'inline-block';
      stopButton.disabled = false; // Ensure stop button is enabled
      statusDot.classList.add('recording');
      statusText.textContent = 'Recording';
      
      // Disable export button during recording
      if (exportButton) {
        exportButton.disabled = true;
      }
      
      const settingsContainer = document.querySelector('.settings');
      if (settingsContainer) {
        settingsContainer.classList.add('disabled');
      }
    } else {
      startButton.style.display = 'inline-block';
      stopButton.style.display = 'none';
      statusDot.classList.remove('recording');
      statusText.textContent = 'Not Recording';
      
      // Enable export button if we have recorded data
      if (exportButton && hasRecordedData) {
        exportButton.disabled = false;
      }
      
      const settingsContainer = document.querySelector('.settings');
      if (settingsContainer) {
        settingsContainer.classList.remove('disabled');
      }
    }
  }
  
  function startDurationTimer() {
    if (durationInterval) clearInterval(durationInterval);
    durationInterval = setInterval(updateDuration, 1000);
    updateDuration();
  }
  
  function stopDurationTimer() {
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }
  }
  
  function updateDuration() {
    if (!recordingStartTime || !sessionDurationElement) return;
    
    const duration = Date.now() - recordingStartTime;
    const seconds = Math.floor(duration / 1000) % 60;
    const minutes = Math.floor(duration / (1000 * 60)) % 60;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    
    sessionDurationElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
  }
});
