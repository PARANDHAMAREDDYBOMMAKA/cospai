import Groq from 'groq-sdk'

if (!process.env.GROQ_API_KEY) {
  throw new Error('Missing GROQ_API_KEY environment variable')
}

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

export const groqHelpers = {
  /**
   * Explain code using Groq
   */
  async explainCode(code: string, language: string): Promise<string> {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful coding assistant. Explain code clearly and concisely.',
        },
        {
          role: 'user',
          content: `Explain this ${language} code:\n\n${code}`,
        },
      ],
      model: 'llama-3.3-70b-versatile', // Fast and accurate
      temperature: 0.5,
      max_tokens: 1024,
    })

    return completion.choices[0]?.message?.content || 'Unable to explain code.'
  },

  /**
   * Fix code errors
   */
  async fixCode(code: string, error: string, language: string): Promise<string> {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful coding assistant. Fix code errors and return only the corrected code.',
        },
        {
          role: 'user',
          content: `Fix this ${language} code that has the following error:\n\nError: ${error}\n\nCode:\n${code}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2048,
    })

    return completion.choices[0]?.message?.content || code
  },

  /**
   * Generate code from description
   */
  async generateCode(description: string, language: string): Promise<string> {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a helpful coding assistant. Generate ${language} code based on user descriptions. Return only the code without explanations.`,
        },
        {
          role: 'user',
          content: description,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
    })

    return completion.choices[0]?.message?.content || ''
  },

  /**
   * Chat with AI assistant
   */
  async chat(messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>): Promise<string> {
    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
    })

    return completion.choices[0]?.message?.content || 'Sorry, I could not process your request.'
  },
}
