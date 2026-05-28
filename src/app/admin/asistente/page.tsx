'use client'

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import Head from 'next/head';
import { apiFetch } from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import '@/styles/Chatbot.css';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

const INITIAL_MESSAGES: Message[] = [
    {
        id: '1',
        role: 'assistant' as const,
        content: '¡Hola! 👋 Soy el asistente inteligente de **Disprocar**. Tengo acceso en tiempo real a la base de datos para ayudarte con información sobre órdenes de compra, reses, proveedores y mermas. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date(),
    },
];

export default function Chatbot() {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Call real backend AI service
            const response = await apiFetch('/ai/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message: input,
                    history: messages.map(m => ({ role: m.role, content: m.content })).slice(-5)
                })
            });

            const reply: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response.reply || "Lo siento, no pude procesar tu solicitud.",
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, reply]);
        } catch (error: any) {
            console.error("Chat Error:", error);
            const errorMessage = error.message || "Error desconocido en la conexión.";
            const errorReply: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `❌ Hubo un problema: **${errorMessage}**. \n\nPor favor, verifica que el backend esté corriendo y la ApiKey sea válida.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorReply]);
        } finally {
            setIsTyping(false);
        }
    };

    const suggestions = [
        '¿Cómo va la merma este mes?',
        '¿Qué cortes tienen menos existencia?',
        'Resumen de órdenes recientes',
        'Dame una recomendación operativa'
    ];

    return (
        <div className="chatbot-page-wrapper">
            <Head>
                <title>Asistente IA - Carnes del Zulia</title>
            </Head>
            <div className="chatContainer">
                <header className="header">
                    <div className="headerIcon">
                        <Sparkles size={24} />
                    </div>
                    <div className="headerContent">
                        <h1 className="headerTitle">Asistente IA Real-Time</h1>
                        <p className="headerSubtitle">Conectado a tu base de datos y Gemini 3.0 Flash</p>
                    </div>
                    <div className="headerStatus">
                        <span className="statusIndicator" />
                        <span className="statusText">IA Activa</span>
                    </div>
                </header>

                <div ref={scrollRef} className="messagesContainer">
                    {messages.map(msg => (
                        <div key={msg.id} className={msg.role === 'user' ? "userMessageWrapper" : "assistantMessageWrapper"}>
                            {msg.role === 'assistant' && (
                                <div className="assistantAvatar">
                                    <Bot size={20} />
                                </div>
                            )}
                            <div className={msg.role === 'user' ? "userMessage" : "assistantMessage"}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                            {msg.role === 'user' && (
                                <div className="userAvatar">
                                    <User size={20} />
                                </div>
                            )}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="typingIndicator">
                            <div className="assistantAvatar">
                                <Bot size={20} />
                            </div>
                            <div className="typingDots">
                                <span className="dot1" />
                                <span className="dot2" />
                                <span className="dot3" />
                            </div>
                        </div>
                    )}

                    {messages.length === 1 && (
                        <div className="suggestions">
                            {suggestions.map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setInput(s)}
                                    className="suggestionButton"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <footer className="inputContainer">
                    <div className="inputWrapper">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Escribe tu consulta operativa..."
                            className="inputField"
                            disabled={isTyping}
                        />
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className={`sendButton ${isTyping ? 'disabled' : ''}`}
                        >
                            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
                        </button>
                    </div>
                    <p className="footerNote">Datos analizados en tiempo real desde la base de datos de producción.</p>
                </footer>
            </div>
        </div>
    );
}
