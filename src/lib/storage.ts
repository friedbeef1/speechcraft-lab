// LocalStorage utilities for scenarios and sessions
// This provides browser storage as a fallback when not authenticated

export interface StoredScenario {
  id: string;
  title: string;
  description: string;
  icon: string;
  prompts: { id: string; text: string }[];
  createdAt: string;
}

export interface StoredSession {
  id: string;
  completedAt: string;
  fluencyScore: number;
  wordCount: number;
  speechRate: number;
  fillerWordCount: number;
  transcript?: string;
  deliveryFeedback: string[];
  contentFeedback: string[];
  duration: number;
}

const SCENARIOS_KEY = "speech-coach-scenarios";
const SESSIONS_KEY = "speech-coach-sessions";

// Scenarios
export const getScenarios = (): StoredScenario[] => {
  try {
    const data = localStorage.getItem(SCENARIOS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading scenarios from localStorage:", error);
    return [];
  }
};

export const saveScenario = (scenario: StoredScenario): void => {
  try {
    const scenarios = getScenarios();
    const existingIndex = scenarios.findIndex((s) => s.id === scenario.id);
    
    if (existingIndex >= 0) {
      scenarios[existingIndex] = scenario;
    } else {
      scenarios.push(scenario);
    }
    
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(scenarios));
  } catch (error) {
    console.error("Error saving scenario to localStorage:", error);
  }
};

export const deleteScenario = (id: string): void => {
  try {
    const scenarios = getScenarios();
    const filtered = scenarios.filter((s) => s.id !== id);
    localStorage.setItem(SCENARIOS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Error deleting scenario from localStorage:", error);
  }
};

// Sessions
export const getSessions = (): StoredSession[] => {
  try {
    const data = localStorage.getItem(SESSIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error reading sessions from localStorage:", error);
    return [];
  }
};

export const saveSession = (session: StoredSession): void => {
  try {
    const sessions = getSessions();
    sessions.unshift(session); // Add to beginning for most recent first
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving session to localStorage:", error);
  }
};

export const getSessionById = (id: string): StoredSession | undefined => {
  try {
    const sessions = getSessions();
    return sessions.find((s) => s.id === id);
  } catch (error) {
    console.error("Error reading session from localStorage:", error);
    return undefined;
  }
};
