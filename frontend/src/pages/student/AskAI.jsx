import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import StudentLayout from '../../components/StudentLayout';
import axios, { getErrorMessage } from '../../api/axios';

const suggestedQuestions = [
  'Explain the quadratic formula',
  'What are the laws of motion?',
  'What is photosynthesis?',
  'Explain the Pythagorean theorem',
];

const welcomeMessage = {
  id: 1,
  type: 'ai',
  content: 'Hi! Ask me about anything you are studying, and I will explain it simply.',
};

const StudentAskAI = () => {
  const [messages, setMessages] = useState([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef(null);

  // Scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const addMessage = (type, content) =>
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), type, content }]);

  const sendQuestion = async (question) => {
    if (!question.trim() || isLoading) return;

    addMessage('user', question);
    setInput('');
    setIsLoading(true);

    try {
      const res = await axios.post('/ai/ask-question', { question });
      addMessage('ai', res.data.answer);
    } catch (err) {
      addMessage('error', getErrorMessage(err, "Sorry, I couldn't answer that. Please try again."));
    } finally {
      setIsLoading(false);
    }
  };

  // Enter = send, Shift+Enter = new line
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(input);
    }
  };

  return (
    <StudentLayout>
      {/* Full-height chat: header, messages (scroll), input */}
      <div className="flex h-[calc(100vh-57px)] flex-col lg:h-screen">
        <div className="border-b border-stone-200 bg-white px-6 py-4">
          <h1 className="text-2xl font-semibold text-stone-900">Ask AI Tutor</h1>
          <p className="text-sm text-stone-500">Stuck on something? Ask it the way you would ask a friend.</p>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
          {messages.map((message) => {
            const isUser = message.type === 'user';
            return (
              <div key={message.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-stone-700' : 'bg-brand-600'}`}>
                  {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-white" />}
                </div>
                <div className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-relaxed sm:max-w-2xl ${
                  isUser ? 'bg-stone-900 text-white'
                    : message.type === 'error' ? 'border border-red-200 bg-red-50 text-red-700'
                    : 'border border-stone-200 bg-white text-stone-800'
                }`}>
                  {message.content}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="flex gap-1.5 rounded-lg border border-stone-200 bg-white px-4 py-4">
                <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:0.1s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-stone-400 [animation-delay:0.2s]" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions + input */}
        <div className="border-t border-stone-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-500">Try:</span>
            {suggestedQuestions.map((question) => (
              <button key={question} onClick={() => sendQuestion(question)} disabled={isLoading}
                className="rounded-md border border-stone-300 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-50 disabled:opacity-50">
                {question}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question and press Enter..."
              className="input resize-none"
              rows={1}
            />
            <button onClick={() => sendQuestion(input)} disabled={!input.trim() || isLoading} className="btn-primary px-4" aria-label="Send">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentAskAI;
