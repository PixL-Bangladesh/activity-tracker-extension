/**
 * Data exporter for Action Tracker extension
 * Handles exporting session data in various formats
 */

// Base exporter class
class Exporter {
  constructor() { }

  // Export session data
  async export(sessionData) {
    throw new Error('Method not implemented');
  }
}

// JSON exporter
class JSONExporter extends Exporter {
  constructor(options = {}) {
    super();
    this.options = {
      pretty: true,
      includeScreenshots: true,
      ...options
    };
  }

  async export(sessionData, events) {
    // Create the export structure
    const exportData = {
      session: sessionData,
      events: events,
      exportTime: Date.now(),
      exportVersion: '1.0'
    };

    // Remove screenshots if not included
    if (!this.options.includeScreenshots) {
      exportData.events = exportData.events.map(event => {
        if (event.type === 'screenshot') {
          return {
            ...event,
            dataUrl: '[SCREENSHOT_DATA_REMOVED]'
          };
        }
        return event;
      });
    }

    // Convert to JSON
    return this.options.pretty
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
  }
}

// File saver utility
class FileSaver {
  constructor() { }

  // Save data to a file
  async saveToFile(data, filename) {
    // Create a blob
    const blob = new Blob([data], { type: 'application/json' });

    // Create a download URL
    const url = URL.createObjectURL(blob);

    // Create a download link
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Trigger the download
    document.body.appendChild(a);
    a.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    return filename;
  }
}

// Session exporter - combines storage, exporter and file saver
class SessionExporter {
  constructor(sessionStorage) {
    this.sessionStorage = sessionStorage;
    this.exporter = new JSONExporter();
    this.fileSaver = new FileSaver();
  }

  // Export a session to a file
  async exportSession(sessionId) {
    // Get session data
    const sessionData = await this.sessionStorage.getSession(sessionId);
    if (!sessionData) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Get all event batches
    const batchIds = await this.sessionStorage.listEventBatches(sessionId);
    let allEvents = [];

    for (const batchId of batchIds) {
      const events = await this.sessionStorage.getEventsBatch(sessionId, batchId);
      allEvents = allEvents.concat(events);
    }

    // Sort events by timestamp
    allEvents.sort((a, b) => a.timestamp - b.timestamp);

    // Export data
    const jsonData = await this.exporter.export(sessionData, allEvents);

    // Generate filename
    const timestamp = new Date(sessionData.startTime).toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '');
    const filename = `action-tracker-${sessionId}-${timestamp}.json`;

    // Save to file
    return this.fileSaver.saveToFile(jsonData, filename);
  }

  // Export all sessions
  async exportAllSessions() {
    const sessionIds = await this.sessionStorage.listSessions();
    const results = [];

    for (const sessionId of sessionIds) {
      try {
        const filename = await this.exportSession(sessionId);
        results.push({ sessionId, filename, success: true });
      } catch (error) {
        results.push({ sessionId, error: error.message, success: false });
      }
    }

    return results;
  }
}

// Export classes
export { Exporter, JSONExporter, FileSaver, SessionExporter };
