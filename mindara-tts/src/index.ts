/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { TTSRequest, NeetsTTSResponse, TTSResponse, Env } from './types';

const NEETS_API_URL = 'https://api.neets.ai/v1/tts';

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST',
					'Access-Control-Allow-Headers': 'Content-Type',
					'Access-Control-Max-Age': '86400',
				},
			});
		}

		if (request.method !== 'POST') {
			return new Response('Method not allowed', { status: 405 });
		}

		try {
			const requestData: TTSRequest = await request.json();
			
			// Validate request data
			if (!requestData.affirmations?.length || !requestData.voiceId) {
				return new Response('Invalid request data', { status: 400 });
			}

			// Process each affirmation independently
			const results = await Promise.all(
				requestData.affirmations.map(async (affirmation) => {
					try {
						const response = await fetch(NEETS_API_URL, {
							method: 'POST',
							headers: {
								'Accept': 'audio/wav',
								'Content-Type': 'application/json',
								'X-API-Key': env.NEETS_API_KEY,
							},
							body: JSON.stringify({
								params: {
									model: 'vits',
									speed: 1,
								},
								voice_id: requestData.voiceId,
								fmt: 'mp3',
								text: affirmation.text,
							}),
						});

						if (!response.ok) {
							throw new Error(`Neets API error: ${response.statusText}`);
						}

						const neetResponse: NeetsTTSResponse = await response.json();
						
						return {
							index: affirmation.index,
							audio_url: neetResponse.audio_url,
						};
					} catch (error) {
						// Return error for this specific affirmation but continue processing others
						return {
							index: affirmation.index,
							audio_url: '',
							error: error instanceof Error ? error.message : 'TTS conversion failed',
						};
					}
				})
			);

			const response: TTSResponse = { results };

			return new Response(JSON.stringify(response), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			});
		} catch (error) {
			console.error('Worker error:', error);
			return new Response(JSON.stringify({ 
				error: 'Internal Server Error',
				message: error instanceof Error ? error.message : 'Unknown error'
			}), { 
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				}
			});
		}
	},
} satisfies ExportedHandler<Env>;
