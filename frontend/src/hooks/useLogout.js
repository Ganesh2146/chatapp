import React, { useState } from 'react'
import { useAuthContext } from '../context/Auth-Context';
import { post } from '../Utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const useLogout = () => {
    const [loading, setLoading] = useState(false);
    const {setAuthUser} = useAuthContext();
    const navigate = useNavigate();

    const logout = async() => {
        setLoading(true);
        try{
            const data = await post("/api/auth/logout", {});
            if(data.error) throw new Error(data.error);
            localStorage.removeItem("chat-user");
            setAuthUser(null);
            navigate("/login");
        } catch (error) {
            toast.error(error.message);
        } finally{
            setLoading(false);
        }
    }

    return {loading, logout};
}

export default useLogout
