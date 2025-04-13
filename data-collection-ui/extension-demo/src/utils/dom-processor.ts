/**
 * DOM processing utilities for enhanced user interaction tracking
 */

import type { MouseClickData, InputChangeData, CustomEventType } from '~/types';

export interface ActionStep {
  type: 'click' | 'input' | 'navigation';
  description: string;
  timestamp: number;
  details?: any;
}

export interface DOMSnapshotData {
  snapshot: any;
  url: string;
  timestamp: number;
}

/**
 * Processes a series of user interactions and converts them to a readable flow
 */
export function processInteractionsToFlow(
  clickEvents: MouseClickData[],
  inputEvents: InputChangeData[]
): ActionStep[] {
  const steps: ActionStep[] = [];
  
  // Combine all interactions
  const allInteractions = [
    ...clickEvents.map(event => ({ 
      type: 'click' as const, 
      data: event, 
      timestamp: event.timestamp 
    })),
    ...inputEvents.map(event => ({ 
      type: 'input' as const, 
      data: event, 
      timestamp: event.timestamp 
    }))
  ];
  
  // Sort interactions by timestamp
  const sortedInteractions = [...allInteractions].sort((a, b) => a.timestamp - b.timestamp);
  
  // Track inputs by element to avoid duplicates in short succession
  const lastInputByElement: Record<string, { value: string, timestamp: number }> = {};
  
  for (const interaction of sortedInteractions) {
    if (interaction.type === 'click') {
      // This is a MouseClickData
      steps.push({
        type: 'click',
        description: `Click ${interaction.data.target}`,
        timestamp: interaction.timestamp,
        details: {
          position: { x: interaction.data.x, y: interaction.data.y },
          button: interaction.data.button
        }
      });
    } else if (interaction.type === 'input') {
      // This is an InputChangeData
      const elementKey = interaction.data.element;
      const currentValue = interaction.data.value;
      
      // Check if we've seen this element before
      const lastInput = lastInputByElement[elementKey];
      
      // Only add as a new step if:
      // 1. We haven't seen this element before, or
      // 2. The value is different and it's been more than 2 seconds since the last input
      if (!lastInput || 
          (currentValue !== lastInput.value && 
           interaction.timestamp - lastInput.timestamp > 2000)) {
        
        steps.push({
          type: 'input',
          description: `Type "${currentValue}" in ${elementKey}`,
          timestamp: interaction.timestamp,
          details: {
            value: currentValue,
            element: elementKey
          }
        });
        
        // Update the last input for this element
        lastInputByElement[elementKey] = {
          value: currentValue,
          timestamp: interaction.timestamp
        };
      }
    }
  }
  
  return steps;
}

/**
 * Saves the DOM snapshot to a JSON file
 */
export function saveDOMSnapshot(domSnapshot: any): string {
  // In a real implementation, this would save to storage
  // For now, we'll just return the stringified JSON
  return JSON.stringify(domSnapshot, null, 2);
}

/**
 * Finds an element in the DOM snapshot by description
 */
export function findElementInSnapshot(domSnapshot: any, description: string): any | null {
  // Simple recursive search function
  function search(node: any): any | null {
    // Check if this node matches the description
    if (node.text && description.includes(node.text)) {
      return node;
    }
    
    // Check attributes
    const attrs = node.attributes || {};
    if (attrs['aria-label'] && description.includes(attrs['aria-label'])) {
      return node;
    }
    
    // Recursively search children
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const result = search(child);
        if (result) return result;
      }
    }
    
    return null;
  }
  
  return search(domSnapshot);
}

/**
 * Generates a human-readable flow from the action steps
 */
export function generateHumanReadableFlow(steps: ActionStep[]): string {
  return steps.map((step, index) => {
    return `${index + 1}. ${step.description}`;
  }).join('\n');
}

/**
 * Extracts events of a specific type from the session events
 */
export function extractEventsOfType(events: any[], eventType: CustomEventType): any[] {
  return events.filter(event => 
    event.data?.type === eventType
  ).map(event => event.data.data);
}

/**
 * Generates a DOM.json file from the DOM snapshots
 */
export function generateDOMJson(domSnapshots: any[]): string {
  const processedSnapshots = domSnapshots.map(snapshot => {
    // Add any additional processing needed for LLM consumption
    return {
      timestamp: snapshot.timestamp,
      url: snapshot.url,
      snapshot: snapshot.snapshot
    };
  });
  
  return JSON.stringify(processedSnapshots, null, 2);
}
