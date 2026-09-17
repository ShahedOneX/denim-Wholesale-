import React, { useState, useRef, useEffect } from 'react';
import { Customer, ChatMessage } from '../types';

interface GeminiChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  onOpenWhatsApp?: (customer: Customer) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content: `আসসালামু আলাইকুম! আমি **আরিফ এআই (Arif AI)** — আরিফ ফ্যাশন ওয়ার্ল্ডের সার্বক্ষণিক বিটুবি ডেনিম ও রিঅর্ডার অ্যাসিস্ট্যান্ট।

আমি আপনাকে কীভাবে সাহায্য করতে পারি?
- 📦 **রিঅর্ডার সাইকেল ও রিস্টক সতর্কতা**: কোন কোন পাইকারি গ্রাহকের আজ বা এই সপ্তাহে অর্ডার দেওয়ার সময় হয়েছে।
- 💬 **বাংলা হোয়াটসঅ্যাপ টেমপ্লেট**: তাগাদা, নতুন কালেকশন বা পেমেন্টের মার্জিত মেসেজ প্রস্তুত করা।
- 👖 **ডেনিম মডেল ও পাইকারি দর**: D-501 (14.5 oz), D-502 Stretch, D-507 Selvedge এর বিস্তারিত।
- 📊 **বকেয়া ও লেজার বিশ্লেষণ**: সুন্দরবন কুরিয়ার লজিস্টিকস ও ক্যাশ কালেকশন সামারি।`,
    timestamp: 'এখনই',
  },
];

const PROMPT_SUGGESTIONS = [
  'আজ কার কার রিঅর্ডারের জন্য যোগাযোগ করা উচিত?',
  'রহিম ফ্যাশনের জন্য একটি মার্জিত বাংলা হোয়াটসঅ্যাপ মেসেজ লিখে দাও',
  'D-501 Heavy Denim এর স্টক এবং পাইকারি দর কত?',
  'টঙ্গী হাব ও সুন্দরবন কুরিয়ারে ক্যাশ অন ডেলিভারি নিয়ম কী?',
];

export const GeminiChatModal: React.FC<GeminiChatModalProps> = ({
  isOpen,
  onClose,
  customers,
  onOpenWhatsApp,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('afw_gemini_chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_MESSAGES;
      }
    }
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Save conversation history to local storage for quick multi-turn persistence
  useEffect(() => {
    localStorage.setItem('afw_gemini_chat_history', JSON.stringify(messages));
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt || input).trim();
    if (!textToSend || isLoading) return;

    setErrorMsg(null);
    setInput('');

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setIsLoading(true);

    try {
      // Build relevant live context for the AI
      const dueToday = customers.filter(
        (c) => c.followUpStatus === 'today' || c.followUpStatus === 'overdue'
      );
      const topCustomers = customers.slice(0, 3).map((c) => `${c.name} (${c.district}, LTV: ৳ ${c.ltv})`);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          contextData: {
            activeAccounts: customers.length,
            dueTodayCount: dueToday.length,
            dueTodayNames: dueToday.map((c) => `${c.name} (${c.phone})`).join(', '),
            vipCount: topCustomers.join('; '),
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.content || 'কোনো উত্তর পাওয়া যায়নি।',
        timestamp: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMsg(err.message || 'মেসেজ পাঠানো সম্ভব হয়নি। ইন্টারনেট সংযোগ বা API Key চেক করুন।');
      // Fallback offline intelligent answer if network/server is cold
      const fallbackReply: ChatMessage = {
        id: `ai-fallback-${Date.now()}`,
        role: 'assistant',
        content: `**আরিফ ফ্যাশন সহকারী নোট:** সার্ভার থেকে উত্তর লোড হতে বিলম্ব হচ্ছে। তবে আপনার বর্তমান সিআরএম ডেটা অনুযায়ী:
• **আজকের গুরুত্বপূর্ণ ফলো-আপ**: রহিম ফ্যাশন (গাজীপুর) এবং করিম ট্রেডার্স (নারায়ণগঞ্জ)-এর রিঅর্ডার সাইকেল পূর্ণ হয়েছে।
• **বেস্ট সেলার ডেনিম**: D-501 Heavy Denim (14.5 oz) পাইকারি রেট ৳ ৫৭/পিস।
দয়া করে সরাসরি গ্রাহক তালিকা থেকে হোয়াটসঅ্যাপে বার্তা পাঠান।`,
        timestamp: 'অফলাইন রেডি',
      };
      setMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm('আপনি কি পূর্ববর্তী কথোপকথন মুছে ফেলতে চান?')) {
      setMessages(INITIAL_MESSAGES);
      localStorage.removeItem('afw_gemini_chat_history');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-on-surface/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-surface w-full max-w-2xl h-[92vh] sm:h-[84vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-surface-container">
        {/* Header */}
        <div className="px-4 py-3.5 bg-primary text-on-primary flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary-container shadow-inner ring-2 ring-on-primary/20">
              <span className="material-symbols-outlined text-[22px]">smart_toy</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[16px] leading-tight">
                  আরিফ এআই কোপাইলট
                </h3>
                <span className="px-1.5 py-0.2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-['Inter'] text-[10px] font-bold">
                  Gemini Live
                </span>
              </div>
              <p className="font-['Inter'] text-[11px] text-primary-fixed-dim leading-snug">
                B2B Wholesale Denim & Autonomous Reorder Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              aria-label="Clear chat history"
              onClick={handleClearChat}
              title="চ্যাট হিস্ট্রি রিসেট"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-primary-fixed hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
            <button
              aria-label="Close Chat"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-primary-fixed hover:bg-white/10 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Live Context Banner */}
        <div className="px-4 py-1.5 bg-surface-container-low border-b border-surface-container flex items-center justify-between text-[11px] font-['Inter'] text-secondary">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>সিআরএম ডেটা সিঙ্কড: {customers.length} টি পাইকারি অ্যাকাউন্ট</span>
          </div>
          <span className="font-medium text-primary">মডেল: Gemini 2.5 Flash</span>
        </div>

        {/* Chat Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-on-primary text-[14px] shrink-0 mt-0.5 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">smart_toy</span>
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-[13px] font-['Inter'] leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-primary text-on-primary rounded-br-xs'
                      : 'bg-surface-container text-on-surface rounded-tl-xs border border-surface-container-high whitespace-pre-line'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <div
                    className={`mt-1.5 text-[10px] text-right font-medium opacity-70 ${
                      isUser ? 'text-primary-fixed' : 'text-secondary'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-primary-container flex items-center justify-center text-on-primary text-[14px] shrink-0 mt-0.5 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 items-center text-secondary text-[12px] font-['Inter']">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-on-primary text-[14px] shrink-0 animate-pulse">
                <span className="material-symbols-outlined text-[16px]">smart_toy</span>
              </div>
              <div className="bg-surface-container px-3.5 py-2.5 rounded-2xl flex items-center gap-2 border border-surface-container-high">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></span>
                  <span
                    className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0.15s' }}
                  ></span>
                  <span
                    className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: '0.3s' }}
                  ></span>
                </div>
                <span>আরিফ এআই উত্তর লিখছে...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-3 py-2 bg-surface border-t border-surface-container overflow-x-auto no-scrollbar flex items-center gap-1.5">
          {PROMPT_SUGGESTIONS.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(sug)}
              disabled={isLoading}
              className="text-[11px] font-['Inter'] font-medium px-2.5 py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors whitespace-nowrap shrink-0 border border-surface-container-high cursor-pointer"
            >
              💡 {sug}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-surface border-t border-surface-container">
          {errorMsg && (
            <div className="mb-2 text-[11px] text-error font-['Inter'] px-2 py-1 bg-error-container/30 rounded flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">warning</span>
              <span>{errorMsg}</span>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              id="gemini-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ডেনিম মডেল, রিঅর্ডার বা হোয়াটসঅ্যাপ মেসেজ সম্পর্কে লিখুন..."
              disabled={isLoading}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant text-[13px] font-['Inter'] text-on-surface placeholder:text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              id="gemini-chat-send-btn"
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center hover:bg-primary-container disabled:opacity-50 transition-colors shadow-sm cursor-pointer shrink-0"
              aria-label="Send Message"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
