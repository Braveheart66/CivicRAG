import { GoogleGenAI } from "@google/genai";
import { UserProfile, Scheme, Language } from '../types';

// Initialize Gemini Client
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const checkIsApiKeyAvailable = () => {
  return !!apiKey;
};

const getLanguageName = (lang: Language) => {
  switch(lang) {
    case 'hi': return 'Hindi';
    case 'bn': return 'Bengali';
    case 'te': return 'Telugu';
    default: return 'English';
  }
};

/**
 * Simulates the "Synthesis" phase of the RAG architecture.
 */
export const synthesizeRecommendations = async (
  profile: UserProfile,
  schemes: Scheme[],
  language: Language
): Promise<string> => {
  if (!apiKey) {
    return "API Key missing. Please provide a valid Gemini API Key to see the AI synthesis.";
  }

  const model = 'gemini-2.5-flash';
  const langName = getLanguageName(language);
  
  const contextText = schemes.map(s => 
    `Scheme: ${s.name}\nBenefits: ${s.benefits}\nEligibility: ${s.eligibilityCriteria.join(', ')}`
  ).join('\n---\n');

  const userContext = `
    Age: ${profile.age}
    Income: INR ${profile.income}
    Occupation: ${profile.occupation}
    State: ${profile.state}
    Gender: ${profile.gender}
  `;

  const prompt = `
    You are an expert Government Scheme Consultant. 
    Based on the following user profile and the provided list of relevant schemes (context), 
    write a helpful summary explaining WHY the user might be eligible for these specific schemes.
    
    User Profile:
    ${userContext}

    Retrieved Schemes (Context):
    ${contextText}

    Instructions:
    1. Respond in ${langName} language.
    2. Be concise and encouraging.
    3. Highlight specific eligibility matches (e.g., "Since you are a farmer...").
    4. Do not invent schemes not in the list.
    5. Format with markdown bullet points.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI analysis. Please try again.";
  }
};

/**
 * Handles follow-up chat questions (RAG Chat).
 */
export const chatWithSchemes = async (
  history: { role: string; content: string }[],
  currentMessage: string,
  contextSchemes: Scheme[],
  language: Language
): Promise<string> => {
  if (!apiKey) return "API Key missing.";

  const model = 'gemini-2.5-flash';
  const langName = getLanguageName(language);

  const contextText = contextSchemes.map(s => 
    `Scheme: ${s.name}\nDescription: ${s.description}\nBenefits: ${s.benefits}\nCriteria: ${s.eligibilityCriteria.join(', ')}`
  ).join('\n---\n');

  const systemInstruction = `
    You are a helpful assistant for government schemes. 
    Use the provided context to answer the user's question.
    If the answer is not in the context, generally explain that you don't have that info but offer general advice.
    Respond in ${langName}.
    
    Context:
    ${contextText}
  `;

  const fullPrompt = `
    ${systemInstruction}
    
    User Question: ${currentMessage}
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: fullPrompt,
    });
    return response.text || "I'm not sure how to answer that.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Sorry, I encountered an error processing your request.";
  }
};
