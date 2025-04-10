import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { ChevronRight, ChevronDown, Download } from 'lucide-react';
import { Skeleton } from '~/components/ui/skeleton';
import type { ActionStep } from '~/utils/dom-processor';
import { generateDOMJson } from '~/utils/dom-processor';

interface UserFlowViewProps {
  steps: ActionStep[];
  loading: boolean;
  sessionId: string;
  domSnapshots: any[];
}

const UserFlowView: React.FC<UserFlowViewProps> = ({ steps, loading, sessionId, domSnapshots }) => {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleStepDetails = (stepId: number) => {
    setExpandedStep(expandedStep === stepId ? null : stepId);
  };

  const exportDOMJson = () => {
    // Generate JSON
    const jsonContent = generateDOMJson(domSnapshots);
    
    // Create a download link
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dom-${sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>User Flow</CardTitle>
          <CardDescription>Step-by-step user interactions</CardDescription>
        </div>
        <Button onClick={exportDOMJson} className="flex items-center gap-2">
          <Download size={16} />
          Export DOM.json
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : steps.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No user interactions recorded in this session</div>
        ) : (
          <div className="space-y-4">
            {steps.map((step, index) => (
              <Card key={index} className="border border-gray-200 overflow-hidden">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-gray-100 p-4 flex items-center justify-center w-12 h-12 rounded-l">
                    <span className="font-bold text-gray-700">{index + 1}</span>
                  </div>
                  <div className="flex-grow">
                    <CardHeader className="py-3 px-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">{step.description}</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleStepDetails(index)}
                          className="p-1 h-auto"
                        >
                          {expandedStep === index ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                        </Button>
                      </div>
                      <CardDescription className="text-xs">
                        {new Date(step.timestamp).toLocaleTimeString()}
                      </CardDescription>
                    </CardHeader>
                    
                    {expandedStep === index && (
                      <div className="px-4 pb-4">
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                          <h4 className="font-medium mb-2 text-gray-700">Details</h4>
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(step.details, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserFlowView;
