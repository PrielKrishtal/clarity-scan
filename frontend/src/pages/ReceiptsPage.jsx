import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getReceipts } from '../api/receipts';
import { usePageData } from '../hooks/usePageData';

const STATUS_STYLES = {
    APPROVED:      'bg-green-100 text-green-700',
    REVIEW_NEEDED: 'bg-orange-100 text-orange-700',
    PROCESSING:    'bg-amber-100 text-amber-700',
    UPLOADED:      'bg-blue-100 text-blue-700',
    FAILED:        'bg-red-100 text-red-700',
};

const CATEGORY_ICONS = {
    Food:      '🍔',
    Transport: '🚗',
    Bills:     '💡',
    Shopping:  '🛍️',
    Health:    '💊',
    Office:    '🖇️',
    Other:     '📦',
};

const STATUS_OPTIONS = ['All', 'APPROVED', 'REVIEW_NEEDED', 'PROCESSING', 'UPLOADED', 'FAILED'];
const PAGE_SIZE = 8;

const exportToCSV = (data) => {
    const headers = ['Merchant', 'Date', 'Category', 'Price'];
    const rows = data.map(r => [
        `"${(r.merchant_name || '').replace(/"/g, '""')}"`,
        `"${r.receipt_date || ''}"`,
        `"${r.category || ''}"`,
        parseFloat(r.total_amount || 0).toFixed(2),
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const encoded = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const a = document.createElement('a');
    a.setAttribute('href', encoded);
    a.setAttribute('download', 'receipts.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

export default function ReceiptsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [receipts, setReceipts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);
    // ── CHANGE 2: date range state
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo]     = useState('');

    const fetchReceipts = async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);
            
            setError(null);
            const data = await getReceipts();
            setReceipts(data);
        } catch (err) {
            setError('Could not load receipts. Please try again later.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReceipts();
    }, [location.key]);

  
    const filtered = useMemo(() => {
        return receipts.filter(r => {
            const matchSearch = r.merchant_name?.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === 'All' || r.status === statusFilter;
            const matchFrom   = !dateFrom || r.receipt_date >= dateFrom;
            const matchTo     = !dateTo   || r.receipt_date <= dateTo;
            return matchSearch && matchStatus && matchFrom && matchTo;
        });
    }, [receipts, search, statusFilter, dateFrom, dateTo]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const hasFilters = search !== '' || statusFilter !== 'All';

    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    if (loading && !refreshing) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-teal border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error && receipts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4 px-6 text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="#EF4444" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                    </svg>
                </div>
                <p className="text-slate-600 font-medium">{error}</p>
                <button 
                    onClick={() => fetchReceipts(true)}
                    className="px-6 py-2.5 bg-teal text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-opacity-90 transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (receipts.length === 0 && !loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] px-6 text-center">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
                     style={{ backgroundColor: 'rgba(42,157,143,0.1)' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="#2A9D8F" className="w-10 h-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-navy mb-2">Start your journey</h2>
                <p className="text-slate-400 max-w-sm mb-8">
                    Your receipt gallery is empty. Upload your first receipt to see the magic of AI OCR in action.
                </p>
            </div>
        );
    }

    return (
        <div className="p-8 md:p-10 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Receipts</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        {filtered.length < receipts.length
                            ? `${filtered.length} of ${receipts.length} receipts`
                            : `${receipts.length} receipts total`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchReceipts(true)}
                        disabled={refreshing}
                        className="p-2 flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 hover:text-teal hover:border-teal transition-all duration-150 disabled:opacity-50 shadow-sm"
                        title="Refresh list"
                    >
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            className={`w-5 h-5 ${refreshing ? 'animate-spin text-teal' : ''}`}
                        >
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                            <path d="M21 3v5h-5" />
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                            <path d="M3 21v-5h5" />
                        </svg>
                    </button>
                    <button
                        onClick={() => exportToCSV(filtered)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors duration-150"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Export CSV
                    </button>

                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => { setDateFrom(e.target.value); setPage(1); }}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-teal outline-none transition-all"
                        title="From date"
                    />
                    <span className="text-slate-400 text-sm">→</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => { setDateTo(e.target.value); setPage(1); }}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-teal outline-none transition-all"
                        title="To date"
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor"
                         className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by merchant..."
                        value={search}
                        onChange={handleFilterChange(setSearch)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={handleFilterChange(setStatusFilter)}
                    className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:ring-2 focus:ring-teal focus:border-teal outline-none transition-all cursor-pointer"
                >
                    {STATUS_OPTIONS.map(s => (
                        <option key={s} value={s}>
                            {s === 'All' ? 'All Statuses' : s.replace(/_/g, ' ')}
                        </option>
                    ))}
                </select>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden relative">
                {refreshing && (
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Merchant</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Category</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Price</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-slate-400 text-sm">
                                        No receipts match your current filters.
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((receipt) => (
                                    <tr
                                        key={receipt.id}
                                        className="hover:bg-slate-50 transition-colors duration-100 cursor-pointer"
                                        onClick={() => navigate(`/receipts/${receipt.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-semibold text-navy">{receipt.merchant_name || 'Processing...'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-400">{receipt.receipt_date || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="flex items-center gap-2 text-sm text-slate-600">
                                                <span>{CATEGORY_ICONS[receipt.category] || '📦'}</span>
                                                {receipt.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[receipt.status]}`}>
                                                {receipt.status.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <p className="text-sm font-bold text-navy">${parseFloat(receipt.total_amount || 0).toFixed(2)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/receipts/${receipt.id}`); }}
                                                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-teal hover:text-teal transition-colors duration-150"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {filtered.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs text-slate-400">
                            Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} receipts
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                <button
                                    key={n}
                                    onClick={() => setPage(n)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                                        page === n ? 'text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                    style={page === n ? { backgroundColor: '#0F2D4A' } : {}}
                                >
                                    {n}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}