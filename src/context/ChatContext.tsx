import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatContextType {
    socket: Socket | null;
    isConnected: boolean;
    messages: Message[];
    sendMessage: (msg: string, to?: string) => void;
    senderName: string;
    activeUsers: string[];
    loginUser: (user: any) => void;
    logoutUser: () => void;
}

export interface Message {
    sender: string;
    message: string;
    to?: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

interface ChatProviderProps {
    children: ReactNode;
}

// Ensure this matches your backend port
const SOCKET_URL = 'http://localhost:3001';

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const socketRef = React.useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [senderName, setSenderName] = useState('');
    const [activeUsers, setActiveUsers] = useState<string[]>([]);

    const connectSocket = (name: string) => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current = null;
        }

        const newSocket = io(SOCKET_URL);
        socketRef.current = newSocket;
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to chat server');
            setIsConnected(true);
            newSocket.emit('join', name);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected from chat server');
            setIsConnected(false);
            setActiveUsers([]);
        });

        newSocket.on('receiveMessage', (message: Message) => {
            setMessages((prev) => [...prev, message]);
        });

        newSocket.on('activeUsers', (users: string[]) => {
            setActiveUsers(users);
        });
    };

    const loginUser = (user: any) => {
        setSenderName(user.name);
        connectSocket(user.name);
    };

    const logoutUser = () => {
        if (socketRef.current) {
            socketRef.current.emit('logout');
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        setSenderName('');
        setIsConnected(false);
        setActiveUsers([]);
        setSocket(null);
    };

    useEffect(() => {
        const user = localStorage.getItem('user');
        if (user) {
            try {
                const parsedUser = JSON.parse(user);
                if (parsedUser) {
                    setSenderName(parsedUser.name);
                    connectSocket(parsedUser.name);
                }
            } catch (e) {
                console.error("Error parsing user from localStorage", e);
            }
        }

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const sendMessage = (msg: string, to?: string) => {
        if (socketRef.current && msg.trim()) {
            const payload = { sender: senderName, message: msg, to };
            socketRef.current.emit('sendMessage', payload);
        }
    };

    return (
        <ChatContext.Provider value={{ socket, isConnected, messages, sendMessage, senderName, activeUsers, loginUser, logoutUser }}>
            {children}
        </ChatContext.Provider>
    );
};
