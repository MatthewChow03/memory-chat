// Insight Extraction Service
// Uses OpenAI's 4o-mini model to extract key insights from messages

class InsightExtractionService {
  constructor() {
    this.apiKey = null;
    this.isInitialized = false;
    this.rateLimitDelay = 1000; // 1 second delay between requests
    this.lastRequestTime = 0;
    this.baseUrl = 'https://api.openai.com/v1';
  }

  // Initialize the service with API key
  async initialize(apiKey) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenAI API key is required');
    }

    // Sanitize and validate the API key
    const sanitizedApiKey = this.sanitizeApiKey(apiKey);
    if (!sanitizedApiKey) {
      throw new Error('Invalid API key format');
    }

    try {
      console.log('Initializing insight extraction service with API key...');
      this.apiKey = sanitizedApiKey;
      this.isInitialized = true;
      
      // Test the API key with a simple request
      await this.testApiKey();
      
      console.log('Insight extraction service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize insight extraction service:', error);
      // Reset state on failure
      this.apiKey = null;
      this.isInitialized = false;
      throw new Error(`Failed to initialize OpenAI service: ${error.message}`);
    }
  }

  // Sanitize and validate API key
  sanitizeApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return null;
    }

    // Trim whitespace
    let sanitized = apiKey.trim();
    
    // Remove any non-ASCII characters that might cause encoding issues
    sanitized = sanitized.replace(/[^\x00-\x7F]/g, '');
    
    // Ensure it only contains valid characters for HTTP headers
    if (!/^[a-zA-Z0-9\-_]+$/.test(sanitized)) {
      console.warn('API key contains potentially problematic characters');
      // Remove any characters that might cause issues in HTTP headers
      sanitized = sanitized.replace(/[^a-zA-Z0-9\-_]/g, '');
    }
    
    return sanitized;
  }

  // Test the API key with a simple request
  async testApiKey() {
    try {
      const response = await this.makeApiRequest({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: 'Hello'
          }
        ],
        max_tokens: 10
      });
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      if (error.status === 401) {
        throw new Error('Invalid API key');
      } else if (error.status === 429) {
        throw new Error('API rate limit exceeded');
      } else {
        throw new Error(`API test failed: ${error.message}`);
      }
    }
  }

  // Make API request using fetch
  async makeApiRequest(requestBody) {
    try {
      console.log('Making API request to OpenAI...');
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        console.error('OpenAI API error:', response.status, errorMessage);
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      console.log('API request successful');
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Extract insights from a single message
  async extractInsights(messageText) {
    if (!this.isInitialized) {
      throw new Error('Insight extraction service not initialized');
    }

    if (!messageText || messageText.trim() === '') {
      throw new Error('Message text is required');
    }

    // Rate limiting
    await this.enforceRateLimit();

    try {
      const response = await this.makeApiRequest({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a *Memory Synthesizer*.

              INPUT  
              One assistant message that the user explicitly chose to save.

              GOAL  
              Return a JSON object containing *1 – 5* concise insights that are worth storing as long-term memory.  
              Never return an empty list—the user has signalled this message matters, so capture at least one takeaway.

              WHAT COUNTS AS A "MEMORY"  
              1. *Durable:* Still relevant weeks from now (principle, fact, plan, differentiator).  
              2. *Self-contained:* Understandable without the full conversation.  
              3. *High-signal:* Concrete idea, strategy, or decision-critical fact—not filler.  
              4. *Non-redundant:* Each line adds new information.  
              5. *Concise:* ≤ 18 words (≈120 chars) and written as a standalone sentence.  
              6. *Language-preserving:* Output in the same language as the input.

              EDGE CASES  
              * If the message is light on substance, distill the single most useful idea—do *not* leave the list empty.  
              * For very dense texts, include only the 1–5 most distinct insights.

              OUTPUT FORMAT (strict)  
              json
              {
                "memories": [
                  "First distilled insight.",
                  "Second distinct insight if any."
                ]
              }`
          },
          {
            role: 'user',
            content: messageText
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content received');
      }

      // Parse the JSON response
      let insights;
      try {
        const parsedResponse = JSON.parse(content);
        
        // Handle the new response format with "memories" key
        if (parsedResponse && parsedResponse.memories && Array.isArray(parsedResponse.memories)) {
          insights = parsedResponse.memories;
        } else if (Array.isArray(parsedResponse)) {
          // Fallback for old format where response was directly an array
          insights = parsedResponse;
        } else {
          throw new Error('Invalid response format - expected memories array');
        }
      } catch (parseError) {
        // If JSON parsing fails, try to extract insights from plain text
        insights = this.parseInsightsFromText(content);
      }

      // Validate insights
      if (!Array.isArray(insights)) {
        throw new Error('Invalid insights format');
      }

      // Ensure we have 3 or fewer insights
      insights = insights.slice(0, 3);

      // Filter out empty or invalid insights
      insights = insights.filter(insight => 
        insight && typeof insight === 'string' && insight.trim().length > 0
      );

      if (insights.length === 0) {
        throw new Error('No valid insights extracted');
      }

      return insights;
    } catch (error) {
      console.error('Error extracting insights:', error);
      
      if (error.status === 429) {
        throw new Error('API rate limit exceeded. Please wait before trying again.');
      } else if (error.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key in settings.');
      } else if (error.status === 402) {
        throw new Error('API quota exceeded. Please check your OpenAI account.');
      } else {
        throw new Error(`Failed to extract insights: ${error.message}`);
      }
    }
  }

  // Parse insights from plain text if JSON parsing fails
  parseInsightsFromText(text) {
    const lines = text.split('\n').map(line => line.trim());
    const insights = [];
    
    for (const line of lines) {
      // Look for bullet points, numbered items, or lines that start with common insight indicators
      if (line.match(/^[-•*]\s/) || line.match(/^\d+\.\s/) || 
          line.match(/^insight/i) || line.match(/^key/i) || line.match(/^point/i)) {
        const insight = line.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '')
                           .replace(/^insight\s*:?\s*/i, '').replace(/^key\s*:?\s*/i, '')
                           .replace(/^point\s*:?\s*/i, '').trim();
        if (insight && insight.length > 0) {
          insights.push(insight);
        }
      }
    }
    
    // If no structured insights found, take the first few meaningful lines
    if (insights.length === 0) {
      const meaningfulLines = lines.filter(line => 
        line.length > 10 && line.length < 200 && 
        !line.match(/^(insight|key|point)/i)
      );
      insights.push(...meaningfulLines.slice(0, 3));
    }
    
    return insights;
  }

  // Batch extract insights from multiple messages
  async extractInsightsBatch(messages, batchSize = 5) {
    if (!this.isInitialized) {
      throw new Error('Insight extraction service not initialized');
    }

    const results = [];
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      // Process batch in parallel with rate limiting
      const batchPromises = batch.map(async (message, index) => {
        try {
          const insights = await this.extractInsights(message.text || message);
          return {
            originalText: message.text || message,
            insights: insights,
            timestamp: message.timestamp || Date.now(),
            success: true
          };
        } catch (error) {
          console.error(`Failed to extract insights for message ${i + index}:`, error);
          return {
            originalText: message.text || message,
            insights: [],
            timestamp: message.timestamp || Date.now(),
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches to respect rate limits
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
      }
    }

    return results;
  }

  // Enforce rate limiting
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
  }

  // Check if service is ready
  isReady() {
    return this.isInitialized && this.apiKey !== null;
  }

  // Get service status
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasApiKey: !!this.apiKey,
      isReady: this.isReady()
    };
  }

  // Clear API key and reset service
  reset() {
    this.apiKey = null;
    this.isInitialized = false;
    this.lastRequestTime = 0;
  }
}

// Create global instance
window.insightExtractionService = new InsightExtractionService(); 