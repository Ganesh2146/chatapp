import { useState } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/Auth-Context";
import { post } from "../Utils/api";

const useSignup = () => {
  const [loading, setLoading] = useState(false);
  const {setAuthUser} = useAuthContext();

  const signup = async ({email,userName,password,confirmPassword,gender}) => {
    const success = handleInputErrors({email,userName,password,confirmPassword,gender});
    if (!success) return;
    setLoading(true);
    try {
        const data = await post("/api/auth/signup", {
            email,
            userName,
            password,
            confirmPassword,
            gender
        });
        
        console.log(data);
        if(data.error){
            throw new Error(data.error);
        }

        //Localstorage....After saving the form data in db, we get response from backend, saving it in localstorage.
        localStorage.setItem("chat-user", JSON.stringify(data));
        //Context.....
        setAuthUser(data);
    } catch (error) {
        toast.error(error.message);
    } finally {
        setLoading(false);
    }
  }

  return {loading, signup};
};

export default useSignup;

function handleInputErrors({email,userName,password,confirmPassword,gender}) {
  if (!email || !userName || !password || !confirmPassword || !gender) {
    toast.error("Enter all fields");
    return false;
  }

  if(password != confirmPassword){
    toast.error("Passwords do not match");
    return false;
  }

  if(password.length < 6){
    toast.error("Password must be at least 6 characters");
    return false;
  }

  return true;
}
