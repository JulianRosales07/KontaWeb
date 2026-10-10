import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Sparkles,
  ArrowUp,
  Mic,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Check,
  RotateCcw,
} from 'lucide-react';
import { KontaLogo } from './KontaLogo';

import { askKontaCopilot } from '../../../services/groqChatService';

interface MessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  workDuration?: string;
}

interface KontaChatWidgetProps {
  onOpenLogin: () => void;
  onNavigateToModule: (tab: 'cartera' | 'doc-soporte' | 'reportes') => void;
}

const renderFormattedMessage = (text: string) => {
  const paragraphs = text.split('\n');
  return (
    <div className="space-y-1.5">
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        const isBullet = trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+[\.\)]\s/.test(trimmed);
        const cleanPara = isBullet ? trimmed.replace(/^(\*|-|\d+[\.\)])\s*/, '') : trimmed;
        const parts = cleanPara.split(/(\*\*[^*]+\*\*)/g);

        return (
          <p
            key={pIdx}
            className={
              isBullet
                ? 'pl-3.5 relative before:content-["•"] before:absolute before:left-0 before:text-indigo-600 before:font-bold'
                : ''
            }
          >
            {parts.map((part, idx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={idx} className="font-semibold text-slate-900">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

export const KontaChatWidget: React.FC<KontaChatWidgetProps> = ({
  onOpenLogin,
  onNavigateToModule,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [likedMap, setLikedMap] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const formatTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const initialMessages: MessageItem[] = [
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: '¡Hola! 👋 Bienvenido a Konta ERP. Estoy aquí para resolver tus dudas sobre la plataforma, brindarte soporte contable o ayudarte a ponerte en contacto con nuestro equipo. ¿En qué te puedo colaborar hoy?',
      time: formatTime(),
    },
  ];

  const [messages, setMessages] = useState<MessageItem[]>(initialMessages);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, messages, isTyping]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleLike = (id: string, isLike: boolean) => {
    setLikedMap((prev) => ({
      ...prev,
      [id]: isLike,
    }));
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: '¡Conversación reiniciada! 👋 Estoy aquí para resolver tus dudas, brindarte soporte o conectarte con un asesor. ¿Qué consulta tienes hoy?',
        time: formatTime(),
      },
    ]);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    const userMessage: MessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      time: formatTime(),
    };

    const currentHistory = messages.map((m) => ({ sender: m.sender, text: m.text }));

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    try {
      const result = await askKontaCopilot(currentHistory, text);

      const assistantMessage: MessageItem = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: result.text,
        time: formatTime(),
        workDuration: result.workDuration,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('[Konta AI Error]:', err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating State-of-the-Art AI Chat Panel matching exact user screenshot */}
      {isOpen && (
        <div className="fixed bottom-22 right-4 sm:right-6 z-50 w-[94vw] sm:w-[460px] md:w-[490px] h-[640px] max-h-[85vh] rounded-[36px] bg-[#f3f3f6] border border-white/90 shadow-2xl shadow-slate-900/25 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 font-sans text-slate-800">
          {/* Top Header matching reference */}
          <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0 bg-transparent border-b border-slate-200/50">
            <div className="flex items-center gap-2.5">
              <KontaLogo size={28} showText={true} textColor="#0f172a" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200/70 shadow-2xs">
                AI COPILOT
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetChat}
                className="w-8 h-8 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/50 shadow-2xs"
                title="Reiniciar conversación"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white/70 hover:bg-white text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border border-slate-200/50 shadow-2xs"
                title="Cerrar chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Conversational Chat Flow Area */}
          <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 text-xs">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                {/* User Message (Right-aligned bubble with avatar) */}
                {msg.sender === 'user' ? (
                  <div className="flex items-center justify-end gap-2.5">
                    <div className="bg-[#e7e7ec] text-slate-800 text-[13px] font-normal px-4 py-2.5 rounded-2xl rounded-tr-xs max-w-[82%] leading-relaxed shadow-2xs">
                      {msg.text}
                    </div>

                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-300 shrink-0 border border-white shadow-xs">
                      <img
                        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"
                        alt="User avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  /* Assistant Message */
                  <div className="space-y-3">
                    {/* Metadata line if available */}
                    {msg.workDuration && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium pl-1">
                        <Sparkles size={13} className="text-slate-700" />
                        <span>{msg.workDuration}</span>
                      </div>
                    )}

                    {/* Conversational Text Bubble */}
                    <div className="bg-white/85 border border-slate-200/80 text-slate-800 text-[13px] font-normal px-4 py-3 rounded-2xl rounded-tl-xs max-w-[92%] leading-relaxed shadow-xs">
                      {renderFormattedMessage(msg.text)}
                    </div>

                    {/* Toolbar under assistant response */}
                    <div className="flex items-center gap-3 pt-0.5 pl-1 text-slate-400">
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="p-1 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Copiar respuesta"
                      >
                        {copiedId === msg.id ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>

                      <button
                        onClick={() => handleToggleLike(msg.id, true)}
                        className={`p-1 transition-colors cursor-pointer ${
                          likedMap[msg.id] === true ? 'text-indigo-600' : 'hover:text-slate-700'
                        }`}
                        title="Me gusta"
                      >
                        <ThumbsUp size={14} />
                      </button>

                      <button
                        onClick={() => handleToggleLike(msg.id, false)}
                        className={`p-1 transition-colors cursor-pointer ${
                          likedMap[msg.id] === false ? 'text-red-500' : 'hover:text-slate-700'
                        }`}
                        title="No me gusta"
                      >
                        <ThumbsDown size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing state */}
            {isTyping && (
              <div className="space-y-2 animate-in fade-in pl-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Sparkles size={13} className="text-slate-700 animate-spin" />
                  <span>Konta AI está escribiendo...</span>
                </div>
                <div className="w-24 h-9 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions pills above input matching photo */}
          <div className="px-5 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 border-t border-slate-200/60 bg-white/40">
            <button
              onClick={() => handleSendMessage('¿Cómo se registran los préstamos a asociados y la cuenta PUC 136505?')}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/80 whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
            >
              💰 Préstamos Asociados
            </button>

            <button
              onClick={() => handleSendMessage('¿Cómo funciona el módulo de Cartera y Aging?')}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/80 whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
            >
              📊 Cartera & Aging
            </button>

            <button
              onClick={() => handleSendMessage('¿Cómo emitir Documento Soporte a no obligados ante la DIAN?')}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/80 whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
            >
              📄 Doc. Soporte DIAN
            </button>

            <button
              onClick={() => handleSendMessage('¿Cómo genero Balance de Comprobación por terceros bajo NIIF?')}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/80 whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
            >
              📑 Balances NIIF
            </button>

            <button
              onClick={() => handleSendMessage('Quiero hablar con un asesor comercial por WhatsApp')}
              className="px-3 py-1 rounded-full bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/80 whitespace-nowrap cursor-pointer transition-colors shadow-2xs"
            >
              💬 WhatsApp
            </button>
          </div>

          {/* Bottom Floating Pill Input Bar matching exact screenshot */}
          <div className="p-4 pt-1 bg-transparent shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative flex items-center bg-white rounded-full p-1.5 pl-4 pr-1.5 border border-slate-200/90 shadow-md shadow-slate-900/5 focus-within:ring-2 focus-within:ring-slate-300 focus-within:border-slate-400 transition-all"
            >
              {/* Left Sparkle Button */}
              <button
                type="button"
                onClick={() => handleSendMessage('¿Qué funcionalidades ofrece Konta ERP?')}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 transition-colors cursor-pointer mr-2"
                title="Konta AI Prompt"
              >
                <Sparkles size={14} />
              </button>

              {/* Text Input */}
              <input
                type="text"
                className="flex-1 bg-transparent text-[13px] text-slate-800 placeholder-slate-400 outline-none"
                placeholder="Escribe tu mensaje o consulta..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />

              {/* Right Circular Black Button with Send / Mic Icon */}
              <button
                type="submit"
                className="w-9 h-9 rounded-full bg-slate-950 hover:bg-black text-white flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer shadow-sm"
                title={inputValue.trim() ? 'Enviar mensaje' : 'Grabar voz'}
              >
                {inputValue.trim() ? (
                  <ArrowUp size={16} className="stroke-[2.5]" />
                ) : (
                  <Mic size={15} />
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Chat Button at bottom-right */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-2xl bg-[#5850ec] hover:bg-[#4b43e0] text-white shadow-xl shadow-indigo-600/35 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all duration-300 group"
        title={isOpen ? 'Cerrar chat' : 'Asistente Konta AI'}
        aria-label="Asistente Konta"
      >
        {isOpen ? (
          <X size={22} className="group-hover:rotate-90 transition-transform duration-200" />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageSquare size={22} className="group-hover:scale-105 transition-transform" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-amber-400 border-2 border-[#5850ec] rounded-full animate-ping" />
          </div>
        )}
      </button>
    </>
  );
};
