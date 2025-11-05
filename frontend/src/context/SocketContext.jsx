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
    const socketRef = useRef(null);

    // Function to handle WebSocket connection
    const setupSocket = useCallback(() => {
        // If there's no authenticated user, close any existing socket and return
        if (!authUser) {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
                setSocket(null);
            }
            return () => {};
        }

        // Close existing socket if any
        if (socketRef.current) {
            socketRef.current.close();
        }

        // Create a new socket connection
        const socketInstance = setupWebSocket(authUser._id);
        let isMounted = true;

        // Set up event listeners
        const onConnect = () => {
            console.log('Connected to WebSocket server');
            if (isMounted) {
                setSocket(socketInstance);
            }
        };

        const onDisconnect = () => {
            console.log('Disconnected from WebSocket server');
            if (isMounted) {
                setSocket(null);
            }
        };

        const onOnlineUsers = (users) => {
            if (isMounted) {
                setOnlineUsers(users);
            }
        };

        // Add event listeners
        socketInstance.on('connect', onConnect);
        socketInstance.on('disconnect', onDisconnect);
        socketInstance.on('getOnlineUsers', onOnlineUsers);

        // Store the socket instance in the ref
        socketRef.current = socketInstance;

        // Cleanup function
        return () => {
            isMounted = false;
            if (socketInstance) {
                // Remove event listeners
                socketInstance.off('connect', onConnect);
                socketInstance.off('disconnect', onDisconnect);
                socketInstance.off('getOnlineUsers', onOnlineUsers);
                
                // Only close if this is the current socket
                if (socketInstance === socketRef.current) {
                    socketInstance.close();
                    socketRef.current = null;
                }
            }
        };
    }, [authUser]);

    // Set up socket when authUser changes
    useEffect(() => {
        const cleanup = setupSocket();
        return cleanup;
    }, [setupSocket]);

    // Clean up on unmount
    useEffect(() => {
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
        };
    }, []);

    return (
        <SocketContext.Provider value={{ 
            socket, 
            onlineUsers, 
            isConnected: socket?.connected || false 
        }}>
            {children}
        </SocketContext.Provider>
    );
};