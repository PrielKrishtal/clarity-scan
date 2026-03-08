import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function ProtectedRoute({ children,redirection = '/login'}) {
    

    const status = useAuth().isAuthenticated;
    if (!status){
        return (
           <Navigate to={redirection} replace/>
        );
    } 

    return children
}