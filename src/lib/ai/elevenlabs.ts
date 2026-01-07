import { ElevenLabsClient } from 'elevenlabs'

if (!process.env.ELEVENLABS_API_KEY) {
  throw new Error('Missing ELEVENLABS_API_KEY environment variable')
}

export const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY,
})

export const ttsHelpers = {
  /**
   * Convert text to speech and return audio stream
   */
  async textToSpeech(text: string, voiceId = 'EXAVITQu4vr4xnSDxMaL'): Promise<Buffer> {
    const audio = await elevenlabs.generate({
      voice: voiceId,
      text,
      model_id: 'eleven_monolingual_v1',
    })

    // Convert stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of audio) {
      chunks.push(chunk)
    }

    return Buffer.concat(chunks)
  },

  /**
   * Stream text to speech
   */
  async *streamTextToSpeech(text: string, voiceId = 'EXAVITQu4vr4xnSDxMaL') {
    const audio = await elevenlabs.generate({
      voice: voiceId,
      text,
      model_id: 'eleven_monolingual_v1',
      stream: true,
    })

    for await (const chunk of audio) {
      yield chunk
    }
  },

  /**
   * Get available voices
   */
  async getVoices() {
    return await elevenlabs.voices.getAll()
  },

  /**
   * Read code explanation
   */
  async readCodeExplanation(explanation: string): Promise<Buffer> {
    return await this.textToSpeech(explanation)
  },

  /**
   * Read error message
   */
  async readError(errorMessage: string): Promise<Buffer> {
    const friendlyMessage = `Error detected: ${errorMessage}`
    return await this.textToSpeech(friendlyMessage)
  },
}

// Recommended voice IDs (from ElevenLabs free tier)
export const VOICE_IDS = {
  RACHEL: 'EXAVITQu4vr4xnSDxMaL', // Female, calm
  DOMI: '21m00Tcm4TlvDq8ikWAM', // Female, strong
  BELLA: 'oWAxZDx7w5VEj9dCyTzz', // Female, soft
  ANTONI: 'ErXwobaYiN019PkySvjV', // Male, well-rounded
  JOSH: 'TxGEqnHWrfWFTfGW9XjX', // Male, young
  ARNOLD: 'VR6AewLTigWG4xSOukaG', // Male, crisp
}
