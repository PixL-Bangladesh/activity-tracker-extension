# Action Tracker Browser Extension

A comprehensive browser extension for tracking and recording user interactions, DOM changes, accessibility information, and other browser events.

## Features

This extension captures detailed information about user interactions with web pages:

### Browser Environment Tracking
- **Input Events**: Captures mouse movements, clicks, scrolls, and keystrokes with timestamps and coordinates
- **DOM & Accessibility**: Records DOM snapshots/diffs and accessibility (a11y) tree
- **Event & CSS Details**: Logs event listeners and visual state
- **Network & Storage**: Monitors network calls (XHR, fetch) and browser storage
- **Visual Capture**: Takes screenshots after interactions
- **Additional Browser Events**: Tracks tab focus, visibility changes, clipboard actions

### Session Management
- Start/stop recording sessions
- Export session data as JSON
- Configure which types of events to capture
- View session statistics

## Installation

Since this is a development version, you'll need to load it as an unpacked extension:

1. Open Chrome/Edge and navigate to the extensions page:
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

2. Enable "Developer mode" (toggle in the top-right corner)

3. Click "Load unpacked" and select the `action-tracker` directory

## Usage

1. Click the extension icon in your browser toolbar to open the popup
2. Configure capture settings as needed
3. Click "Start Recording" to begin capturing data
4. Interact with web pages normally
5. Click "Stop Recording" when finished
6. Click "Export Data" to save the captured data as a JSON file

## Data Structure

The extension stores data in a structured JSON format:

```
{
  "session": {
    "id": "session_1234567890",
    "startTime": 1616161616161,
    "endTime": 1616161717171,
    "duration": 101010,
    "metadata": { ... },
    "tabs": { ... },
    "settings": { ... }
  },
  "events": [
    {
      "type": "mouseMove",
      "timestamp": 1616161616200,
      "position": { ... },
      "target": { ... }
    },
    {
      "type": "click",
      "timestamp": 1616161616300,
      "position": { ... },
      "target": { ... }
    },
    ...
  ]
}
```

## Development

The extension is built with vanilla JavaScript and uses the following components:

- **manifest.json**: Extension configuration
- **popup.html/js/css**: User interface for controlling the extension
- **background.js**: Background script for managing sessions and data
- **content.js**: Content script injected into web pages to capture events
- **lib/rrweb.min.js**: Library for recording DOM changes
- **models/**: Data models for structured storage
- **utils/**: Utility functions for data processing and export

## Notes

- All data is stored locally in the browser's storage
- No data is sent to any server
- Large amounts of data may impact browser performance
- Screenshots and DOM snapshots can consume significant storage space

## Privacy Considerations

- The extension redacts password field inputs
- You can disable specific capture types in the settings
- Review exported data before sharing it to ensure no sensitive information is included
