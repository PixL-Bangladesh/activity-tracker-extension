import React, { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import UserFlowView from './UserFlowView';
import DOMSnapshotView from './DOMSnapshotView';
import { processInteractionsToFlow, extractEventsOfType } from '~/utils/dom-processor';
import { CustomEventType } from '~/types';
import type { ActionStep } from '~/utils/dom-processor';

interface ScribeFlowControllerProps {
  sessionId: string;
  events: any[];
  loading: boolean;
}

const ScribeFlowController: React.FC<ScribeFlowControllerProps> = ({ 
  sessionId, 
  events, 
  loading 
}) => {
  const [activeTab, setActiveTab] = useState('flow');
  const [userFlowSteps, setUserFlowSteps] = useState<ActionStep[]>([]);
  const [domSnapshots, setDomSnapshots] = useState<any[]>([]);
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!events || events.length === 0) return;

    try {
      // Process events for user flow
      processUserFlow(events);
      
      // Process DOM snapshots
      processDOMSnapshots(events);
    } catch (error) {
      console.error('Error processing events:', error);
    }
  }, [events]);

  // Process events for user flow display
  const processUserFlow = (events: any[]) => {
    try {
      // Extract click events
      const clickEvents = extractEventsOfType(events, CustomEventType.MouseClick);
      
      // Extract input events
      const inputEvents = extractEventsOfType(events, CustomEventType.InputChange);
      
      console.log(`Processing ${clickEvents.length} click events and ${inputEvents.length} input events`);
      
      // Process and store input values for each input event
      const newInputValues: Record<string, string> = {};
      inputEvents.forEach(event => {
        if (event.value && event.element) {
          newInputValues[event.element] = event.value;
          console.log(`Stored input value for ${event.element}:`, event.value);
        }
      });
      setInputValues(newInputValues);
      
      // Log some sample events for debugging
      if (inputEvents.length > 0) {
        console.log('Sample input event:', inputEvents[0]);
      }
      
      // Enhance input events with full values before processing
      const enhancedInputEvents = inputEvents.map(event => ({
        ...event,
        value: event.value || newInputValues[event.element] || ''
      }));
      
      // Process interactions to create a flow
      const steps = processInteractionsToFlow(clickEvents, enhancedInputEvents);
      console.log(`Generated ${steps.length} flow steps`);
      
      setUserFlowSteps(steps);
    } catch (error) {
      console.error('Error processing user flow:', error);
    }
  };

  // Process DOM snapshots
  const processDOMSnapshots = (events: any[]) => {
    // Extract initial DOM snapshots
    const initialSnapshots = extractEventsOfType(events, CustomEventType.DOMSnapshot)
      .map(snapshot => ({
        ...snapshot,
        type: 'initial'
      }));
    
    // Extract click snapshots that have DOM data
    const clickSnapshots = extractEventsOfType(events, CustomEventType.MouseClick)
      .filter(event => event.domSnapshot)
      .map(event => ({
        timestamp: event.timestamp,
        url: event.url || window.location.href,
        snapshot: event.domSnapshot,
        target: event.target,
        type: 'click'
      }));
    
    // Also include DOM snapshots after input events
    const inputSnapshots = extractEventsOfType(events, CustomEventType.InputChange)
      .filter(event => event.domSnapshot)
      .map(event => ({
        timestamp: event.timestamp,
        url: event.url || window.location.href,
        snapshot: event.domSnapshot,
        target: event.element,
        value: event.value,
        type: 'input'
      }));
    
    // Combine all snapshots and sort by timestamp
    const allSnapshots = [...initialSnapshots, ...clickSnapshots, ...inputSnapshots]
      .sort((a, b) => a.timestamp - b.timestamp);
    
    setDomSnapshots(allSnapshots);
  };

  return (
    <Tabs defaultValue="flow" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="flow">User Flow</TabsTrigger>
        <TabsTrigger value="dom">DOM Snapshots</TabsTrigger>
      </TabsList>
      
      <TabsContent value="flow">
        <UserFlowView 
          steps={userFlowSteps} 
          loading={loading} 
          sessionId={sessionId}
          domSnapshots={domSnapshots}
          inputValues={inputValues}
        />
      </TabsContent>
      
      <TabsContent value="dom">
        <DOMSnapshotView 
          snapshots={domSnapshots} 
          loading={loading} 
        />
      </TabsContent>
    </Tabs>
  );
};

export default ScribeFlowController;
