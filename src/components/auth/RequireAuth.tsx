import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function RequireAuth(){
    const {currentUser} = useAuth();
    const location = useLocation();
    return(
        currentUser ? <Outlet/> : <Navigate to="/login" state={{ from: location }} replace />
    )
}