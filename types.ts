export interface UserProfile {
  age: number | ''; // Allow empty string for input handling
  income: number | ''; // Allow empty string for input handling
  occupation: string;
  state: string;
  category: string; // e.g., General, SC, ST, OBC
  gender: 'Male' | 'Female' | 'Other';
  disability: boolean;
}

export interface Scheme {
  id: string;
  name: string;
  name_hi?: string;
  description: string;
  description_hi?: string;
  eligibilityCriteria: string[];
  eligibilityCriteria_hi?: string[];
  benefits: string;
  benefits_hi?: string;
  category: string;
  category_hi?: string;
  sourceUrl: string;
  matchScore?: number; // Simulated vector similarity score
  state?: string; // 'Central' or specific state
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  isThinking?: boolean;
}

export enum AppView {
  HOME = 'HOME',
  PROFILE = 'PROFILE',
  RESULTS = 'RESULTS',
  ARCHITECTURE = 'ARCHITECTURE',
}

export type Language = 'en' | 'hi' | 'bn' | 'te'; // English, Hindi, Bengali, Telugu (Example)