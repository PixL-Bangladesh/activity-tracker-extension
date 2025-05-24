import { 
  EventType, 
  IncrementalSource, 
  MouseInteractions 
} from '@rrweb/types';
import type { 
  eventWithTime,
  incrementalSnapshotEvent,
  mouseInteractionData,
  inputData,
  scrollData,
  viewportResizeData,
  mutationData,
  mousemoveData,
  mediaInteractionData
} from '@rrweb/types';

export interface SessionAnalysis {
  totalEvents: number;
  firstTimestamp: number;
  lastTimestamp: number;
  sessionDuration: number; // in seconds
  
  eventCounts: {
    domContentLoaded: number;
    load: number;
    fullSnapshot: number;
    incrementalSnapshot: {
      total: number;
      bySource: Record<string, number>;
    };
    meta: number;
    custom: number;
    plugin: number;
  };
  
  mouseInteractions: {
    total: number;
    mouseUp: number;
    mouseDown: number;
    click: number;
    contextMenu: number;
    dblClick: number;
    focus: number;
    blur: number;
    touchStart: number;
    touchEnd: number;
    mouseMove: number;
  };
  
  keyboardInteractions?: {
    total: number;
    withCtrl: number;
    withAlt: number;
    withShift: number;
    withMeta: number;
    enter: number;
    backspace: number;
    tab: number;
    escape: number;
    arrows: number;
  };
  
  inputEvents: number;
  scrollEvents: number;
  resizeEvents: number;
  mediaEvents: number;
  mutationEvents: number;
  
  customEventsByTag: Record<string, number>;
  pluginEventsByName: Record<string, number>;
}

/**
 * Analyzes a session's events and returns structured statistics
 */
export function analyzeSession(events: eventWithTime[]): SessionAnalysis {
  if (!events || events.length === 0) {
    throw new Error('No events to analyze');
  }

  const firstEvent = events[0];
  const lastEvent = events[events.length - 1];
  
  const analysis: SessionAnalysis = {
    totalEvents: events.length,
    firstTimestamp: firstEvent.timestamp,
    lastTimestamp: lastEvent.timestamp,
    sessionDuration: Math.round((lastEvent.timestamp - firstEvent.timestamp) / 1000),
    
    eventCounts: {
      domContentLoaded: 0,
      load: 0,
      fullSnapshot: 0,
      incrementalSnapshot: {
        total: 0,
        bySource: {},
      },
      meta: 0,
      custom: 0,
      plugin: 0,
    },
    
    mouseInteractions: {
      total: 0,
      mouseUp: 0,
      mouseDown: 0,
      click: 0,
      contextMenu: 0,
      dblClick: 0,
      focus: 0,
      blur: 0,
      touchStart: 0,
      touchEnd: 0,
      mouseMove: 0,
    },
    
    keyboardInteractions: undefined,
    
    inputEvents: 0,
    scrollEvents: 0,
    resizeEvents: 0,
    mediaEvents: 0,
    mutationEvents: 0,
    
    customEventsByTag: {},
    pluginEventsByName: {},
  };
  
  // Process each event
  events.forEach(event => {
    // Count by event type
    switch (event.type) {
      case EventType.DomContentLoaded:
        analysis.eventCounts.domContentLoaded++;
        break;
        
      case EventType.Load:
        analysis.eventCounts.load++;
        break;
        
      case EventType.FullSnapshot:
        analysis.eventCounts.fullSnapshot++;
        break;
        
      case EventType.IncrementalSnapshot:
        analysis.eventCounts.incrementalSnapshot.total++;
        
        // Type cast to get access to the source property
        const incrementalEvent = event as incrementalSnapshotEvent;
        
        // Get source name from IncrementalSource enum
        const sourceName = IncrementalSource[incrementalEvent.data.source];
        analysis.eventCounts.incrementalSnapshot.bySource[sourceName] = 
          (analysis.eventCounts.incrementalSnapshot.bySource[sourceName] || 0) + 1;
        
        // Process by source type
        switch (incrementalEvent.data.source) {
          case IncrementalSource.MouseInteraction:
            const mouseData = incrementalEvent.data as mouseInteractionData;
            analysis.mouseInteractions.total++;
            
            // Count by interaction type
            switch (mouseData.type) {
              case MouseInteractions.MouseUp:
                analysis.mouseInteractions.mouseUp++;
                break;
              case MouseInteractions.MouseDown:
                analysis.mouseInteractions.mouseDown++;
                break;
              case MouseInteractions.Click:
                analysis.mouseInteractions.click++;
                break;
              case MouseInteractions.ContextMenu:
                analysis.mouseInteractions.contextMenu++;
                break;
              case MouseInteractions.DblClick:
                analysis.mouseInteractions.dblClick++;
                break;
              case MouseInteractions.Focus:
                analysis.mouseInteractions.focus++;
                break;
              case MouseInteractions.Blur:
                analysis.mouseInteractions.blur++;
                break;
              case MouseInteractions.TouchStart:
                analysis.mouseInteractions.touchStart++;
                break;
              case MouseInteractions.TouchEnd:
                analysis.mouseInteractions.touchEnd++;
                break;
              case MouseInteractions.MouseMove:
                analysis.mouseInteractions.mouseMove++;
                break;
            }
            break;
            
          case IncrementalSource.Input:
            analysis.inputEvents++;
            break;
            
          case IncrementalSource.Scroll:
            analysis.scrollEvents++;
            break;
            
          case IncrementalSource.ViewportResize:
            analysis.resizeEvents++;
            break;
            
          case IncrementalSource.MediaInteraction:
            analysis.mediaEvents++;
            break;
            
          case IncrementalSource.Mutation:
            analysis.mutationEvents++;
            break;
        }
        break;
        
      case EventType.Meta:
        analysis.eventCounts.meta++;
        break;
        
      case EventType.Custom:
        analysis.eventCounts.custom++;
        const customEvent = (event as any).data;
        if (customEvent && customEvent.tag) {
          analysis.customEventsByTag[customEvent.tag] = 
            (analysis.customEventsByTag[customEvent.tag] || 0) + 1;
        }
        break;
        
      case EventType.Plugin:
        analysis.eventCounts.plugin++;
        const pluginEvent = (event as any).data;
        if (pluginEvent && pluginEvent.plugin) {
          analysis.pluginEventsByName[pluginEvent.plugin] = 
            (analysis.pluginEventsByName[pluginEvent.plugin] || 0) + 1;
        }
        break;
    }
  });
  
  return analysis;
}

/**
 * Helper function to get all click events from a session
 */
export function getClickEvents(events: eventWithTime[]): incrementalSnapshotEvent[] {
  return events.filter(event => {
    if (event.type !== EventType.IncrementalSnapshot) return false;
    
    const incrementalEvent = event as incrementalSnapshotEvent;
    return (
      incrementalEvent.data.source === IncrementalSource.MouseInteraction &&
      (incrementalEvent.data as mouseInteractionData).type === MouseInteractions.Click
    );
  }) as incrementalSnapshotEvent[];
}

/**
 * Helper function to get all input events from a session
 */
export function getInputEvents(events: eventWithTime[]): incrementalSnapshotEvent[] {
  return events.filter(event => {
    if (event.type !== EventType.IncrementalSnapshot) return false;
    
    const incrementalEvent = event as incrementalSnapshotEvent;
    return incrementalEvent.data.source === IncrementalSource.Input;
  }) as incrementalSnapshotEvent[];
}

/**
 * Helper function to get all incremental events of a specific source
 */
export function getIncrementalEventsBySource(
  events: eventWithTime[], 
  source: IncrementalSource
): incrementalSnapshotEvent[] {
  return events.filter(event => {
    if (event.type !== EventType.IncrementalSnapshot) return false;
    
    const incrementalEvent = event as incrementalSnapshotEvent;
    return incrementalEvent.data.source === source;
  }) as incrementalSnapshotEvent[];
}

/**
 * Helper function to get all plugin events with a specific name
 */
export function getPluginEventsByName(events: eventWithTime[], pluginName: string): eventWithTime[] {
  return events.filter(event => {
    if (event.type !== EventType.Plugin) return false;
    
    const pluginEvent = (event as any).data;
    return pluginEvent && pluginEvent.plugin === pluginName;
  });
}
