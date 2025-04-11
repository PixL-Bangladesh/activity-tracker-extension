import React, { useState, useEffect } from 'react';
import { ActionEvent, actionTracker } from '../lib/action-tracking';
import { AIInsightsPanel } from './AIInsightsPanel';

interface ActivityViewerProps {
  isRecording: boolean;
  onStopRecording?: () => void;
}

interface Step {
  action: ActionEvent;
  expanded: boolean;
}

export const ActivityViewer: React.FC<ActivityViewerProps> = ({ isRecording, onStopRecording }) => {
  const [actions, setActions] = useState<ActionEvent[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [showNetworkInfo, setShowNetworkInfo] = useState<Record<number, boolean>>({});

  // Poll for new actions every second
  useEffect(() => {
    if (!isRecording) return;

    const interval = setInterval(() => {
      const currentActions = actionTracker.getActions();
      setActions(currentActions);
      
      // Convert actions to steps
      setSteps(currentActions.map(action => ({
        action,
        expanded: false
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, [isRecording]);

  // Toggle network info visibility
  const toggleNetworkInfo = (index: number) => {
    setShowNetworkInfo(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Toggle step expansion
  const toggleStepExpansion = (index: number) => {
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[index] = {
        ...newSteps[index],
        expanded: !newSteps[index].expanded
      };
      return newSteps;
    });
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Get favicon for a URL
  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="activity-viewer">
      <div className="header">
        <h2>Activity Recording</h2>
        {isRecording && (
          <button 
            className="stop-button"
            onClick={onStopRecording}
          >
            Stop Recording
          </button>
        )}
      </div>

      <div className="steps-container">
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`step ${step.expanded ? 'expanded' : ''}`}
            onClick={() => toggleStepExpansion(index)}
          >
            <div className="step-header">
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <div className="step-description">
                  {step.action.description}
                </div>
                <div className="step-details">
                  {step.action.url && (
                    <img 
                      className="favicon" 
                      src={getFavicon(step.action.url)} 
                      alt=""
                    />
                  )}
                  <span className="timestamp">{formatTime(step.action.timestamp)}</span>
                </div>
              </div>
            </div>

            {step.expanded && (
              <div className="step-details-expanded" onClick={e => e.stopPropagation()}>
                <button 
                  className="more-info-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNetworkInfo(index);
                  }}
                >
                  {showNetworkInfo[index] ? 'Hide' : 'Show'} More Info
                </button>

                {showNetworkInfo[index] && (
                  <div className="network-info">
                    <h4>Technical Details</h4>
                    <div className="info-row">
                      <span>Type:</span>
                      <span>{step.action.type}</span>
                    </div>
                    <div className="info-row">
                      <span>Element:</span>
                      <span>{step.action.target.tag}{step.action.target.id ? `#${step.action.target.id}` : ''}</span>
                    </div>
                    {step.action.target.xpath && (
                      <div className="info-row">
                        <span>XPath:</span>
                        <span className="xpath">{step.action.target.xpath}</span>
                      </div>
                    )}
                    {step.action.url && (
                      <div className="info-row">
                        <span>URL:</span>
                        <span className="url">{step.action.url}</span>
                      </div>
                    )}
                    {step.action.value && (
                      <div className="info-row">
                        <span>Value:</span>
                        <span>{step.action.value}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {steps.length === 0 && (
          <div className="empty-state">
            <p>No activities recorded yet. Start interacting with the page to see your actions.</p>
          </div>
        )}
      </div>

      {/* AI Insights Panel */}
      {steps.length > 0 && (
        <AIInsightsPanel actions={actions} />
      )}

      <style jsx>{`
        .activity-viewer {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: #fff;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 1px solid #eaeaea;
          padding-bottom: 16px;
        }

        h2 {
          margin: 0;
          color: #333;
          font-size: 20px;
          font-weight: 600;
        }

        .stop-button {
          background-color: #ff4d4f;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: 500;
          cursor: pointer;
        }

        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .step {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .step:hover {
          background-color: #f5f5f5;
        }

        .step.expanded {
          background-color: #f0f7ff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .step-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }

        .step-number {
          background-color: #1677ff;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
          flex-shrink: 0;
        }

        .step-content {
          flex: 1;
        }

        .step-description {
          font-weight: 500;
          margin-bottom: 4px;
          color: #333;
        }

        .step-details {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #666;
        }

        .favicon {
          width: 16px;
          height: 16px;
          margin-right: 6px;
        }

        .timestamp {
          font-size: 12px;
        }

        .step-details-expanded {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px dashed #ddd;
        }

        .more-info-button {
          background-color: transparent;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          padding: 4px 12px;
          font-size: 12px;
          cursor: pointer;
          color: #666;
        }

        .network-info {
          margin-top: 16px;
          background-color: #fafafa;
          border-radius: 6px;
          padding: 12px;
          font-size: 13px;
        }

        .info-row {
          display: flex;
          padding: 4px 0;
        }

        .info-row span:first-child {
          font-weight: 500;
          width: 80px;
          color: #666;
        }

        .xpath, .url {
          word-break: break-all;
          font-family: monospace;
          font-size: 12px;
        }

        .empty-state {
          padding: 32px;
          text-align: center;
          color: #666;
          background-color: #fafafa;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
};
