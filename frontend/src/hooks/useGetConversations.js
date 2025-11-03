import { useState, useEffect } from "react"
import { useAuthContext } from "../context/Auth-Context"
import { get } from "../Utils/api"
import toast from "react-hot-toast"

const useGetConversations = () => {
    const [loading, setLoading] = useState(false)
    const [conversations, setConversations] = useState([])
    const {authUser} = useAuthContext()

    const getConversations = async() => {
        setLoading(true);
        try {
            const data = await get('/api/users');
            if(data.error) throw new Error(data.error);
            setConversations(data);
        } catch (error) {
            toast.error(error.message);
        } finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        if(authUser) getConversations();
    }, [authUser])

    return {loading, conversations}
}

export default useGetConversations
