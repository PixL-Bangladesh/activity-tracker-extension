import React from 'react';
import type { ActionEvent } from '../lib/action-tracking';
import { aiInsightGenerator } from '../lib/ai-insights';

interface AIInsightsPanelProps {
  actions: ActionEvent[];
}

interface AIInsightState {
  summary: string;
  steps: string[];
  suggestions: string[];
  isLoading: boolean;
  error: string | null;
}

export const AIInsightsPanel: React.FC<AIInsightsPanelProps> = ({ actions }) => {
  const [insights, setInsights] = React.useState<AIInsightState>({
    summary: '',
    steps: [],
    suggestions: [],
    isLoading: false,
    error: null
  });
  const [isVisible, setIsVisible] = React.useState(false);

  const generateInsights = async () => {
    if (actions.length === 0) {
      setInsights({
        ...insights,
        error: "No actions recorded yet. Interact with the page first."
      });
      return;
    }

    setInsights({
      ...insights,
      isLoading: true,
      error: null
    });

    try {
      const result = await aiInsightGenerator.generateInsights(actions);
      setInsights({
        summary: result.summary,
        steps: result.steps,
        suggestions: result.suggestions,
        isLoading: false,
        error: null
      });
      setIsVisible(true);
    } catch (error) {
      setInsights({
        ...insights,
        isLoading: false,
        error: "Failed to generate insights. Check your API key and network connection."
      });
    }
  };

  return (
    <div className="ai-insights-container">
      <div className="ai-insights-header">
        <h3>AI Insights</h3>
        <button 
          className="insights-button"
          onClick={generateInsights}
          disabled={insights.isLoading || actions.length === 0}
        >
          {insights.isLoading ? "Generating..." : "Generate Insights"}
        </button>
      </div>

      {insights.error && (
        <div className="insights-error">
          {insights.error}
        </div>
      )}

      {isVisible && !insights.error && (
        <div className="insights-content">
          <div className="insights-section">
            <h4>Summary</h4>
            <p>{insights.summary}</p>
          </div>

          {insights.steps.length > 0 && (
            <div className="insights-section">
              <h4>Steps</h4>
              <ol className="insights-list">
                {insights.steps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {insights.suggestions.length > 0 && (
            <div className="insights-section">
              <h4>Suggestions</h4>
              <ul className="insights-list">
                {insights.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .ai-insights-container {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
        
        .ai-insights-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .ai-insights-header h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
          font-weight: 600;
        }
        
        .insights-button {
          background-color: #4353ff;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .insights-button:hover {
          background-color: #3040ee;
        }
        
        .insights-button:disabled {
          background-color: #a0a0a0;
          cursor: not-allowed;
        }
        
        .insights-error {
          background-color: #ffebee;
          color: #c62828;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        
        .insights-content {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          border: 1px solid #e0e0e0;
        }
        
        .insights-section {
          margin-bottom: 20px;
        }
        
        .insights-section h4 {
          font-size: 16px;
          margin-bottom: 8px;
          color: #333;
          font-weight: 600;
        }
        
        .insights-list {
          margin: 0;
          padding-left: 20px;
        }
        
        .insights-list li {
          margin-bottom: 8px;
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};
