import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
    const { handleLogout } = useAuth();
    const navigate = useNavigate();

    const onLogout = () => {
        handleLogout();
        navigate('/login');
    };

    return (
        <nav className="bg-navy text-white h-16 px-6 flex items-center justify-between sticky top-0 z-50 shadow-md">
            <div className="flex items-center gap-3">
                <img src="/logo_no_bg.png" alt="ClarityScan Logo" className="h-8 drop-shadow-sm" />
                <span className="font-bold text-lg tracking-wide hidden sm:block">ClarityScan</span>
            </div>
            
            <div className="flex items-center gap-4">
                <button
                    onClick={onLogout}
                    className="text-sm font-medium text-slate-300 hover:text-teal transition-colors duration-200"
                >
                    Sign out
                </button>
            </div>
        </nav>
    );
}