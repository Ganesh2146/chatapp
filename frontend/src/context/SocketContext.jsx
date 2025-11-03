import { createContext, useEffect, useState, useContext, useCallback } from "react";
import { useAuthContext } from "./Auth-Context";
import { io } from 'socket.io-client';

export const SocketContext = createContext();

// Creating custom hook to use SocketContext...
export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { authUser } = useAuthContext();

    const setupSocket = useCallback(() => {
        if (authUser?.data?.user?._id) {
            const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
            
            // Clean up any existing socket
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }

            const newSocket = io(socketUrl, {
                withCredentials: true,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                autoConnect: true,
                transports: ['websocket', 'polling'],
                query: {
                    userId: authUser.data.user._id
                }
            });

            // Connection established
            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
            });

            // Connection error
            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error.message);
                // Attempt to reconnect after a delay
                setTimeout(() => {
                    newSocket.connect();
                }, 1000);
            });

            // Handle online users
            newSocket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            });

            // Handle disconnection
            newSocket.on('disconnect', (reason) => {
                console.log('Socket disconnected:', reason);
                if (reason === 'io server disconnect') {
                    // The disconnection was initiated by the server, you need to reconnect manually
                    newSocket.connect();
                }
            });

            setSocket(newSocket);

            // Cleanup function
            return () => {
                if (newSocket) {
                    newSocket.off('connect');
                    newSocket.off('connect_error');
                    newSocket.off('disconnect');
                    newSocket.off('getOnlineUsers');
                    newSocket.disconnect();
                }
            };
        }
    }, [authUser]);

    // Set up socket when authUser changes
    useEffect(() => {
        const cleanup = setupSocket();
        return () => {
            if (cleanup) cleanup();
        };
    }, [setupSocket]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers, isConnected: socket?.connected || false }}>
            {children}
        </SocketContext.Provider>
    );
};