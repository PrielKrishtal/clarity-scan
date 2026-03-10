import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MOCK_RECEIPT = {
    id: 'RCP-00042',
    merchant: 'IKEA',
    date: '2026-03-04',
    category: 'Shopping',
    amount: 543.00,
    tax: 87.00,
    currency: 'USD',
    status: 'REVIEW_NEEDED',
    uploadedAt: '2026-03-04 14:32',
    imageUrl: null,
};

const CATEGORIES = ['Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Office', 'Other'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'ILS'];

const STATUS_STYLES = {
    APPROVED:      'bg-green-100 text-green-700',
    REVIEW_NEEDED: 'bg-orange-100 text-orange-700',
    PROCESSING:    'bg-amber-100 text-amber-700',
    UPLOADED:      'bg-blue-100 text-blue-700',
    FAILED:        'bg-red-100 text-red-700',
};

const isEditable = (status) => status === 'REVIEW_NEEDED' || status === 'FAILED';

const FieldRow = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
        {children}
    </div>
);

const ReadOnlyValue = ({ value, prefix }) => (
    <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-navy">
        {prefix && <span className="text-slate-400 mr-1">{prefix}</span>}
        {value}
    </div>
);

const inputClass = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-navy placeholder-slate-400 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all";

export default function ReceiptDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [form, setForm] = useState({ ...MOCK_RECEIPT });
    const [saved, setSaved] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [zoom, setZoom] = useState(1);

    const editable = isEditable(form.status);

    const handleChange = (field) => (e) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }));
        setSaved(false);
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const handleApprove = () => {
        setForm(prev => ({ ...prev, status: 'APPROVED' }));
    };

    const handleDelete = () => {
        navigate('/receipts');
    };

    return (
        <div className="p-8 md:p-10 space-y-6">

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/receipts')}
                        className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy transition-colors duration-150"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                        Back to Receipts
                    </button>
                    <div className="w-px h-4 bg-slate-200" />
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-navy">{form.merchant}</h1>
                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[form.status]}`}>
                                {form.status.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Receipt {form.id} · Uploaded {form.uploadedAt}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-red-200 text-red-500 bg-white hover:bg-red-50 transition-colors duration-150"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                        Delete
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors duration-150"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Export
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-navy">Receipt Image</h2>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-xs font-bold"
                            >−</button>
                            <span className="text-xs text-slate-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
                            <button
                                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors text-xs font-bold"
                            >+</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-80"
                         style={{ backgroundColor: '#f8fafc' }}>
                        {form.imageUrl ? (
                            <img
                                src={form.imageUrl}
                                alt="Receipt"
                                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}
                                className="rounded-lg shadow-md max-w-full"
                            />
                        ) : (
                            <div className="flex flex-col items-center gap-3 text-center">
                                <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                     style={{ backgroundColor: 'rgba(42,157,143,0.08)' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="#2A9D8F" className="w-8 h-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium text-navy">No image available</p>
                                <p className="text-xs text-slate-400">The receipt image will appear here after upload</p>
                                <button className="mt-1 text-xs font-medium px-4 py-2 rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-teal hover:text-teal transition-colors">
                                    Upload Image
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h2 className="text-sm font-semibold text-navy">Receipt Details</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {editable ? 'Review and correct the extracted data below.' : 'This receipt has been approved and is read-only.'}
                        </p>
                    </div>

                    <div className="flex-1 px-6 py-6 space-y-5">

                        <FieldRow label="Merchant Name">
                            {editable
                                ? <input className={inputClass} value={form.merchant} onChange={handleChange('merchant')} />
                                : <ReadOnlyValue value={form.merchant} />}
                        </FieldRow>

                        <div className="grid grid-cols-2 gap-4">
                            <FieldRow label="Date">
                                {editable
                                    ? <input type="date" className={inputClass} value={form.date} onChange={handleChange('date')} />
                                    : <ReadOnlyValue value={form.date} />}
                            </FieldRow>
                            <FieldRow label="Category">
                                {editable
                                    ? (
                                        <select className={inputClass} value={form.category} onChange={handleChange('category')}>
                                            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    )
                                    : <ReadOnlyValue value={form.category} />}
                            </FieldRow>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FieldRow label="Total Amount">
                                {editable
                                    ? (
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                            <input type="number" className={`${inputClass} pl-7`} value={form.amount} onChange={handleChange('amount')} />
                                        </div>
                                    )
                                    : <ReadOnlyValue value={Number(form.amount).toFixed(2)} prefix="$" />}
                            </FieldRow>
                            <FieldRow label="Tax Amount">
                                {editable
                                    ? (
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                            <input type="number" className={`${inputClass} pl-7`} value={form.tax} onChange={handleChange('tax')} />
                                        </div>
                                    )
                                    : <ReadOnlyValue value={Number(form.tax).toFixed(2)} prefix="$" />}
                            </FieldRow>
                        </div>

                        <FieldRow label="Currency">
                            {editable
                                ? (
                                    <select className={inputClass} value={form.currency} onChange={handleChange('currency')}>
                                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                )
                                : <ReadOnlyValue value={form.currency} />}
                        </FieldRow>

                        <div className="pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between py-3">
                                <span className="text-xs text-slate-400 font-medium">Net Amount</span>
                                <span className="text-base font-bold text-navy">
                                    ${(Number(form.amount) - Number(form.tax)).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-t border-slate-100">
                                <span className="text-xs text-slate-400 font-medium">Total incl. Tax</span>
                                <span className="text-lg font-bold text-navy">${Number(form.amount).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {editable && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-3">
                            <button
                                onClick={handleApprove}
                                className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-colors duration-150"
                                style={{ backgroundColor: '#2A9D8F' }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#238f82'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2A9D8F'}
                            >
                                Approve Receipt
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors duration-150"
                            >
                                {saved ? '✓ Saved' : 'Save Changes'}
                            </button>
                        </div>
                    )}

                    {!editable && (
                        <div className="px-6 py-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-xl px-4 py-3">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                                This receipt has been approved and added to your expense records.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
                     style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full space-y-5">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="#ef4444" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-navy">Delete this receipt?</h3>
                            <p className="text-sm text-slate-400 mt-1">This action cannot be undone. The receipt and all extracted data will be permanently removed.</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}