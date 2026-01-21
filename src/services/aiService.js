/**
 * AI Service - Handles communication with the Ollama-backed AI assistant
 */
import useAuthStore from '../store/authStore';

const API_URL = '/api/ai';

/**
 * Get auth headers for API requests
 */
function getAuthHeaders() {
  const token = useAuthStore.getState().accessToken;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Check if AI service is available
 */
export async function checkAIStatus() {
  try {
    const res = await fetch(`${API_URL}/status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Status check failed');
    const data = await res.json();
    return data.success ? data.data : { available: false, error: 'Invalid response' };
  } catch (err) {
    return { available: false, error: err.message };
  }
}

/**
 * Set the preferred AI model for the team
 * @param {string} model - Model name (e.g., "phi4-mini-reasoning:3.8b")
 * @returns {Promise<object>} - Success status
 */
export async function setPreferredModel(model) {
  try {
    const res = await fetch(`${API_URL}/set-model`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ model }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error?.message || 'Failed to set model');
    }

    const data = await res.json();
    return { success: true, model: data.data.model };
  } catch (err) {
    console.error('Set model error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send a chat message and get streaming response
 * @param {string} message - User's message
 * @param {object} context - App context (athletes, boats, etc.)
 * @param {function} onChunk - Callback for each text chunk
 * @param {object} options - Additional options (model, etc.)
 * @returns {Promise<string>} - Complete response text
 */
export async function sendChatMessage(message, context, onChunk, options = {}) {
  const { model } = options;

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        context,
        model,
        stream: true,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Chat request failed');
    }

    // Handle streaming response
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6)); // Remove 'data: ' prefix
          if (data.text) {
            fullText += data.text;
            onChunk?.(data.text, fullText);
          }
        } catch (e) {
          // Skip malformed JSON
        }
      }
    }

    return fullText;
  } catch (err) {
    throw err;
  }
}

/**
 * Send a chat message without streaming (simpler, for basic use)
 */
export async function sendChatMessageSimple(message, context, options = {}) {
  const { model } = options;

  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      context,
      model,
      stream: false,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Chat request failed');
  }

  const data = await res.json();
  return data.response;
}

/**
 * Suggested prompts for the rowing assistant
 */
export const SUGGESTED_PROMPTS = [
  {
    text: 'Suggest a Varsity 8+ lineup',
    icon: '🚣',
  },
  {
    text: 'Analyze my roster balance',
    icon: '⚖️',
  },
  {
    text: 'Who should row stroke seat?',
    icon: '🎯',
  },
  {
    text: 'Optimize for speed vs. balance',
    icon: '⚡',
  },
];

export default {
  checkAIStatus,
  sendChatMessage,
  sendChatMessageSimple,
  setPreferredModel,
  SUGGESTED_PROMPTS,
};
