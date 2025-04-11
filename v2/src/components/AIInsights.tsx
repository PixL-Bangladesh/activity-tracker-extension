import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Button } from '~/components/ui/button';
import { Sparkles, FilePlus, Library, Share2, Brain, ActivitySquare, AlertTriangle } from 'lucide-react';
import { Skeleton } from '~/components/ui/skeleton';
import { Badge } from '~/components/ui/badge';
import { ScrollArea } from '~/components/ui/scroll-area';
import { aiInsightGenerator } from '~/lib/ai-insights';
import type { TimelineEvent } from '~/types';

interface AIInsightsProps {
  sessionId: string;
  timelineEvents: TimelineEvent[];
  advancedAnalytics: any;
}

interface InsightState {
  summary: string;
  steps: string[];
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

const AIInsights: React.FC<AIInsightsProps> = ({ 
  sessionId, 
  timelineEvents, 
  advancedAnalytics
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [insights, setInsights] = useState<InsightState>({
    summary: '',
    steps: [],
    suggestions: [],
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  // Helper function to convert timeline events to action events for AI processing
  const convertToActionEvents = (events: TimelineEvent[]) => {
    return events.map(event => ({
      type: event.type,
      target: {
        tag: event.details?.target || event.type,
        text: event.details?.text || '',
        xpath: event.details?.xpath || '',
      },
      description: event.description,
      timestamp: event.timestamp,
      value: event.inputValue || '',
      url: event.details?.url || window.location.href
    }));
  };

  const generateInsights = async () => {
    if (!timelineEvents || timelineEvents.length === 0) {
      setInsights({
        ...insights,
        error: "No events recorded yet. Interact with the page to generate insights.",
        isLoading: false
      });
      return;
    }

    setInsights({
      ...insights,
      isLoading: true,
      error: null
    });

    try {
      // Convert timeline events to action events
      const actionEvents = convertToActionEvents(timelineEvents);
      
      // Generate insights using AI
      const result = await aiInsightGenerator.generateInsights(actionEvents);
      
      setInsights({
        summary: result.summary,
        steps: result.steps,
        suggestions: result.suggestions,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error("Error generating insights:", error);
      setInsights({
        ...insights,
        isLoading: false,
        error: "Failed to generate insights. Please check your API key configuration."
      });
    }
  };

  // Auto-generate insights on first load if we have events
  useEffect(() => {
    if (timelineEvents && timelineEvents.length > 0 && !insights.lastUpdated) {
      generateInsights();
    }
  }, [timelineEvents]);

  return (
    <div className="space-y-6">
      {/* Controls and status bar */}
      <div className="flex justify-between items-center p-4 rounded-lg bg-gray-100">
        <div>
          <h3 className="font-medium flex items-center">
            <Brain className="h-5 w-5 mr-2 text-blue-600" />
            AI Analysis
          </h3>
          <p className="text-sm text-gray-500">
            {insights.lastUpdated 
              ? `Last updated: ${new Date(insights.lastUpdated).toLocaleTimeString()}`
              : 'Not yet generated'}
          </p>
        </div>
        <Button 
          onClick={generateInsights}
          disabled={insights.isLoading || timelineEvents.length === 0}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {insights.isLoading ? 'Generating...' : 'Generate Insights'}
        </Button>
      </div>

      {/* Error Display */}
      {insights.error && (
        <div className="p-4 rounded-lg bg-red-50 text-red-800">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 text-red-500" />
            <p>{insights.error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {insights.isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-32 w-full" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Insights Content */}
      {!insights.isLoading && insights.summary && (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FilePlus className="h-5 w-5 mr-2 text-blue-600" />
                  Session Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-6 rounded-lg bg-gray-50">
                  <p className="text-lg leading-relaxed whitespace-pre-line">{insights.summary}</p>
                </div>
                
                <div className="mt-6">
                  <h4 className="text-md font-medium mb-3 flex items-center">
                    <ActivitySquare className="h-4 w-4 mr-2 text-yellow-600" />
                    Key Metrics
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-500">Events</p>
                      <p className="text-2xl font-bold">{timelineEvents.length}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-500">User Inputs</p>
                      <p className="text-2xl font-bold">
                        {timelineEvents.filter(e => e.type === 'keypress').length}
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <p className="text-sm text-gray-500">Clicks</p>
                      <p className="text-2xl font-bold">
                        {timelineEvents.filter(e => e.type === 'mouseClick').length}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="steps">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Library className="h-5 w-5 mr-2 text-blue-600" />
                  Step-by-Step Flow
                </CardTitle>
                <CardDescription>
                  Detailed sequence of actions performed by the user
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <ol className="space-y-4 ml-4">
                    {insights.steps.map((step, index) => (
                      <li key={index} className="list-decimal">
                        <div className="p-4 rounded-lg bg-gray-50">
                          <p className="text-md">{step}</p>
                          
                          {/* Find matching event for this step if possible */}
                          {index < timelineEvents.length && (
                            <div className="mt-2">
                              <Badge>
                                {new Date(timelineEvents[index].timestamp).toLocaleTimeString()}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Share2 className="h-5 w-5 mr-2 text-blue-600" />
                  Improvement Suggestions
                </CardTitle>
                <CardDescription>
                  AI-generated recommendations based on user behavior
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4">
                  <ul className="space-y-4">
                    {insights.suggestions.map((suggestion, index) => (
                      <li key={index}>
                        <div className="p-4 rounded-lg bg-gray-50">
                          <div className="flex">
                            <span className="inline-flex items-center justify-center rounded-full h-6 w-6 mr-2 bg-blue-100 text-blue-800">
                              {index + 1}
                            </span>
                            <p>{suggestion}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* No Content State */}
      {!insights.isLoading && !insights.summary && !insights.error && (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
          <Sparkles className="h-12 w-12 mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">No insights generated yet</h3>
          <p className="max-w-md mb-4 text-gray-500">
            Generate AI-powered insights to understand user behavior patterns and get recommendations for improvements.
          </p>
          <Button 
            onClick={generateInsights}
            disabled={timelineEvents.length === 0}
          >
            Generate Insights
          </Button>
        </div>
      )}
    </div>
  );
};

export default AIInsights;
