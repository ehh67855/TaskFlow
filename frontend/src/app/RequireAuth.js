import { Navigate } from "react-router-dom";
import { isAuthenticated } from "src/services/BackendService";

export default function RequireAuth ({children}) {
    if (!isAuthenticated()) {
        <Navigate to="/login" />
    }

    return children;
}