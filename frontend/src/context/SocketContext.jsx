import { createContext, useEffect, useState, useContext } from "react";
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
    const { authUser } = useAuthContext(); // Currently logged in user...

    useEffect(() => {
        if (authUser) {
            // Use environment variable with fallback to localhost for development
            const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
            const socket = io(socketUrl, {
                withCredentials: true,
                query: {
                    userId: authUser?.data?.user?._id
                }
            }); //Server url....
            setSocket(socket);

             //socket.on() is used to listen the events. can be used in both client and server side..
            socket.on("getOnlineUsers", (users) => {
                setOnlineUsers(users);
            })

            //CLeanup code --> unmount the component..
            return () => socket.close();
        }else{
            if(socket){
                socket.close();
                setSocket(null);
            }
        }
    },[authUser]);
    return (
        <SocketContext.Provider value={{socket, onlineUsers}}>
            {children}
        </SocketContext.Provider>
    )
}