// src/utils/gpt-wrapper.ts

// Types for the GPT API
interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
  }
  
  interface GPTResponse {
    id: string;
    object: string;
    created: number;
    model: string;
    choices: {
      index: number;
      message: {
        role: string;
        content: string;
      };
      finish_reason: string;
    }[];
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
  }
  
  interface GPTRequestOptions {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  }
  
  export class GPTWrapper {
    private apiKey: string;
    private model: string;
    private baseUrl: string;
    private headers: HeadersInit;
  
    constructor(apiKey: string, model: string = "gpt-3.5-turbo") {
      this.apiKey = apiKey;
      this.model = model;
      this.baseUrl = "https://api.openai.com/v1/chat/completions";
      this.headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      };
    }
  
    async generate_response(
      messages: Message[],
      options: GPTRequestOptions = {}
    ): Promise<GPTResponse> {
      const payload = {
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens,
        top_p: options.top_p ?? 1.0,
        frequency_penalty: options.frequency_penalty ?? 0.0,
        presence_penalty: options.presence_penalty ?? 0.0,
      };
  
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(payload),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'API request failed');
        }
  
        return await response.json();
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`GPT API request failed: ${error.message}`);
        }
        throw new Error('An unknown error occurred');
      }
    }
  
    async simple_completion(
      prompt: string,
      options: GPTRequestOptions = {}
    ): Promise<string> {
      const messages: Message[] = [
        {
          role: "user",
          content: prompt
        }
      ];
  
      const response = await this.generate_response(messages, options);
      return response.choices[0].message.content;
    }
  
    async chat_completion(
      messages: Message[],
      options: GPTRequestOptions = {}
    ): Promise<string> {
      const response = await this.generate_response(messages, options);
      return response.choices[0].message.content;
    }
  
    // Utility method to create a conversation with system prompt
    async chat_with_system(
      systemPrompt: string,
      userPrompt: string,
      options: GPTRequestOptions = {}
    ): Promise<string> {
      const messages: Message[] = [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ];
  
      return this.chat_completion(messages, options);
    }
  
    // Method specifically for rephrasing text
    async rephrase(
      text: string,
      style: string = "professional",
      options: GPTRequestOptions = {}
    ): Promise<string> {
      const systemPrompt = `You are a skilled writer that rephrases text in a ${style} style while maintaining the original meaning.`;
      const userPrompt = `Please rephrase the following text: ${text}`;
  
      return this.chat_with_system(systemPrompt, userPrompt, options);
    }
  
    // Method to stream responses (useful for longer generations)
    async* stream_completion(
      messages: Message[],
      options: GPTRequestOptions = {}
    ): AsyncGenerator<string, void, unknown> {
      const payload = {
        model: this.model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.max_tokens,
        top_p: options.top_p ?? 1.0,
        frequency_penalty: options.frequency_penalty ?? 0.0,
        presence_penalty: options.presence_penalty ?? 0.0,
        stream: true,
      };
  
      try {
        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: this.headers,
          body: JSON.stringify(payload),
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'API request failed');
        }
  
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
  
        if (!reader) {
          throw new Error('Failed to initialize stream reader');
        }
  
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
  
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
  
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') return;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0].delta.content;
                if (content) yield content;
              } catch (e) {
                console.error('Failed to parse chunk:', e);
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`Stream request failed: ${error.message}`);
        }
        throw new Error('An unknown error occurred during streaming');
      }
    }
  }