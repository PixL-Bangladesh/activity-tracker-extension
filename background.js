// Background script for Action Tracker extension
let activeRecordingSessions = {};
let currentSessionId = null;
let eventCounter = 0;
let mediaRecorder = null;
let recordedChunks = [];

// Initialize extension when installed
chrome.runtime.onInstalled.addListener(() => {
  createDataDirectories();
});

// Listen for messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'startRecording':
      startRecording(request.sessionId, request.settings)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep the message channel open for the async response

    case 'stopRecording':
      stopRecording()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep the message channel open for the async response

    case 'exportData':
      exportData()
        .then((path) => {
          sendResponse({ success: true, path: path });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep the message channel open for the async response

    case 'saveEvent':
      saveEvent(request.sessionId, request.eventData);
      sendResponse({ success: true });
      break;

    case 'getSessionInfo':
      sendResponse({
        isRecording: !!currentSessionId,
        sessionId: currentSessionId,
        eventsCount: eventCounter
      });
      break;

    case 'getEvents':
      if (!currentSessionId && Object.keys(activeRecordingSessions).length === 0) {
        sendResponse({ success: false, error: 'No active recording session' });
        return;
      }

      const sessionId = currentSessionId || Object.keys(activeRecordingSessions)[0];
      const sessionData = activeRecordingSessions[sessionId];

      if (!sessionData || !sessionData.events || sessionData.events.length === 0) {
        sendResponse({ success: false, error: 'No events in current session' });
        return;
      }

      sendResponse({
        success: true,
        events: sessionData.events,
        sessionId: sessionId
      });
      break;

    case 'captureScreen':
      captureScreen(request.tabId)
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep the message channel open for async response

    case 'startScreenRecording':
      startScreenRecording()
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'stopScreenRecording':
      stopScreenRecording()
        .then(response => sendResponse(response))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case "downloadEvents":
      chrome.downloads.download({
        url: 'data:application/json,' + JSON.stringify(request.events),
        filename: 'events.json',
        saveAs: true
      }).then(() => {
        sendResponse({ success: true });
      }).catch(error => {
        sendResponse({ success: false, error: error.message });
      });
      return true;
    default:
      sendResponse({ success: false, error: `Unknown action: ${request.action}` });
  }

  return true; // Keep the message channel open for async responses
});

// Start screen recording
function startScreenRecording() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        reject(new Error('No active tab found'));
        return;
      }

      const activeTab = tabs[0];
      console.log(activeTab);

      chrome.desktopCapture.chooseDesktopMedia(
        ['screen', 'window', 'tab'],
        activeTab.id,
        (streamId) => {
          console.log('Selected stream ID:', streamId);
          if (!streamId) {
            reject(new Error('User cancelled screen recording'));
            return;
          }

          navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: streamId
              }
            }
          }).then(stream => {
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

            mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                recordedChunks.push(event.data);
              }
            };

            mediaRecorder.onstop = () => {
              const blob = new Blob(recordedChunks, { type: 'video/webm' });
              const url = URL.createObjectURL(blob);

              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const filename = `screen-recording-${timestamp}.webm`;

              chrome.downloads.download({
                url: url,
                filename: filename,
                saveAs: true
              });

              recordedChunks = [];

              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Screen Recording Complete',
                message: 'Your screen recording has been saved.',
                priority: 2
              });
            };

            mediaRecorder.start(1000);

            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'Screen Recording Started',
              message: 'Your screen is now being recorded. Click the button again to stop.',
              priority: 2
            });

            resolve({ success: true });
          }).catch(error => {
            console.error('Media error:', error);
            reject(error);
          });
        }
      );
    })
  });
}

// Stop screen recording
function stopScreenRecording() {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      reject(new Error('No active recording'));
      return;
    }

    mediaRecorder.stop();
    mediaRecorder = null;
    resolve({ success: true });
  });
}

// Start recording in all active tabs
function startRecording(sessionId, settings) {
  return new Promise((resolve, reject) => {
    try {
      currentSessionId = sessionId;
      activeRecordingSessions[sessionId] = {
        sessionId: sessionId,
        startTime: Date.now(),
        settings: settings,
        tabs: {},
        events: [],
        metadata: captureEnvironmentMetadata()
      };

      chrome.storage.local.set({
        isRecording: true,
        sessionId: sessionId,
        startTime: activeRecordingSessions[sessionId].startTime,
        eventsCount: 0
      });

      chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, (tabs) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          // Continue anyway with whatever tabs we can get
        }

        if (!tabs || tabs.length === 0) {
          resolve(); // Resolve anyway, we'll inject when new tabs are created
          return;
        }

        let injectedCount = 0;
        const totalTabs = tabs.length;

        tabs.forEach(tab => {
          try {
            injectRecordingScripts(tab.id, sessionId, settings);
            injectedCount++;

            if (injectedCount === totalTabs) {
              resolve();
            }
          } catch (error) {
            injectedCount++;
            if (injectedCount === totalTabs) {
              resolve();
            }
          }
        });
      });

      chrome.tabs.onCreated.addListener(handleNewTab);
      chrome.webNavigation.onCompleted.addListener(handleNavigation);

      if (settings.network) {
        chrome.webRequest.onBeforeRequest.addListener(
          handleNetworkRequest,
          { urls: ['<all_urls>'] },
          ['requestBody']
        );

        chrome.webRequest.onCompleted.addListener(
          handleNetworkResponse,
          { urls: ['<all_urls>'] },
          ['responseHeaders']
        );
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Stop the current recording session
function stopRecording() {
  return new Promise((resolve, reject) => {
    try {
      if (!currentSessionId) {
        resolve();
        return;
      }

      chrome.tabs.onCreated.removeListener(handleNewTab);
      chrome.webNavigation.onCompleted.removeListener(handleNavigation);

      try {
        chrome.webRequest.onBeforeRequest.removeListener(handleNetworkRequest);
        chrome.webRequest.onCompleted.removeListener(handleNetworkResponse);
      } catch (e) {
        // Ignore errors from removing listeners that might not exist
      }

      if (activeRecordingSessions[currentSessionId]) {
        activeRecordingSessions[currentSessionId].endTime = Date.now();
      }

      chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, (tabs) => {
        if (chrome.runtime.lastError) {
          const error = chrome.runtime.lastError.message;
          // Continue anyway
        }

        if (!tabs || tabs.length === 0) {
          finishStopRecording();
          return;
        }

        let stoppedCount = 0;
        const totalTabs = tabs.length;

        tabs.forEach(tab => {
          try {
            chrome.tabs.sendMessage(tab.id, { action: 'stopRecording' }, (response) => {
              stoppedCount++;
              if (stoppedCount === totalTabs) {
                finishStopRecording();
              }
            });
          } catch (e) {
            stoppedCount++;
            if (stoppedCount === totalTabs) {
              finishStopRecording();
            }
          }
        });
      });

      function finishStopRecording() {
        saveSessionData(currentSessionId, activeRecordingSessions[currentSessionId]);

        chrome.storage.local.set({
          isRecording: false,
          hasRecordedData: true
        });

        currentSessionId = null;

        resolve();
      }
    } catch (error) {
      reject(error);
    }
  });
}

// Inject recording scripts into a tab
function injectRecordingScripts(tabId, sessionId, settings) {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError) {
      if (activeRecordingSessions[sessionId]) {
        if (!activeRecordingSessions[sessionId].failedTabs) {
          activeRecordingSessions[sessionId].failedTabs = {};
        }
        activeRecordingSessions[sessionId].failedTabs[tabId] = {
          error: chrome.runtime.lastError.message,
          time: Date.now()
        };
      }
      return;
    }

    if (!tab || !tab.url || !(tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
      return;
    }

    try {
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, function (response) {
        if (chrome.runtime.lastError) {
          injectScript();
        } else {
          initializeRecording();
        }
      });
    } catch (e) {
      injectScript();
    }

    function injectScript() {
      try {
        chrome.scripting.executeScript({
          target: { tabId: tabId },
          files: ['content.js']
        }).then(() => {
          setTimeout(initializeRecording, 100);
        }).catch((error) => {
          if (activeRecordingSessions[sessionId]) {
            if (!activeRecordingSessions[sessionId].failedTabs) {
              activeRecordingSessions[sessionId].failedTabs = {};
            }
            activeRecordingSessions[sessionId].failedTabs[tabId] = {
              url: tab.url,
              title: tab.title,
              error: error.toString(),
              time: Date.now()
            };
          }
        });
      } catch (e) {
      }
    }

    function initializeRecording() {
      try {
        chrome.tabs.sendMessage(tabId, {
          action: 'initRecording',
          sessionId: sessionId,
          settings: settings
        }).then(response => {
          if (response && response.success) {
            if (activeRecordingSessions[sessionId]) {
              activeRecordingSessions[sessionId].tabs[tabId] = {
                url: tab.url,
                title: tab.title,
                startTime: Date.now()
              };
            }
          }
        }).catch(error => {
        });
      } catch (e) {
      }
    }
  });
}

// Handle new tab creation during recording
function handleNewTab(tab) {
  if (!currentSessionId) return;

  const tabEvent = {
    type: 'tabCreated',
    timestamp: Date.now(),
    tabId: tab.id,
    url: tab.pendingUrl || tab.url || ''
  };

  saveEvent(currentSessionId, tabEvent);

  chrome.webNavigation.onCompleted.addListener(handleNavigation);
}

// Handle navigation events during recording
function handleNavigation(details) {
  if (!currentSessionId || details.frameId !== 0) return;

  const navigationEvent = {
    type: 'navigation',
    timestamp: Date.now(),
    tabId: details.tabId,
    url: details.url,
    transitionType: details.transitionType,
    transitionQualifiers: details.transitionQualifiers
  };

  saveEvent(currentSessionId, navigationEvent);

  const settings = activeRecordingSessions[currentSessionId].settings;
  injectRecordingScripts(details.tabId, currentSessionId, settings);
}

// Handle network requests
function handleNetworkRequest(details) {
  if (!currentSessionId) return;

  if (details.url.includes(chrome.runtime.id)) return;

  const requestEvent = {
    type: 'networkRequest',
    timestamp: Date.now(),
    tabId: details.tabId,
    url: details.url,
    method: details.method,
    requestId: details.requestId,
    type: details.type,
    timeStamp: details.timeStamp
  };

  saveEvent(currentSessionId, requestEvent);
}

// Handle network responses
function handleNetworkResponse(details) {
  if (!currentSessionId) return;

  if (details.url.includes(chrome.runtime.id)) return;

  const responseEvent = {
    type: 'networkResponse',
    timestamp: Date.now(),
    tabId: details.tabId,
    url: details.url,
    statusCode: details.statusCode,
    statusLine: details.statusLine,
    requestId: details.requestId,
    type: details.type,
    timeStamp: details.timeStamp
  };

  saveEvent(currentSessionId, responseEvent);
}

// Save an event to the session data
function saveEvent(sessionId, eventData) {
  if (!sessionId || !activeRecordingSessions[sessionId]) {
    return;
  }

  const eventsArray = Array.isArray(eventData) ? eventData : [eventData];

  eventsArray.forEach(event => {
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    activeRecordingSessions[sessionId].events.push(event);
    eventCounter++;
  });

  chrome.storage.local.set({ eventsCount: eventCounter });

  chrome.runtime.sendMessage({
    action: 'updateEventsCount',
    count: eventCounter
  }).catch(() => {
  });

  if (eventCounter % 100 === 0) {
    saveEventsToStorage(sessionId, activeRecordingSessions[sessionId].events);
  }
}

// Save events to storage
function saveEventsToStorage(sessionId, events) {
  if (!sessionId || !events || events.length === 0) return;

  const eventsToSave = events.slice(-1000); // Keep last 1000 events

  chrome.storage.local.set({
    [`events_${sessionId}`]: eventsToSave
  }, () => {
    if (chrome.runtime.lastError) {
    } else {
    }
  });
}

// Save session metadata
function saveSessionMetadata(sessionId) {
  if (!sessionId || !activeRecordingSessions[sessionId]) return;

  const metadata = {
    sessionId: sessionId,
    startTime: activeRecordingSessions[sessionId].startTime,
    settings: activeRecordingSessions[sessionId].settings,
    metadata: activeRecordingSessions[sessionId].metadata
  };

  chrome.storage.local.set({
    [`metadata_${sessionId}`]: metadata
  }, () => {
    if (chrome.runtime.lastError) {
    }
  });
}

// Save complete session data
function saveSessionData(sessionId, sessionData) {
  // Clear previous session data before saving new one
  chrome.storage.local.remove(sessionId, function () {
    chrome.storage.local.set({ [sessionId]: sessionData }, function () {
      console.log(`Session ${sessionId} data saved`);
    });
  });
}

// Export all session data
function exportData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(null, function (items) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      // Find the most recent session
      const sessions = Object.keys(items)
        .filter(key => key.startsWith('session_'))
        .sort((a, b) => b.localeCompare(a));

      if (sessions.length === 0) {
        reject(new Error('No session data found'));
        return;
      }

      const mostRecentSession = sessions[0];
      const sessionData = items[mostRecentSession];

      // Create JSON file
      const jsonData = JSON.stringify(sessionData, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `action-tracker-session_${timestamp}.json`;

      // Save file
      chrome.downloads.download({
        url: 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData),
        filename: filename,
        saveAs: true
      }, function (downloadId) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve({ success: true, path: filename });
        }
      });
    });
  });
}

// Capture screenshot from a tab
function captureTabScreenshot(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, {
      action: 'captureScreenshot',
      selector: 'body' // or any other selector
    }, response => {
      if (response && response.success) {
        resolve(response.imageData);
      } else {
        reject(new Error(response?.error || 'Failed to capture screenshot'));
      }
    });
  });
}

// Capture the visible tab
function captureScreen(tabId) {
  return new Promise((resolve, reject) => {
    try {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        resolve({
          success: true,
          imageData: dataUrl
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Create necessary data directories
function createDataDirectories() {
  console.log('Data directories created');
}

// Capture environment metadata
function captureEnvironmentMetadata() {
  return {
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    extensionVersion: chrome.runtime.getManifest().version
  };
}
