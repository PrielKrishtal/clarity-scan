import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const MOCK_RECEIPTS = [
    { id: 1,  merchant: 'Superpharm',     date: '2026-03-08', category: 'Health',     amount: 84.50,  status: 'APPROVED' },
    { id: 2,  merchant: 'Yellow',          date: '2026-03-07', category: 'Transport',  amount: 32.00,  status: 'REVIEW_NEEDED' },
    { id: 3,  merchant: 'Shufersal',       date: '2026-03-06', category: 'Food',       amount: 215.30, status: 'APPROVED' },
    { id: 4,  merchant: 'HOT Mobile',      date: '2026-03-05', category: 'Bills',      amount: 129.00, status: 'PROCESSING' },
    { id: 5,  merchant: 'IKEA',            date: '2026-03-04', category: 'Shopping',   amount: 543.00, status: 'APPROVED' },
    { id: 6,  merchant: 'Amazon',          date: '2026-03-03', category: 'Shopping',   amount: 97.40,  status: 'APPROVED' },
    { id: 7,  merchant: 'Cafe Aroma',      date: '2026-03-02', category: 'Food',       amount: 28.50,  status: 'FAILED' },
    { id: 8,  merchant: 'Paz Gas Station', date: '2026-03-01', category: 'Transport',  amount: 180.00, status: 'APPROVED' },
    { id: 9,  merchant: 'Netflix',         date: '2026-02-28', category: 'Bills',      amount: 49.90,  status: 'UPLOADED' },
    { id: 10, merchant: 'Office Depot',    date: '2026-02-27', category: 'Office',     amount: 312.75, status: 'REVIEW_NEEDED' },
    { id: 11, merchant: 'Rami Levy',       date: '2026-02-26', category: 'Food',       amount: 178.60, status: 'APPROVED' },
    { id: 12, merchant: 'Spotify',         date: '2026-02-25', category: 'Bills',      amount: 19.90,  status: 'APPROVED' },
];

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
    const headers = ['Merchant', 'Date', 'Category', 'Amount', 'Status'];
    const rows = data.map(r => [r.merchant, r.date, r.category, r.amount.toFixed(2), r.status]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'receipts.csv';
    a.click();
    URL.revokeObjectURL(url);
};

const EmptyState = ({ hasFilters }) => (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
             style={{ backgroundColor: 'rgba(42,157,143,0.1)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.4} stroke="#2A9D8F" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
        </div>
        <p className="text-base font-semibold text-navy mb-1">
            {hasFilters ? 'No receipts match your filters' : 'No receipts yet'}
        </p>
        <p className="text-sm text-slate-400 max-w-xs">
            {hasFilters
                ? 'Try adjusting your search or status filter to find what you\'re looking for.'
                : 'Upload your first receipt to get started. OCR will extract the data automatically.'}
        </p>
    </div>
);

export default function ReceiptsPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        return MOCK_RECEIPTS.filter(r => {
            const matchSearch = r.merchant.toLowerCase().includes(search.toLowerCase());
            const matchStatus = statusFilter === 'All' || r.status === statusFilter;
            return matchSearch && matchStatus;
        });
    }, [search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const hasFilters = search !== '' || statusFilter !== 'All';

    const handleFilterChange = (setter) => (e) => {
        setter(e.target.value);
        setPage(1);
    };

    return (
        <div className="p-8 md:p-10 space-y-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Receipts</h1>
                    <p className="text-sm text-slate-400 mt-1">{MOCK_RECEIPTS.length} receipts total</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => exportToCSV(filtered)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors duration-150"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                        </svg>
                        Export CSV
                    </button>
                    <button
                        onClick={() => navigate('/upload')}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white transition-colors duration-150"
                        style={{ backgroundColor: '#2A9D8F' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#238f82'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#2A9D8F'}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                        </svg>
                        Upload Receipt
                    </button>
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

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Merchant</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Category</th>
                                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Status</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Amount</th>
                                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wide">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState hasFilters={hasFilters} />
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
                                            <p className="text-sm font-semibold text-navy">{receipt.merchant}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-400">{receipt.date}</p>
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
                                            <p className="text-sm font-bold text-navy">${receipt.amount.toFixed(2)}</p>
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
                                        page === n
                                            ? 'text-white'
                                            : 'border border-slate-200 text-slate-500 hover:bg-slate-50'
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