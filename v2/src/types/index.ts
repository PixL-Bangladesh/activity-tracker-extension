// Interface for timeline events
export interface TimelineEvent {
  id: string;
  timestamp: number;
  relativeTime: number;
  type: 'network' | 'mouseClick' | 'keypress' | 'consoleLog';
  description: string;
  details: any;
  icon?: React.ReactNode;
  userAnnotation?: string; // User's explanation of what they were trying to do
  inputValue?: string;
  parentElement?: string;
  href?: string;
}