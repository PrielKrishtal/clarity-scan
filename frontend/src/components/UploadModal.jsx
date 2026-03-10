import { useState, useRef } from 'react';

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Office', 'Other'];

const ImageUploadTab = ({ onClose }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState(null);
    const inputRef = useRef();

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) setFile(dropped);
    };

    const handleFileChange = (e) => {
        if (e.target.files[0]) setFile(e.target.files[0]);
    };

    return (
        <div className="space-y-5">
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current.click()}
                className={`rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-4 py-14 px-6 text-center ${
                    isDragging
                        ? 'border-teal bg-teal/5'
                        : 'border-slate-200 hover:border-teal/50 hover:bg-slate-50'
                }`}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleFileChange}
                />
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                     style={{ backgroundColor: 'rgba(42,157,143,0.1)', color: '#2A9D8F' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="currentColor" className="w-7 h-7">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                    </svg>
                </div>
                {file ? (
                    <div>
                        <p className="text-sm font-semibold text-navy">{file.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB — ready to upload</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm font-semibold text-navy">Drop your receipt here</p>
                        <p className="text-xs text-slate-400 mt-1">JPG or PNG · Max 10MB</p>
                    </div>
                )}
            </div>

            <button
                disabled={!file}
                className="w-full py-3 text-sm font-semibold rounded-xl text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#2A9D8F' }}
                onMouseEnter={e => { if (file) e.currentTarget.style.backgroundColor = '#238f82'; }}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2A9D8F'}
            >
                {file ? 'Scan Receipt' : 'Select a file to continue'}
            </button>
        </div>
    );
};

const ManualEntryTab = ({ onClose }) => {
    const [form, setForm] = useState({
        merchant: '', date: '', category: 'Food', amount: '', tax: '',
    });

    const handleChange = (field) => (e) =>
        setForm(prev => ({ ...prev, [field]: e.target.value }));

    const inputClass = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-navy placeholder-slate-400 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all";

    const isValid = form.merchant && form.date && form.amount;

    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Merchant Name</label>
                <input
                    className={inputClass}
                    placeholder="e.g. Superpharm"
                    value={form.merchant}
                    onChange={handleChange('merchant')}
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</label>
                    <input type="date" className={inputClass} value={form.date} onChange={handleChange('date')} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Category</label>
                    <select className={inputClass} value={form.category} onChange={handleChange('category')}>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Total Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                            type="number"
                            className={`${inputClass} pl-7`}
                            placeholder="0.00"
                            value={form.amount}
                            onChange={handleChange('amount')}
                        />
                    </div>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tax Amount</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                        <input
                            type="number"
                            className={`${inputClass} pl-7`}
                            placeholder="0.00"
                            value={form.tax}
                            onChange={handleChange('tax')}
                        />
                    </div>
                </div>
            </div>

            <button
                disabled={!isValid}
                className="w-full py-3 text-sm font-semibold rounded-xl text-white transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed mt-2"
                style={{ backgroundColor: '#2A9D8F' }}
                onMouseEnter={e => { if (isValid) e.currentTarget.style.backgroundColor = '#238f82'; }}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2A9D8F'}
            >
                Save Receipt
            </button>
        </div>
    );
};

export default function UploadModal({ onClose }) {
    const [tab, setTab] = useState('image');

    const tabClass = (t) =>
        `flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-150 ${
            tab === t
                ? 'bg-white text-navy shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
        }`;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-base font-bold text-navy">Add Receipt</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Upload an image or enter data manually</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:text-navy hover:bg-slate-50 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="px-6 pt-5">
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                        <button className={tabClass('image')} onClick={() => setTab('image')}>
                            Image Upload
                        </button>
                        <button className={tabClass('manual')} onClick={() => setTab('manual')}>
                            Manual Entry
                        </button>
                    </div>
                </div>

                <div className="px-6 py-5">
                    {tab === 'image'
                        ? <ImageUploadTab onClose={onClose} />
                        : <ManualEntryTab onClose={onClose} />
                    }
                </div>
            </div>
        </div>
    );
}