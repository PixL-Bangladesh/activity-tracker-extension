import type { ActionEvent } from "./action-tracking";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Configure your API keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;

interface AIInsight {
  summary: string;
  steps: string[];
  suggestions: string[];
  timestamp: number;
}

export class AIInsightGenerator {
  private geminiAI: GoogleGenerativeAI;

  constructor(apiKey: string = GEMINI_API_KEY) {
    this.geminiAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate insights from a sequence of actions
   */
  async generateInsights(actions: ActionEvent[]): Promise<AIInsight> {
    if (actions.length === 0) {
      return {
        summary: "No actions recorded",
        steps: [],
        suggestions: [],
        timestamp: Date.now(),
      };
    }

    // Format actions as a prompt for the AI
    const actionsText = actions
      .map((action) => {
        return `- ${action.description} [${new Date(
          action.timestamp
        ).toLocaleTimeString()}] on ${new URL(action.url || "").hostname}`;
      })
      .join("\n");

    // Build the prompt
    const prompt = `
      I have recorded the following sequence of user actions on a website:
      
      ${actionsText}
      
      Please analyze these actions and provide:
      1. A concise summary of what the user was trying to accomplish
      2. A numbered list of steps that describe the user flow in a clear, instructional manner
      3. Any suggestions for improving this workflow or potential issues the user might have encountered
      
      Format your response as JSON with the following structure:
      {
        "summary": "Concise summary here",
        "steps": ["Step 1 description", "Step 2 description", ...],
        "suggestions": ["Suggestion 1", "Suggestion 2", ...]
      }
    `;

    try {
      // Initialize the Gemini model
      const model = this.geminiAI.getGenerativeModel({ model: "gemini-pro" });

      // Generate content
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse the JSON response - improved parsing logic to handle various formats
      try {
        // Try direct JSON parsing first
        const insights = JSON.parse(text) as AIInsight;
        return {
          ...insights,
          timestamp: Date.now(),
        };
      } catch (jsonError) {
        // If direct parsing fails, try to extract JSON from the text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const jsonText = jsonMatch[0];
            const insights = JSON.parse(jsonText) as AIInsight;
            return {
              ...insights,
              timestamp: Date.now(),
            };
          } catch (extractionError) {
            console.error("Error parsing extracted JSON:", extractionError);
          }
        }
        
        // If all parsing attempts fail, create a structured summary from the raw text
        return {
          summary: "AI provided insights but in non-JSON format",
          steps: text.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.trim()),
          suggestions: ["Consider reviewing the raw AI response for more details"],
          timestamp: Date.now(),
        };
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      return {
        summary: "Error generating insights",
        steps: actions.map((a) => a.description),
        suggestions: ["Check API key and network connection"],
        timestamp: Date.now(),
      };
    }
  }
}

export const aiInsightGenerator = new AIInsightGenerator();
