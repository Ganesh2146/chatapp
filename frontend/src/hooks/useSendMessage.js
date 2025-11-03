import { useState } from "react"
import useConversation from "../zustand/useConversation"
import { post } from "../Utils/api"
import toast from 'react-hot-toast'

const useSendMessage = () => {
    const [loading, setLoading] = useState(false);
    const {messages, setMessages, selectedConversation} = useConversation();

    const sendMessage = async(message) => {
        setLoading(true);
        try {
            const data = await post(`/api/messages/send/${selectedConversation._id}`, { message });
            if(data.error) throw new Error(data.error);
            setMessages([...messages, data?.newMessage]);
            return data;
        } catch (error) {
            toast.error(error.message);
        }finally{
            setLoading(false);
        }
    }

    return {loading, sendMessage};
}

export default useSendMessage
