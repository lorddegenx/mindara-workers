export interface TTSRequest {
  affirmations: {
    text: string;
    index: number;
  }[];
  voiceId: string;
}

export interface TTSResponse {
  results: {
    index: number;
    audio_data: string; // Base64 encoded audio
    error?: string;
  }[];
}

export interface Env {
  NEETS_API_KEY: string;
}
