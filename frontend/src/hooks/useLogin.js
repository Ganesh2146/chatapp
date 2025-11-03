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
            const response = await post("/api/auth/login", { email, password });
            
            // Check if the response has the expected structure
            if (response && response.status === 'success' && response.data && response.data.user) {
                const userData = response.data.user;
                // Store the user data in localStorage
                localStorage.setItem('chat-user', JSON.stringify(userData));
                // Update the auth context
                setAuthUser(userData);
                return { success: true };
            } else {
                // Handle unexpected response format
                throw new Error(response?.message || 'Invalid response from server');
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = error.response?.data?.message || 
                               error.message || 
                               'An error occurred during login. Please try again.';
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };
    
    return { loading, login };
}

export default useLogin;

function handleLoginErrors(email, password){
    if(!email || !password){
        toast.error("Fill up all the fields");
        return false;
    }

    return true;
}
