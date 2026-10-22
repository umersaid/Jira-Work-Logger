// Puter.js global type declarations
declare global {
  interface Window {
    puter: {
      ai: {
        chat: (
          prompt: string,
          options?: {
            model?: string;
            stream?: boolean;
          }
        ) => Promise<string | AsyncIterable<{ text?: string }>>;
      };
    };
  }
}

// Access puter from window
export const puter = typeof window !== 'undefined' ? window.puter : undefined;

export {};
