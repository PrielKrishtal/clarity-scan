import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import LegalFooter from '../components/LegalFooter';


export default function RegisterPage() {
    const [email, setEmail] = useState(""); 
    const [password, setPassword] = useState(""); 
    const [error, setError] = useState(""); 
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        // Client-side validation: Ensure password and confirmation match before API call
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            await register(email, password);
            // On successful registration, redirect the user to the login portal
            navigate('/login');
        } catch (err) {
            console.error("Registration payload failed:", err);
            
            // Extract and parse specific error details from the backend response
            if (err.response && err.response.data && err.response.data.detail) {
                const serverError = err.response.data.detail;
                
                // Handle standard HTTP exception strings (e.g., 400 Bad Request)
                if (typeof serverError === 'string') {
                    const normalizedError = serverError.toLowerCase();
                    // UX & Security enhancement: Sanitize 'user exists' errors to guide the user appropriately
                    if (normalizedError.includes("already registered") || normalizedError.includes("already exists")) {
                        setError("This account is already registered. Please sign in instead.");
                    } else {
                        setError(serverError);
                    }
                } 
                // Handle Pydantic validation error arrays (e.g., 422 Unprocessable Entity)
                else if (Array.isArray(serverError) && serverError.length > 0) {
                    const validationMsg = serverError[0].msg;
                    
                    // UX enhancement: Map raw Pydantic password validation constraints to user-friendly messages
                    if (validationMsg.includes("String should have at least") || validationMsg.includes("Value error")) {
                        setError("Password must be at least 8 characters long and contain both letters and numbers.");
                    } else {
                        setError(validationMsg);
                    }
                } 
                else {
                    // Fallback for unrecognized server error data structures
                    setError("Registration failed. Please verify your details and try again.");
                }
            } else {
                // Handle scenarios where the server is unreachable, offline, or CORS fails
                setError("Network error. Please check your connection or try again later.");
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-bgLight">
            <div className="fixed top-0 left-0 right-0 h-1 bg-navy" />
            
            <div className="w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <img src="/logo_no_bg.png" alt="ClarityScan" className="h-32 drop-shadow-sm" />
                </div>
                
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-8 space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-navy">Create your account</h2>
                        <p className="mt-1 text-sm text-slate-400">
                            Join ClarityScan and take control of your expenses
                        </p>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-md">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                    
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Email address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg bg-bgLight text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg bg-bgLight text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-teal transition-colors"
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-navy mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full px-4 py-2.5 pr-10 border border-slate-200 rounded-lg bg-bgLight text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button" 
                                    onClick={() => setShowConfirm(!showConfirm)} 
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-teal transition-colors"
                                >
                                    {showConfirm ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        <button
                            type="submit"
                            className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-navy hover:bg-teal transition-colors duration-300 mt-2 shadow-sm"
                        >
                            Sign up
                        </button>
                    </form>
                    
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-100" />
                        </div>
                    </div>
                    
                    <p className="text-center text-sm text-slate-400">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-teal hover:text-navy transition-colors duration-300">
                            Sign in here
                        </Link>
                    </p>
                </div>
                
                <LegalFooter />
                
            </div>
        </div>
    );
}