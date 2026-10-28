import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useT } from '../i18n/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';
import MessageItem from './MessageItem';
import api, { isTokenValid } from '../utils/api';
import './SmartQueryChatbot.css';

const SmartQueryChatbot = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useT();
    const messagesRef = useRef([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        checkAuthAndLoadMessages();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- verify auth once on mount
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const checkAuthAndLoadMessages = async () => {
        try {
            const isValid = await isTokenValid();
            if (!isValid) {
                console.log('Token validation failed in SmartQueryChatbot');
                setIsAuthenticated(false);
                setError(t('common.sessionExpired'));
                localStorage.setItem('redirectAfterLogin', location.pathname);
                localStorage.removeItem('token'); // Clear invalid token
                navigate('/login');
                return;
            }

            console.log('Token verified with backend');
            setIsAuthenticated(true);
            setError(null);
            await loadMessageHistory();
        } catch (error) {
            console.error('Auth verification failed:', error);
            setIsAuthenticated(false);
            setError(t('common.sessionExpired'));
            localStorage.setItem('redirectAfterLogin', location.pathname);
            localStorage.removeItem('token');
            navigate('/login');
        }
    };

    const focusInput = useCallback(() => {
        if (inputRef.current && isAuthenticated) {
            inputRef.current.focus();
        }
    }, [isAuthenticated]);

    const loadMessageHistory = async () => {
        try {
            setError(null);
            console.log('Loading message history...');
            const response = await api.get('/smart-query/messages');
            console.log('Message history response:', response.data);

            if (response.data.messages) {
                updateMessages(response.data.messages);
            }
        } catch (error) {
            console.error('Error loading message history:', error);

            if (error.message === 'AUTH_REQUIRED' || error.isAuthError) {
                setIsAuthenticated(false);
                setError(t('common.sessionExpired'));
                localStorage.setItem('redirectAfterLogin', location.pathname);
                localStorage.removeItem('token');
                navigate('/login');
            } else {
                setError(t('chatbot.historyFailed'));
            }
        }
    };

    const updateMessages = useCallback((newMessages) => {
        messagesRef.current = newMessages;
        setMessages(newMessages);
    }, []);

    const addMessage = useCallback((message) => {
        const newMessages = [...messagesRef.current, message];
        updateMessages(newMessages);
    }, [updateMessages]);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        });
    };

    const handleSend = async () => {
        if (!isAuthenticated) {
            setError(t('chatbot.loginToSend'));
            localStorage.setItem('redirectAfterLogin', location.pathname);
            navigate('/login');
            return;
        }

        const content = inputRef.current?.innerText.trim();
        if (!content) return;

        try {
            setLoading(true);
            setError(null);

            // Clear input immediately
            inputRef.current.innerText = '';

            // Add user message to chat immediately
            const userMessage = { role: 'user', content };
            addMessage(userMessage);

            // Send query to server
            const response = await api.post('/smart-query/query', { query: content });

            // Add assistant response to chat
            if (response.data.response) {
                const assistantMessage = { role: 'assistant', content: response.data.response };
                addMessage(assistantMessage);

                // Save the message to history
                await api.post('/smart-query/messages', {
                    content,
                    role: 'user'
                });
            }
        } catch (error) {
            console.error('Error processing query:', error);
            let errorMessage = t('chatbot.queryFailed');

            if (error.message === 'AUTH_REQUIRED' || error.isAuthError) {
                errorMessage = t('common.sessionExpired');
                setIsAuthenticated(false);
                localStorage.setItem('redirectAfterLogin', location.pathname);
                localStorage.removeItem('token');
                navigate('/login');
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            }

            addMessage({
                role: 'assistant',
                content: errorMessage
            });
            setError(errorMessage);
        } finally {
            setLoading(false);
            focusInput();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    const handleClearChat = async () => {
        if (!isAuthenticated) {
            setError(t('chatbot.loginToSend'));
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await api.delete('/smart-query/messages');
            console.log('Clear chat response:', response);

            if (response.data.success) {
                setMessages([]);
                messagesRef.current = [];
                focusInput();
            } else {
                throw new Error(response.data.error || 'Failed to clear chat');
            }
        } catch (error) {
            console.error('Error clearing chat:', error);
            setError(error.response?.data?.error || t('chatbot.clearFailed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="smart-query-chatbot">
            <div className="chat-header-container">
                <div className="chat-header">
                    <div className="header-content">
                        <h2>{t('admin.smartQueryTitle')}</h2>
                        <p>{t('admin.smartQueryLede')}</p>
                        <button
                            className="clear-chat-button"
                            onClick={handleClearChat}
                            disabled={loading || !isAuthenticated || messages.length === 0}
                        >
                            {loading ? t('chatbot.clearing') : t('chatbot.clear')}
                        </button>
                    </div>
                    {error && (
                        <div className="error-message">
                            <span>{error}</span>
                            {!isAuthenticated && (
                                <button
                                    className="login-button"
                                    onClick={() => {
                                        localStorage.setItem('redirectAfterLogin', location.pathname);
                                        navigate('/login');
                                    }}
                                >
                                    {t('nav.signIn')}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="chat-messages">
                {messages.map((msg, index) => (
                    <MessageItem key={index} message={msg} />
                ))}
                {loading && (
                    <div className="message assistant">
                        <div className="message-content loading">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input">
                <div
                    ref={inputRef}
                    className="input-editable"
                    contentEditable={isAuthenticated && !error}
                    onKeyPress={handleKeyPress}
                    onPaste={handlePaste}
                    data-placeholder={!isAuthenticated ? t('chatbot.loginToSend') : t('chatbot.ask')}
                    aria-label={t('chatbot.ask')}
                    role="textbox"
                />
                <button
                    onClick={handleSend}
                    disabled={loading || !isAuthenticated || error}
                >
                    {t('chatbot.send')}
                </button>
            </div>
        </div>
    );
};

export default SmartQueryChatbot; 