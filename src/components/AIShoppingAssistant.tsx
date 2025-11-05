// src/components/AIShoppingAssistant.tsx
import { useState } from 'react';
import { Send, Bot, X, MessageSquare, Loader2 } from 'lucide-react'; 

// Define chat message structure
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // --- Mock API Call (Replace with real LLM integration later) ---
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage: ChatMessage = { role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);

    try {
      // 1. Send request to a (future) Supabase Edge Function API endpoint
      // Example response structure:
      // const response = await fetch('/api/ai-assistant', { method: 'POST', body: JSON.stringify({ message: userMessage.content }) });
      // const data = await response.json();
      
      // MOCK RESPONSE
      await new Promise(resolve => setTimeout(resolve, 1500)); 
      
      const assistantResponse: ChatMessage = { 
        role: 'assistant', 
        content: userMessage.content.toLowerCase().includes('recommend') 
          ? "Based on your interest, I recommend the 'Smart Watch Series 7' for its features and 4.9 rating."
          : `Hello! I am the AI Shopping Assistant. I can help you find products or answer general questions about the ${userMessage.content}.` 
      };

      setMessages((prev) => [...prev, assistantResponse]);

    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I ran into an error. Please try again." }]);
      console.error("AI Assistant Error:", error);
    } finally {
      setIsThinking(false);
    }
  };
  // --- End Mock API Call ---

  // --- JSX Rendering ---
  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-emerald-600 text-white rounded-full p-4 shadow-xl hover:bg-emerald-700 transition-colors z-50"
        aria-label="Open AI Shopping Assistant"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm h-96 bg-white rounded-xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Chat Header */}
          <div className="p-4 border-b bg-emerald-50 rounded-t-xl flex items-center gap-2">
            <Bot className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-gray-900">AI Assistant</h3>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
                <p className="text-sm text-center text-gray-500 mt-16">Ask me anything about our products!</p>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-xl text-sm shadow ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isThinking ? 'Assistant is typing...' : 'Type your message...'}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:bg-gray-50"
              disabled={isThinking}
            />
            <button
              type="submit"
              className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              disabled={isThinking || !input.trim()}
              aria-label="Send message"
            >
              {isThinking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default AIShoppingAssistant;