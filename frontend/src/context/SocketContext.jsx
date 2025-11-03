import { createContext, useEffect, useState, useContext, useCallback, useRef } from "react";
import { useAuthContext } from "./Auth-Context";
import { setupWebSocket } from "../Utils/api";

export const SocketContext = createContext();

// Creating custom hook to use SocketContext...
export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const { authUser } = useAuthContext();
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const setupSocket = useCallback(() => {
        if (!authUser?.data?.user?._id) {
            if (socket) {
                socket.close();
                setSocket(null);
            }
            return;
        }

        // Clean up any existing socket
        if (socket) {
            socket.close();
            setSocket(null);
        }

        const userId = authUser.data.user._id;
        const path = `/socket.io/?userId=${userId}&EIO=4&transport=websocket`;

        const socketInstance = setupWebSocket(path, {
            onOpen: () => {
                console.log('WebSocket connection established');
                reconnectAttempts.current = 0; // Reset reconnect attempts on successful connection
            },
            onMessage: (event) => {
                try {
                    const data = typeof event === 'string' ? JSON.parse(event) : event;
                    if (data.type === 'getOnlineUsers') {
                        setOnlineUsers(data.users || []);
                    }
                    // Handle other message types as needed
                } catch (error) {
                    console.error('Error processing WebSocket message:', error);
                }
            },
            onClose: (event) => {
                console.log('WebSocket connection closed:', event);
                if (event.code !== 1000) { // Don't reconnect on normal closure
                    reconnectAttempts.current++;
                    if (reconnectAttempts.current <= maxReconnectAttempts) {
                        console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})...`);
                        setTimeout(setupSocket, 1000 * reconnectAttempts.current);
                    }
                }
            },
            onError: (error) => {
                console.error('WebSocket error:', error);
            },
            reconnect: true,
            reconnectInterval: 1000,
            maxReconnectAttempts: 5
        });

        setSocket(socketInstance);

        // Cleanup function
        return () => {
            if (socketInstance) {
                socketInstance.close();
            }
        };
    }, [authUser]);

    // Set up socket when authUser changes
    useEffect(() => {
        setupSocket();
        
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