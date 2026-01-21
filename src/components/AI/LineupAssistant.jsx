import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
  Minimize2,
  Maximize2
} from 'lucide-react';
import useLineupStore from '../../store/lineupStore';
import useSettingsStore from '../../store/settingsStore';
import { checkAIStatus, sendChatMessage, SUGGESTED_PROMPTS } from '../../services/aiService';

// Message component
const Message = ({ message, isUser, isStreaming }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
  >
    <div className={`
      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
      ${isUser
        ? 'bg-blade-blue'
        : 'bg-gradient-to-br from-purple-500 to-pink-500'
      }
    `}>
      {isUser ? (
        <User className="w-4 h-4 text-white" />
      ) : (
        <Bot className="w-4 h-4 text-white" />
      )}
    </div>
    <div className={`
      flex-1 px-4 py-3 rounded-xl text-sm leading-relaxed
      ${isUser
        ? 'bg-blade-blue text-white'
        : 'bg-white/10 text-gray-200'
      }
    `}>
      {message}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-purple-400 animate-pulse rounded-sm" />
      )}
    </div>
  </motion.div>
);

// Status indicator
const StatusBadge = ({ status, checking }) => {
  if (checking) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-400">
        <Loader2 className="w-3 h-3 animate-spin" />
        <span>Checking...</span>
      </div>
    );
  }

  if (status?.available) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-green-400">
        <CheckCircle2 className="w-3 h-3" />
        <span>Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-amber-400">
      <WifiOff className="w-3 h-3" />
      <span>Offline</span>
    </div>
  );
};

// Main component
const LineupAssistant = ({ isOpen, onClose, isMinimized, onToggleMinimize }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Get app context
  const { athletes, activeBoats } = useLineupStore();
  const { features } = useSettingsStore();
  const aiEnabled = features.aiAssistant;

  // Check AI status on open
  useEffect(() => {
    if (isOpen && aiEnabled) {
      checkStatus();
    }
  }, [isOpen, aiEnabled]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const checkStatus = async () => {
    setCheckingStatus(true);
    const status = await checkAIStatus();
    setAiStatus(status);
    setCheckingStatus(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setStreamingText('');

    try {
      // Build context
      const context = {
        athletes: athletes.map(a => ({
          lastName: a.lastName,
          firstName: a.firstName,
          side: a.side,
          ergScore: a.ergScore,
          country: a.country,
        })),
        activeBoats: activeBoats.map(b => ({
          boatConfig: b.boatConfig,
          seats: b.seats,
          shellName: b.shellName,
        })),
      };

      // Get selected model from settings store or use the one from AI status
      const { aiModel } = useSettingsStore.getState();
      const selectedModel = aiModel || aiStatus?.model;

      // Stream response
      let fullResponse = '';
      await sendChatMessage(
        userMessage,
        context,
        (chunk, full) => {
          fullResponse = full;
          setStreamingText(full);
        },
        { model: selectedModel }
      );

      setMessages(prev => [...prev, { role: 'assistant', content: fullResponse }]);
      setStreamingText('');
    } catch (err) {
      console.error('AI error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I couldn't process that request. ${err.message}`,
        isError: true
      }]);
      setStreamingText('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  // If AI is disabled in settings
  if (!aiEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed bottom-6 right-6 w-80 glass-elevated rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50"
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span className="font-semibold text-white">AI Assistant</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="p-6 text-center">
          <WifiOff className="w-12 h-12 mx-auto mb-3 text-gray-500" />
          <h3 className="text-white font-medium mb-2">AI Disabled</h3>
          <p className="text-gray-400 text-sm">
            The AI assistant is currently disabled. Enable it in the Admin Panel to use this feature.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className={`
        fixed bottom-6 right-6 glass-elevated rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-50
        ${isMinimized ? 'w-72' : 'w-96'}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-pink-500/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Lineup Assistant</h3>
            <StatusBadge status={aiStatus} checking={checkingStatus} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMinimize}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && !streamingText && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto mb-3 text-gray-500" />
                <p className="text-gray-400 text-sm mb-4">
                  {aiStatus?.available
                    ? 'Ask me about lineups, roster balance, or seat assignments'
                    : 'AI is offline. Start Ollama to enable the assistant.'}
                </p>
                {aiStatus?.available && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTED_PROMPTS.slice(0, 2).map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestionClick(prompt.text)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-gray-300 transition-colors"
                      >
                        {prompt.icon} {prompt.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {messages.map((msg, i) => (
              <Message
                key={i}
                message={msg.content}
                isUser={msg.role === 'user'}
              />
            ))}

            {streamingText && (
              <Message
                message={streamingText}
                isUser={false}
                isStreaming={true}
              />
            )}

            {isLoading && !streamingText && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={aiStatus?.available ? "Ask about lineups..." : "AI offline"}
                disabled={!aiStatus?.available || isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-purple-500/50 outline-none text-white placeholder-gray-500 text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!aiStatus?.available || isLoading || !input.trim()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </motion.div>
  );
};

// Floating button to open assistant
export const AIAssistantButton = ({ onClick }) => {
  const { features } = useSettingsStore();

  // Don't show button if AI is disabled
  if (!features.aiAssistant) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30 flex items-center justify-center z-40 hover:shadow-xl hover:shadow-purple-500/40 transition-shadow"
    >
      <Sparkles className="w-6 h-6" />
    </motion.button>
  );
};

export default LineupAssistant;
