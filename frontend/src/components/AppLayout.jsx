import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';


export default function AppLayout() {
    return (
        <div className="min-h-screen flex flex-col bg-bgLight">
            <Navbar />

            <div className="flex flex-1 overflow-hidden">
                

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}