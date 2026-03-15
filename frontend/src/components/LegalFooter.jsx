import { useState } from 'react';
import { legalContent } from '../data/legalContent';

export default function LegalFooter({ className = "mt-6" }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <p className={`text-center text-xs text-slate-400 ${className}`}>
                © 2026 ClarityScan |{' '}
                <button 
                    onClick={() => setIsOpen(true)} 
                    className="hover:text-teal hover:underline transition-colors focus:outline-none"
                >
                    Accessibility & Terms
                </button>
            </p>

            {isOpen && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50 shrink-0">
                            <h2 className="text-xl font-bold text-navy">Accessibility, Terms & Privacy</h2>
                            <button 
                                onClick={() => setIsOpen(false)} 
                                className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-navy hover:bg-slate-100 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[75vh] space-y-6 text-sm text-slate-600">
                            <div dir="rtl" className="space-y-4">
                                <h3 className="text-lg font-bold text-navy border-b border-slate-100 pb-2">נגישות, תנאי שימוש ופרטיות (Hebrew)</h3>
                                {legalContent.hebrew.map((item) => (
                                    <div key={item.id}>
                                        <h4 className="font-bold text-navy">{item.title}</h4>
                                        <p>{item.text}</p>
                                    </div>
                                ))}
                            </div>

                            <hr className="border-slate-200" />

                            <div dir="ltr" className="space-y-4">
                                <h3 className="text-lg font-bold text-navy border-b border-slate-100 pb-2">Accessibility, Terms & Privacy (English)</h3>
                                {legalContent.english.map((item) => (
                                    <div key={item.id}>
                                        <h4 className="font-bold text-navy">{item.title}</h4>
                                        <p>{item.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}