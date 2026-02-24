'use client'

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import Head from 'next/head';
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
        content: '¡Hola! 👋 Soy el asistente de **Carnes del Zulia**. Puedo ayudarte con información sobre tickets, reses, proveedores, mermas y más. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date(),
    },
];

const MOCK_RESPONSES: Record<string, string> = {
    default: 'Entendido. Déjame revisar esa información por ti. En producción, estaré conectado a la base de datos para darte respuestas precisas en tiempo real.',
    ticket: 'Actualmente tienes **24 tickets** registrados este mes. 18 están completados, 4 en proceso de pesado y 2 pendientes. ¿Quieres ver el detalle de alguno?',
    merma: 'La **merma promedio** del último mes es de **2.03%**, lo cual está dentro del rango aceptable (1.5% - 2.5%). El proveedor con menor merma es *Finca El Progreso* con 1.8%.',
    proveedor: 'Tienes **4 proveedores** activos. El que más reses ha entregado este mes es *Agropecuaria La Esperanza* con 36 reses y 9,720 kg totales.',
    corte: 'Los cortes más procesados son: **Costilla** (18%), **Muchacho** (15%), **Solomo** (12%), y **Punta Trasera** (10%). El lomito representa el 8% del total.',
    inventario: 'El inventario actual cuenta con **3,240 cortes** registrados. Los de mayor rotación son costilla y muchacho. ¿Necesitas un reporte detallado?',
};

function getResponse(input: string): string {
    const lower = input.toLowerCase();
    if (lower.includes('ticket')) return MOCK_RESPONSES.ticket;
    if (lower.includes('merma')) return MOCK_RESPONSES.merma;
    if (lower.includes('proveedor')) return MOCK_RESPONSES.proveedor;
    if (lower.includes('corte') || lower.includes('deshuesa')) return MOCK_RESPONSES.corte;
    if (lower.includes('inventario') || lower.includes('stock')) return MOCK_RESPONSES.inventario;
    return MOCK_RESPONSES.default;
}

export default function Chatbot() {
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = () => {
        if (!input.trim() || isTyping) return;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        setTimeout(() => {
            const reply: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: getResponse(userMsg.content),
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, reply]);
            setIsTyping(false);
        }, 1200);
    };

    const suggestions = ['¿Cómo va la merma este mes?', '¿Cuántos tickets hay hoy?', 'Resumen de proveedores', 'Inventario actual'];

    const renderMessageContent = (content: string) => {
        return content.split('**').map((part, i) =>
            i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
        );
    };

    return (
        <>
            <Head>
                <title>Asistente IA - Carnes del Zulia</title>
            </Head>
            <div className="chatContainer">
                {/* Header */}
                <header className="header">
                    <div className="headerIcon">
                        <Sparkles size={24} />
                    </div>
                    <div className="headerContent">
                        <h1 className="headerTitle">Asistente IA</h1>
                        <p className="headerSubtitle">Consultas inteligentes sobre tu operación</p>
                    </div>
                    <div className="headerStatus">
                        <span className="statusIndicator" />
                        <span className="statusText">En línea</span>
                    </div>
                </header>

                {/* Messages */}
                <div ref={scrollRef} className="messagesContainer">
                    {messages.map(msg => (
                        <div key={msg.id} className={msg.role === 'user' ? "userMessageWrapper" : "assistantMessageWrapper"}>
                            {msg.role === 'assistant' && (
                                <div className="assistantAvatar">
                                    <Bot size={20} />
                                </div>
                            )}
                            <div className={msg.role === 'user' ? "userMessage" : "assistantMessage"}>
                                {renderMessageContent(msg.content)}
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

                {/* Input */}
                <footer className="inputContainer">
                    <div className="inputWrapper">
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSend()}
                            placeholder="Escribe tu consulta..."
                            className="inputField"
                            disabled={isTyping}
                        />
                        <button
                            type="button"
                            onClick={handleSend}
                            disabled={!input.trim() || isTyping}
                            className="sendButton"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                    <p className="footerNote">Mockup visual — en producción se conectará a IA real</p>
                </footer>
            </div>
        </>
    );
}
