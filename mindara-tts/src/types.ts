export interface TTSRequest {
  affirmations: {
    text: string;
    index: number;
  }[];
  voiceId: string;
}

export interface NeetsTTSResponse {
  audio_url: string;  // Assuming Neets.ai returns a URL
}

export interface TTSResponse {
  results: {
    index: number;
    audio_url: string;
    error?: string;
  }[];
}

export interface Env {
  NEETS_API_KEY: string;
}
