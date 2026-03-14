import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UploadModal from './UploadModal';

const NAV_ITEMS = [
    {
        name: 'Dashboard',
        path: '/dashboard',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
            </svg>
        ),
    },
    {
        name: 'Receipts',
        path: '/receipts',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[18px] h-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
        ),
    },
];

const UPLOAD_ICON = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-[18px] h-[18px]">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
    </svg>
);

export default function AppLayout() {
    const { user, handleLogout } = useAuth();
    const navigate = useNavigate();
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const initials = user?.email_address?.slice(0, 2).toUpperCase() || '??';

    const onLogout = () => {
        handleLogout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-bgLight overflow-hidden">
            <aside className="w-60 flex flex-col shrink-0 bg-navy">
                <div className="h-16 flex items-center px-5 border-b border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal"></span>
                        <span className="text-white font-bold text-base tracking-wide">ClarityScan</span>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-5 space-y-1">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                                    isActive
                                        ? 'bg-white/15 text-white'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <span className={isActive ? 'text-teal' : ''}>{item.icon}</span>
                                    {item.name}
                                </>
                            )}
                        </NavLink>
                    ))}

                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white/90 transition-all duration-150"
                    >
                        <span>{UPLOAD_ICON}</span>
                        Upload
                    </button>
                </nav>

                <div className="px-3 pb-5 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-teal/20 border border-teal/40 flex items-center justify-center shrink-0">
                            <span className="text-teal text-xs font-bold">{initials}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white/80 text-xs truncate">{user?.email_address || 'Account'}</p>
                            <button
                                onClick={onLogout}
                                className="text-white/40 hover:text-teal text-xs transition-colors mt-0.5"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                 <Outlet context={{ openUploadModal: () => setIsUploadModalOpen(true), refreshTrigger }} />
            </main>

            {isUploadModalOpen && (
                <UploadModal 
                    onClose={() => setIsUploadModalOpen(false)} 
                    onUploadSuccess={() => setRefreshTrigger(prev => prev + 1)} 
                />
            )}
        </div>
    );
}