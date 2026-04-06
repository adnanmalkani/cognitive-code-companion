export type CognitiveMode = 'step-by-step' | 'big-picture-first' | 'analogy-based' | 'minimal';

export interface ExplanationRequest {
  code: string;
  languageId: string;
  mode: CognitiveMode;
  responseLanguage: string;
}

export interface ExplanationResult {
  explanation: string;
  mode: CognitiveMode;
}
