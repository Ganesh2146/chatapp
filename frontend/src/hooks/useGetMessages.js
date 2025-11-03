import { useState, useEffect } from "react"
import { useAuthContext } from "../context/Auth-Context"
import { get } from "../Utils/api"
import toast from "react-hot-toast"

const useGetMessages = () => {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const {selectedConversation} = useAuthContext();

    const getMessages = async() => {
        setLoading(true);
        try{
            const data = await get(`/api/messages/${selectedConversation._id}`);
            if(data.error) throw new Error(data.error);
            setMessages(data);
        } catch (error) {
            toast.error(error.message);
        } finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        if(selectedConversation?._id) getMessages();
    }, [selectedConversation?._id])

    return {messages, loading};
}

export default useGetMessages
