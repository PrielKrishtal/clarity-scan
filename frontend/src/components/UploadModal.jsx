import { useState, useRef } from 'react';
import { uploadReceipt, createManualReceipt } from '../api/receipts';

const CATEGORIES = [
    { id: 'Food', label: 'Food', icon: '🍔' },
    { id: 'Transport', label: 'Transport', icon: '🚗' },
    { id: 'Bills', label: 'Bills', icon: '💡' },
    { id: 'Shopping', label: 'Shopping', icon: '🛍️' },
    { id: 'Health', label: 'Health', icon: '💊' },
    { id: 'Other', label: 'Other', icon: '📦' }
];

const ImageUploadTab = ({ onClose, onUploadSuccess }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); 
    const [error, setError] = useState(null);
    const inputRef = useRef();

    const handleUpload = async () => {
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            setError("File too large (Max 10MB)");
            return;
        }

        setStatus('loading');
        setError(null);
        try {
            await uploadReceipt(file);
            setStatus('success');
            
            setTimeout(() => {
                if (onUploadSuccess) onUploadSuccess();
                onClose();
            }, 2000);
        } catch (err) {
            setStatus('idle');
            const errorMessage = err.response?.data?.detail || "Upload failed. Please check your connection.";
            setError(errorMessage);
        }
    };

    if (status === 'success') {
        return (
            <div className="py-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#10B981" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-navy">Image Loaded!</h3>
                <p className="text-slate-400 text-sm text-center">Receipt sent for AI processing.<br/>Refreshing your list...</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { 
                    e.preventDefault(); 
                    setIsDragging(false); 
                    if (e.dataTransfer.files[0]) {
                        setFile(e.dataTransfer.files[0]);
                        setError(null);
                    }
                }}
                onClick={() => status !== 'loading' && inputRef.current.click()}
                className={`rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-4 py-14 px-6 text-center ${
                    status === 'loading' ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                } ${isDragging ? 'border-teal bg-teal/5' : 'border-slate-200 hover:border-teal/50 hover:bg-slate-50'}`}
            >
                <input 
                    ref={inputRef} 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                        setFile(e.target.files[0]);
                        setError(null);
                    }} 
                    disabled={status === 'loading'} 
                />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-teal/10 text-teal">
                    {status === 'loading' ? <div className="w-6 h-6 border-3 border-teal border-t-transparent rounded-full animate-spin"></div> : 
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor" className="w-7 h-7"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" /></svg>}
                </div>
                <div>
                    <p className="text-sm font-semibold text-navy">{file ? file.name : 'Drop your receipt here'}</p>
                    <p className="text-xs text-slate-400 mt-1">{file ? `${(file.size / 1024).toFixed(1)} KB` : 'JPG or PNG (Max 10MB)'}</p>
                    {error && (
                        <p className="text-red-500 text-[11px] font-bold mt-3 uppercase tracking-wider animate-in fade-in slide-in-from-top-1">
                            {error}
                        </p>
                    )}
                </div>
            </div>
            <button onClick={handleUpload} disabled={!file || status === 'loading'} className="w-full py-3 text-sm font-bold rounded-xl text-white bg-teal disabled:opacity-40 transition-all shadow-md active:scale-[0.98]">
                {status === 'loading' ? 'Uploading...' : 'Scan Receipt'}
            </button>
        </div>
    );
};

const ManualEntryTab = ({ onClose, onUploadSuccess }) => {
    const [status, setStatus] = useState('idle');
    const [form, setForm] = useState({ merchant_name: '', receipt_date: '', category: 'Other', total_amount: '', tax_amount: '' });

    const handleChange = (field, val) => {
        if ((field === 'total_amount' || field === 'tax_amount') && val < 0) return;
        setForm(prev => ({ ...prev, [field]: val }));
    };

    const handleSave = async () => {
        setStatus('loading');
        try {
            await createManualReceipt({ 
                ...form, 
                total_amount: parseFloat(form.total_amount), 
                tax_amount: parseFloat(form.tax_amount || 0) 
            });
            setStatus('success');
            setTimeout(() => {
                if (onUploadSuccess) onUploadSuccess();
                onClose();
            }, 2000);
        } catch (err) { 
            setStatus('idle');
            alert('Failed to save receipt.'); 
        }
    };

    if (status === 'success') {
        return (
            <div className="py-20 flex flex-col items-center justify-center space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="#10B981" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-navy">Receipt Saved!</h3>
                <p className="text-slate-400 text-sm text-center">Your receipt has been added to your records.<br/>Refreshing your list...</p>
            </div>
        );
    }

    const inputClass = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-navy focus:ring-2 focus:ring-teal outline-none transition-all";

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Merchant Name</label>
                <input className={inputClass} placeholder="e.g. Superpharm" value={form.merchant_name} onChange={(e) => handleChange('merchant_name', e.target.value)} disabled={status === 'loading'} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Date</label>
                    <input type="date" className={inputClass} value={form.receipt_date} onChange={(e) => handleChange('receipt_date', e.target.value)} disabled={status === 'loading'} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase">Price</label>
                    <input type="number" className={inputClass} placeholder="0.00" value={form.total_amount} onChange={(e) => handleChange('total_amount', e.target.value)} disabled={status === 'loading'} />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase">Category</label>
                <div className="grid grid-cols-3 gap-2">
                    {CATEGORIES.map(c => (
                        <button key={c.id} type="button" onClick={() => handleChange('category', c.id)} disabled={status === 'loading'} className={`flex items-center justify-center gap-2 py-2 rounded-xl border text-xs font-medium transition-all ${form.category === c.id ? 'border-teal bg-teal/5 text-teal shadow-sm' : 'border-slate-100 text-slate-500 hover:bg-slate-50'} ${status === 'loading' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <span>{c.icon}</span>{c.label}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={handleSave} disabled={!form.merchant_name || !form.receipt_date || !form.total_amount || status === 'loading'} className="w-full py-3 text-sm font-bold rounded-xl text-white bg-teal disabled:opacity-40 transition-all shadow-md active:scale-[0.98]">
                {status === 'loading' ? 'Saving...' : 'Save Receipt'}
            </button>
        </div>
    );
};

export default function UploadModal({ onClose, onUploadSuccess }) {
    const [tab, setTab] = useState('image');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-left">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div><h2 className="text-base font-bold text-navy">Add Receipt</h2><p className="text-xs text-slate-400 mt-0.5">Upload image or enter manually</p></div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-navy hover:bg-slate-50 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                <div className="px-6 pt-5">
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        {['image', 'manual'].map(t => (
                            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === t ? 'bg-white text-navy shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                {t === 'image' ? 'Image Upload' : 'Manual Entry'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="px-6 py-5">
                    {tab === 'image' ? <ImageUploadTab onClose={onClose} onUploadSuccess={onUploadSuccess} /> : <ManualEntryTab onClose={onClose} onUploadSuccess={onUploadSuccess} />}
                </div>
            </div>
        </div>
    );
}