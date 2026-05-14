import React, { useState, useRef, useEffect } from 'react';
import useAuth from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';
import './ChatWidget.css';

const ChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: '¡Hola! Soy CineBot 🤖. ¿Qué tipo de película te apetece ver hoy?', isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    if (!user) return null;

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
        setInput('');
        setIsLoading(true);

        try {
            const res = await apiClient.post('/bot/chat', { message: userMsg });
            setMessages(prev => [...prev, { text: res.data.reply, isBot: true }]);
        } catch (error) {
            setMessages(prev => [...prev, { 
                text: 'Mmm, parece que tuve un problema conectando con el servidor. ¿Quizás falta la clave de Gemini?', 
                isBot: true 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    // Parse simple markdown (negritas)
    const renderMessage = (text) => {
        const parts = text.split(/(\*\*.*?\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} style={{ color: '#fff' }}>{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="chat-widget">
            {/* Widget Button */}
            <button 
                className={`chat-widget__btn ${isOpen ? 'open' : ''}`} 
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Abrir chat de IA"
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {/* Chat Window */}
            <div className={`chat-widget__window ${isOpen ? 'active' : ''}`}>
                <div className="chat-widget__header">
                    <span className="chat-widget__title">CineBot IA</span>
                    <span className="chat-widget__status">En línea</span>
                </div>
                
                <div className="chat-widget__messages">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`chat-msg ${msg.isBot ? 'chat-msg--bot' : 'chat-msg--user'}`}>
                            {msg.isBot && <div className="chat-msg__avatar">🤖</div>}
                            <div className="chat-msg__bubble">
                                {renderMessage(msg.text)}
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="chat-msg chat-msg--bot">
                            <div className="chat-msg__avatar">🤖</div>
                            <div className="chat-msg__bubble chat-msg__bubble--loading">
                                <span>.</span><span>.</span><span>.</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form className="chat-widget__input-area" onSubmit={handleSend}>
                    <input 
                        type="text" 
                        placeholder="Pregúntame algo..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        disabled={isLoading}
                    />
                    <button type="submit" disabled={isLoading || !input.trim()}>
                        ➤
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatWidget;
