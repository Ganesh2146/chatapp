import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/Auth-Context";
import { post } from "../Utils/api";

const useLogin = () => {
    const [loading, setLoading] = useState(false);
    const { setAuthUser } = useAuthContext();

    const login = async ({ email, password }) => {
        try {
            const success = handleLoginErrors(email, password);
            if (!success) return;
            
            setLoading(true);
            const data = await post("/api/auth/login", { email, password });
           if(data.error){
            throw new Error(data.error);
           }

           localStorage.setItem('chat-user', JSON.stringify(data));
           setAuthUser(data);   
        } catch (error) {
            toast.error(error.message);
        }finally{
            setLoading(false);
        }
    }
    return {loading, login};
}

export default useLogin;

function handleLoginErrors(email, password){
    if(!email || !password){
        toast.error("Fill up all the fields");
        return false;
    }

    return true;
}
