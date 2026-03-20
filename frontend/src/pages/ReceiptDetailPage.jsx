import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getReceiptById, updateReceipt, deleteReceipt } from '../api/receipts';
import { usePageData } from '../hooks/usePageData';

const CATEGORIES = [
    { id: 'Food', label: 'Food' },
    { id: 'Transport', label: 'Transport' },
    { id: 'Bills', label: 'Bills' },
    { id: 'Shopping', label: 'Shopping' },
    { id: 'Health', label: 'Health' },
    { id: 'Other', label: 'Other' }
];

const STATUS_STYLES = {
    APPROVED:      'bg-green-100 text-green-700',
    REVIEW_NEEDED: 'bg-orange-100 text-orange-700',
    PROCESSING:    'bg-amber-100 text-amber-700',
    UPLOADED:      'bg-blue-100 text-blue-700',
    FAILED:        'bg-red-100 text-red-700',
};

const FieldRow = ({ label, children }) => (
    <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
        {children}
    </div>
);

const ReadOnlyValue = ({ value, prefix }) => (
    <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-navy flex items-center min-h-[42px]">
        {prefix && <span className="text-slate-400 mr-1.5 font-bold">{prefix}</span>}
        {value || '-'}
    </div>
);

const inputClass = "w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-navy focus:ring-2 focus:ring-teal outline-none transition-all";

export default function ReceiptDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [form, setForm] = useState(null);
    const [originalData, setOriginalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [zoom, setZoom] = useState(0.5);
    const [isEditingMode, setIsEditingMode] = useState(false);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const data = await getReceiptById(id);
                setForm(data);
                setOriginalData(JSON.parse(JSON.stringify(data)));
            } catch (err) {
                setError('Could not load receipt details.');
            } finally {
                setLoading(false);
            }
        };
        fetchDetail();
    }, [id]);

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error || !form) return (
        <div className="p-10 text-center">
            <p className="text-red-500 font-medium">{error || 'Receipt not found'}</p>
            <button onClick={() => navigate('/receipts')} className="mt-4 text-teal font-semibold">Back to list</button>
        </div>
    );

    const isReviewNeeded = form.status !== 'APPROVED';
    const editable = isReviewNeeded || isEditingMode;

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleCancel = () => {
        setForm(JSON.parse(JSON.stringify(originalData)));
        setIsEditingMode(false);
    };

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            const payload = {
                merchant_name: form.merchant_name,
                receipt_date: form.receipt_date,
                total_amount: parseFloat(form.total_amount),
                tax_amount: parseFloat(form.tax_amount || 0),
                category: form.category,
                currency: form.currency || 'ILS'
            };
            await updateReceipt(id, payload);
            navigate('/receipts');
        } catch (err) {
            alert('Failed to approve receipt.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSaveChanges = async () => {
        setSubmitting(true);
        try {
            const payload = {
                merchant_name: form.merchant_name,
                receipt_date: form.receipt_date,
                total_amount: parseFloat(form.total_amount),
                tax_amount: parseFloat(form.tax_amount || 0),
                category: form.category,
                currency: form.currency || 'ILS'
            };
            const updated = await updateReceipt(id, payload);
            setForm(updated);
            setOriginalData(JSON.parse(JSON.stringify(updated)));
            setIsEditingMode(false);
        } catch (err) {
            alert('Failed to save changes.');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        try {
            await deleteReceipt(id);
            navigate('/receipts');
        } catch (err) { alert('Failed to delete receipt.'); }
    };

    const fullImageUrl = form.image_url || null;

    return (
        <div className="p-4 md:p-8 space-y-5 h-full flex flex-col">
            <div className="flex flex-wrap items-start justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => navigate('/receipts')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                        Back to Receipts
                    </button>
                    <div className="w-px h-4 bg-slate-200 hidden sm:block" />
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-lg font-bold text-navy">{form.merchant_name || 'Processing...'}</h1>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[form.status]}`}>
                                {form.status.replace(/_/g, ' ')}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">ID: {form.id.split('-')[0]}... · Uploaded {new Date(form.uploaded_at).toLocaleString()}</p>
                    </div>
                </div>
                <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                    Delete
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col h-full max-h-[calc(100vh-140px)]">
                    <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <h2 className="text-sm font-semibold text-navy">Receipt Image</h2>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold">−</button>
                            <span className="text-xs text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(z => Math.min(3, z + 0.25))} className="w-6 h-6 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold">+</button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-4 text-center bg-slate-50">
                        {fullImageUrl ? (
                            <img 
                                src={fullImageUrl} 
                                alt="Receipt" 
                                style={{ width: `${zoom * 100}%`, height: 'auto', transition: 'width 0.2s ease' }} 
                                className="inline-block rounded-lg shadow-md align-top" 
                            />
                        ) : (
                            <div className="text-center space-y-2 mt-20">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-teal/5 mx-auto">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="#2A9D8F" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                                </div>
                                <p className="text-xs font-medium text-navy">No image available</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-full max-h-[calc(100vh-140px)]">
                    <div className="px-5 py-3 border-b border-slate-100 shrink-0 flex justify-between items-start">
                        <div>
                            <h2 className="text-sm font-semibold text-navy">Receipt Details</h2>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                {isReviewNeeded ? 'Review and correct data before approval.' : isEditingMode ? 'Editing approved receipt.' : 'This receipt is approved and read-only.'}
                            </p>
                        </div>
                        {!isReviewNeeded && !isEditingMode && (
                            <button 
                                onClick={() => setIsEditingMode(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                Edit
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <FieldRow label="Merchant Name">
                                    {editable ? <input className={inputClass} value={form.merchant_name || ''} onChange={(e) => handleChange('merchant_name', e.target.value)} /> : <ReadOnlyValue value={form.merchant_name} />}
                                </FieldRow>
                            </div>
                            <div className="col-span-1">
                                <FieldRow label="Currency">
                                    {editable ? (
                                        <div className="flex bg-slate-100 border border-slate-100 rounded-xl p-1 h-[42px]">
                                            {['ILS', 'USD'].map(curr => (
                                                <button
                                                    key={curr}
                                                    type="button"
                                                    onClick={() => handleChange('currency', curr)}
                                                    className={`flex-1 flex items-center justify-center text-sm font-extrabold rounded-lg transition-colors ${
                                                        (form.currency || 'ILS') === curr 
                                                            ? 'bg-white text-teal shadow-sm' 
                                                            : 'text-slate-400 hover:bg-slate-200/50 hover:text-slate-600'
                                                    }`}
                                                >
                                                    {curr === 'USD' ? '$' : '₪'}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <ReadOnlyValue value={(form.currency || 'ILS') === 'USD' ? 'USD ($)' : 'ILS (₪)'} />
                                    )}
                                </FieldRow>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <FieldRow label="Date">
                                {editable ? <input type="date" className={inputClass} value={form.receipt_date || ''} onChange={(e) => handleChange('receipt_date', e.target.value)} /> : <ReadOnlyValue value={form.receipt_date} />}
                            </FieldRow>
                            <FieldRow label="Category">
                                {editable ? (
                                    <select className={inputClass} value={form.category} onChange={(e) => handleChange('category', e.target.value)}>
                                        {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                    </select>
                                ) : <ReadOnlyValue value={CATEGORIES.find(c => c.id === form.category)?.label || form.category} />}
                            </FieldRow>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <FieldRow label="Total Price">
                                {editable ? (
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-extrabold">
                                            {form.currency === 'USD' ? '$' : '₪'}
                                        </span>
                                        <input type="number" className={`${inputClass} pl-8`} value={form.total_amount || ''} onChange={(e) => handleChange('total_amount', e.target.value)} />
                                    </div>
                                ) : <ReadOnlyValue value={parseFloat(form.total_amount || 0).toFixed(2)} prefix={form.currency === 'USD' ? '$' : '₪'} />}
                            </FieldRow>
                            <FieldRow label="Tax Amount">
                                {editable ? (
                                    <div className="relative">
                                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-extrabold">
                                            {form.currency === 'USD' ? '$' : '₪'}
                                        </span>
                                        <input type="number" className={`${inputClass} pl-8`} value={form.tax_amount || ''} onChange={(e) => handleChange('tax_amount', e.target.value)} />
                                    </div>
                                ) : <ReadOnlyValue value={parseFloat(form.tax_amount || 0).toFixed(2)} prefix={form.currency === 'USD' ? '$' : '₪'} />}
                            </FieldRow>
                        </div>

                        <div className="pt-3 border-t border-slate-100 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Net Amount</span>
                                <span className="font-bold text-navy">
                                    {form.currency === 'USD' ? '$' : '₪'} {(parseFloat(form.total_amount || 0) - parseFloat(form.tax_amount || 0)).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400 font-semibold uppercase">Total incl. Tax</span>
                                <span className="text-xl font-bold text-navy">
                                    {form.currency === 'USD' ? '$' : '₪'} {parseFloat(form.total_amount || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {editable && (
                        <div className="px-5 py-3 border-t border-slate-100 flex gap-3 shrink-0 bg-white rounded-b-xl z-10">
                            {isReviewNeeded ? (
                                <button onClick={handleApprove} disabled={submitting} className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-teal hover:opacity-90 transition-all shadow-sm disabled:opacity-50">
                                    {submitting ? 'Approving...' : 'Approve Receipt'}
                                </button>
                            ) : (
                                <button onClick={handleSaveChanges} disabled={submitting} className="flex-1 py-2.5 text-sm font-bold rounded-xl text-white bg-teal hover:opacity-90 transition-all shadow-sm disabled:opacity-50">
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            )}
                            <button onClick={handleCancel} disabled={submitting} className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50">
                                Cancel Changes
                            </button>
                        </div>
                    )}

                    {!editable && (
                        <div className="px-5 py-3 border-t border-slate-100 shrink-0 bg-white rounded-b-xl">
                            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 rounded-lg px-4 py-2.5 font-medium">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                This receipt has been approved and added to your expense records.
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDeleteModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full space-y-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="#ef4444" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-navy">Delete this receipt?</h3>
                            <p className="text-xs text-slate-400 mt-1">This action cannot be undone.</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={confirmDelete} className="flex-1 py-2 text-xs font-semibold rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}