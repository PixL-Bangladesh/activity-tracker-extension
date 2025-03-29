// Background script for Action Tracker extension
let activeRecordingSessions = {};
let currentSessionId = null;
let eventCounter = 0;

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

    default:
      sendResponse({ success: false, error: `Unknown action: ${request.action}` });
  }

  return true; // Keep the message channel open for async responses
});

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
  if (!sessionId || !sessionData) return;

  chrome.storage.local.set({
    [`session_${sessionId}`]: {
      metadata: sessionData.metadata,
      startTime: sessionData.startTime,
      endTime: sessionData.endTime,
      duration: sessionData.duration,
      settings: sessionData.settings,
      tabs: sessionData.tabs,
      events: sessionData.events.slice(-1000) // Keep last 1000 events
    }
  }, () => {
    if (chrome.runtime.lastError) {
    } else {
    }
  });
}

// Export all session data
function exportData() {
  return new Promise((resolve, reject) => {
    try {
      if (currentSessionId || Object.keys(activeRecordingSessions).length > 0) {
        const sessionId = currentSessionId || Object.keys(activeRecordingSessions)[0];
        const sessionData = activeRecordingSessions[sessionId];

        if (sessionData) {
          exportActiveSession(sessionId, sessionData);
          return;
        }
      }

      chrome.storage.local.get(null, (items) => {
        if (chrome.runtime.lastError) {
          const errorMsg = 'Error accessing storage: ' + chrome.runtime.lastError.message;
          reject(new Error(errorMsg));
          return;
        }

        let sessionData = null;
        let sessionId = null;

        const eventKeys = Object.keys(items).filter(key => key.startsWith('events_'));
        if (eventKeys.length > 0) {
          eventKeys.sort();
          const latestEventKey = eventKeys[eventKeys.length - 1];
          sessionId = latestEventKey.replace('events_', '');

          const events = items[latestEventKey];
          const metadataKey = `metadata_${sessionId}`;
          const metadata = items[metadataKey] || {};

          sessionData = {
            events: events || [],
            metadata: metadata,
            startTime: metadata.startTime || Date.now(),
            endTime: metadata.endTime || Date.now(),
            settings: metadata.settings || {},
            tabs: metadata.tabs || {}
          };

          exportActiveSession(sessionId, sessionData);
        } else {
          const errorMsg = 'No recording data found in storage';
          reject(new Error(errorMsg));
        }
      });
    } catch (error) {
      const errorMsg = 'Error exporting data: ' + error.message;
      reject(new Error(errorMsg));
    }

    async function exportActiveSession(sessionId, sessionData) {
      try {
        // Capture screenshots of key elements
        const screenshots = {};

        // Example: Capture specific elements
        try {
          const screenshotData = await captureTabScreenshot(sessionId);
          screenshots['fullPage'] = screenshotData;
        } catch (error) {
          // Handle error
        }

        // Add screenshots to export data
        const exportData = {
          ...sessionData,
          screenshots: screenshots
        };

        const jsonData = JSON.stringify(exportData, null, 2);

        const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
        const filename = `action-tracker-${sessionId}-${timestamp}.json`;

        const dataUrl = 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonData);

        chrome.downloads.download({
          url: dataUrl,
          filename: filename,
          saveAs: true
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            reject(new Error('Error downloading file: ' + chrome.runtime.lastError.message));
          } else {
            resolve(filename);
          }
        });
      } catch (error) {
        reject(new Error('Error preparing export: ' + error.message));
      }
    }
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
