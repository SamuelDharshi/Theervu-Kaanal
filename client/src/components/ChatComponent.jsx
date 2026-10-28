import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useT } from '../i18n/LanguageContext';
import { StreamChat } from 'stream-chat';
import {
    Chat,
    Channel,
    ChannelHeader,
    MessageList,
    MessageInput,
    Window,
    Thread,
    Streami18n,
} from 'stream-chat-react';
import 'stream-chat-react/dist/css/v2/index.css';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

// Create a shared StreamChat instance
const STREAM_API_KEY = 'pnn5rnnuzvzq';
let chatClient = null;

// Get singleton instance of StreamChat client
const getChatClient = () => {
    if (!chatClient) {
        chatClient = StreamChat.getInstance(STREAM_API_KEY);
    }
    return chatClient;
};

const ChatComponent = ({ grievanceId, petitionerId, officialId }) => {
    const { user } = useAuth();
    const { t, lang } = useT();
    // Stream ships Hindi but not Tamil; Tamil keeps Stream's English labels.
    const chatI18n = useMemo(() => new Streami18n({ language: lang === 'hi' ? 'hi' : 'en' }), [lang]);
    const [channel, setChannel] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const clientRef = useRef(null);
    const channelIdRef = useRef(null);
    const initializedRef = useRef(false);

    // This will help track props changes for reconnection
    const propsRef = useRef({ grievanceId, petitionerId, officialId });

    // Cleanup function to disconnect the client
    const disconnectClient = async () => {
        try {
            if (clientRef.current && clientRef.current.userID) {
                console.log('Disconnecting user from chat client');
                await clientRef.current.disconnectUser();
                setChannel(null);
            }
        } catch (err) {
            console.error('Error disconnecting user:', err);
            // Reset client reference if disconnect failed
            clientRef.current = null;
        }
    };

    useEffect(() => {
        // Detect if props have changed - necessary for reassignment cases
        const propsChanged =
            grievanceId !== propsRef.current.grievanceId ||
            petitionerId !== propsRef.current.petitionerId ||
            officialId !== propsRef.current.officialId;

        // Update the reference
        propsRef.current = { grievanceId, petitionerId, officialId };

        // If props changed, we need to reconnect
        if (initializedRef.current && propsChanged) {
            console.log('Props changed, reinitializing chat...');

            // Reset connection state
            setLoading(true);
            setError(null);

            // Disconnect before reconnecting
            disconnectClient().then(() => {
                // Small delay to ensure clean disconnection before reconnection
                setTimeout(() => {
                    initChat();
                }, 500);
            });
        } else if (!initializedRef.current) {
            // Initial setup
            initChat();
            initializedRef.current = true;
        }

        // Cleanup when component unmounts
        return () => {
            disconnectClient();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- reconnect only when the chat participants change
    }, [grievanceId, petitionerId, officialId]);

    const initChat = async () => {
        try {
            setLoading(true);
            console.log('Chat initialization data:', {
                currentUser: {
                    id: user?.id,
                    name: user?.name,
                    email: user?.email,
                    role: user?.role
                },
                grievanceData: {
                    grievanceId,
                    petitionerId,
                    officialId
                }
            });

            // Validate user context
            if (!user) {
                throw new Error('User context is not available. Please log in again.');
            }

            if (!user.id) {
                throw new Error('User ID is missing. Please log in again.');
            }

            // Validate required props
            if (!grievanceId) {
                throw new Error('Grievance ID is missing');
            }

            // For petitioner view
            if (user.role === 'petitioner' && !officialId) {
                throw new Error('Official ID is missing');
            }

            // For official view
            if (user.role === 'official' && !petitionerId) {
                throw new Error('Petitioner ID is missing');
            }

            // Get a client instance
            const client = getChatClient();
            clientRef.current = client;

            // Disconnect any existing user first to prevent "consecutive calls" warning
            if (client.userID) {
                try {
                    await client.disconnectUser();
                    console.log('Disconnected existing user');
                } catch (err) {
                    console.error('Error disconnecting existing user:', err);
                    // Continue anyway
                }
            }

            // Get token from backend
            const tokenResponse = await fetch(`${API_BASE}/api/chat/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    userRole: user.role.toLowerCase()
                })
            });

            if (!tokenResponse.ok) {
                const errorText = await tokenResponse.text();
                console.error('Token response error:', errorText);
                throw new Error(`Failed to get chat token: ${tokenResponse.status}`);
            }

            const tokenData = await tokenResponse.json();
            console.log('Received token data:', { hasToken: !!tokenData.token });

            if (!tokenData.token) {
                throw new Error('No token received from server');
            }

            // Connect user with role information
            await client.connectUser(
                {
                    id: user.id,
                    name: user.name || user.email,
                    email: user.email,
                    role: user.role.toLowerCase()
                },
                tokenData.token
            );

            console.log('Connected user to Stream Chat');

            // Create or join channel
            const channelId = `grievance-${grievanceId}`;
            channelIdRef.current = channelId;
            console.log('Creating channel with ID:', channelId);

            // Determine member IDs based on user role
            let memberIds;
            if (user.role === 'petitioner') {
                // Ensure no duplicate IDs by using a Set
                memberIds = [...new Set([String(user.id), String(officialId)])];
            } else {
                // Ensure no duplicate IDs by using a Set
                memberIds = [...new Set([String(petitionerId), String(user.id)])];
            }
            console.log('Channel members:', memberIds);

            const channel = client.channel('messaging', channelId, {
                name: `Grievance Chat ${grievanceId}`,
                grievance_id: grievanceId,
                members: memberIds
            });

            console.log('Channel created, watching...');
            await channel.watch();
            console.log('Channel watch completed');

            setChannel(channel);
            setError(null);
        } catch (error) {
            console.error('Error in chat initialization:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (error) {
        return (
            <div className="text-red-500 p-4">
                <h4>{t('chat.error')}</h4>
                <p>{error}</p>
                <button
                    onClick={() => {
                        setError(null);
                        setLoading(true);
                        disconnectClient().then(() => {
                            // Small delay before retrying
                            setTimeout(() => initChat(), 500);
                        });
                    }}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-4">{t('chat.starting')}</p>
                </div>
            </div>
        );
    }

    if (!channel) {
        return (
            <div className="text-red-500 p-4">
                <p>{t('chat.failed')}</p>
                <button
                    onClick={() => {
                        setError(null);
                        setLoading(true);
                        disconnectClient().then(() => {
                            // Small delay before retrying
                            setTimeout(() => initChat(), 500);
                        });
                    }}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    {t('common.retry')}
                </button>
            </div>
        );
    }

    return (
        <div className="h-[600px]">
            <Chat client={clientRef.current} theme="messaging light" i18nInstance={chatI18n}>
                <Channel channel={channel}>
                    <Window>
                        <ChannelHeader />
                        <MessageList />
                        <MessageInput />
                    </Window>
                    <Thread />
                </Channel>
            </Chat>
        </div>
    );
};

export default ChatComponent; 