import { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { usePageData } from '../hooks/usePageData';

const MOCK_MONTHLY_EXPENSES = [
    { month: 'Oct', total: 1240 },
    { month: 'Nov', total: 980 },
    { month: 'Dec', total: 1875 },
    { month: 'Jan', total: 1102 },
    { month: 'Feb', total: 1430 },
    { month: 'Mar', total: 860 },
];

const MOCK_CATEGORY_DATA = [
    { name: 'Food', value: 420 },
    { name: 'Transport', value: 210 },
    { name: 'Bills', value: 380 },
    { name: 'Shopping', value: 290 },
    { name: 'Other', value: 150 },
];

const MOCK_RECENT_RECEIPTS = [
    { id: 1, merchant: 'Superpharm', amount: 84.50, date: '2026-03-08', status: 'APPROVED' },
    { id: 2, merchant: 'Yellow', amount: 32.00, date: '2026-03-07', status: 'REVIEW_NEEDED' },
    { id: 3, merchant: 'Shufersal', amount: 215.30, date: '2026-03-06', status: 'APPROVED' },
    { id: 4, merchant: 'HOT Mobile', amount: 129.00, date: '2026-03-05', status: 'PROCESSING' },
    { id: 5, merchant: 'IKEA', amount: 543.00, date: '2026-03-04', status: 'APPROVED' },
];

const MONTHLY_BUDGET = { spent: 860, limit: 1200 };

const PIE_COLORS = ['#0F2D4A', '#2A9D8F', '#F59E0B', '#EF4444', '#6366F1'];

const STATUS_STYLES = {
    APPROVED:      'bg-green-100 text-green-700',
    REVIEW_NEEDED: 'bg-orange-100 text-orange-700',
    PROCESSING:    'bg-amber-100 text-amber-700',
    UPLOADED:      'bg-blue-100 text-blue-700',
    FAILED:        'bg-red-100 text-red-700',
};

const getTodayString = () =>
    new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const getTotalSpent = () =>
    MOCK_MONTHLY_EXPENSES.reduce((sum, m) => sum + m.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg px-4 py-2 shadow-lg">
                <p className="text-xs text-slate-400 mb-1">{label}</p>
                <p className="text-sm font-bold text-navy">${payload[0].value.toLocaleString('en-US')}</p>
            </div>
        );
    }
    return null;
};

const BudgetBar = ({ spent, limit }) => {
    const pct = Math.min((spent / limit) * 100, 100);
    const barColor = pct < 70 ? '#2A9D8F' : pct < 90 ? '#F59E0B' : '#EF4444';
    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400">Monthly Budget</span>
                <span className="text-xs font-semibold text-navy">
                    ${spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    <span className="text-slate-400 font-normal"> / ${limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{(100 - pct).toFixed(0)}% remaining this month</p>
        </div>
    );
};

const DropZone = () => {
    const [isDragging, setIsDragging] = useState(false);
    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
            className={`rounded-xl border-2 border-dashed py-6 px-8 flex items-center gap-6 cursor-pointer transition-all duration-200 ${
                isDragging
                    ? 'border-teal bg-teal/5'
                    : 'border-slate-200 hover:border-teal/40 hover:bg-white'
            }`}
        >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                 style={{ backgroundColor: 'rgba(42,157,143,0.1)', color: '#2A9D8F' }}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                </svg>
            </div>
            <div>
                <p className="text-sm font-semibold text-navy">Drop a receipt to auto-scan</p>
                <p className="text-xs text-slate-400 mt-0.5">Drag & drop a JPG or PNG — OCR runs automatically</p>
            </div>
            <div className="ml-auto">
                <span className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 bg-white hover:bg-slate-50 transition-colors">
                    Or browse files
                </span>
            </div>
        </div>
    );
};

export default function DashboardPage() {
    const summaryCards = [
        {
            label: 'Total Receipts',
            value: MOCK_RECENT_RECEIPTS.length.toString(),
            sub: 'All time',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
            ),
        },
        {
            label: 'This Month',
            value: `$${MONTHLY_BUDGET.spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            sub: 'March 2026',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                </svg>
            ),
        },
        {
            label: 'Pending Review',
            value: '2',
            sub: 'Needs attention',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="p-8 md:p-10 space-y-8">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Dashboard</h1>
                    <p className="text-sm text-slate-400 mt-1">{getTodayString()}</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-400 mb-0.5">Total tracked</p>
                    <p className="text-xl font-bold text-navy">${getTotalSpent()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {summaryCards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-4 hover:shadow-md transition-shadow duration-200"
                    >
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                             style={{ backgroundColor: 'rgba(42,157,143,0.1)', color: '#2A9D8F' }}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">{card.label}</p>
                            <p className="text-2xl font-bold text-navy leading-tight mt-0.5">{card.value}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{card.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <DropZone />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-7">
                    <h2 className="text-sm font-semibold text-navy mb-1">Monthly Expenses</h2>
                    <p className="text-xs text-slate-400 mb-6">Last 6 months — approved receipts only</p>
                    <ResponsiveContainer width="100%" height={230}>
                        <BarChart data={MOCK_MONTHLY_EXPENSES} barSize={30}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(42,157,143,0.06)' }} />
                            <Bar dataKey="total" fill="#0F2D4A" radius={[5, 5, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-6 pt-5 border-t border-slate-100">
                        <BudgetBar spent={MONTHLY_BUDGET.spent} limit={MONTHLY_BUDGET.limit} />
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-7">
                    <h2 className="text-sm font-semibold text-navy mb-1">By Category</h2>
                    <p className="text-xs text-slate-400 mb-4">Current month breakdown</p>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie
                                data={MOCK_CATEGORY_DATA}
                                cx="50%"
                                cy="44%"
                                innerRadius={52}
                                outerRadius={78}
                                paddingAngle={3}
                                dataKey="value"
                            >
                                {MOCK_CATEGORY_DATA.map((_, index) => (
                                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                            <Tooltip formatter={(value) => [`$${value.toLocaleString('en-US')}`, '']} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200">
                <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-navy">Recent Receipts</h2>
                    <a href="/receipts" className="text-xs font-medium transition-colors" style={{ color: '#2A9D8F' }}>
                        View all →
                    </a>
                </div>
                <div className="divide-y divide-slate-100">
                    {MOCK_RECENT_RECEIPTS.map((receipt) => (
                        <div key={receipt.id} className="px-7 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                            <div>
                                <p className="text-sm font-medium text-navy">{receipt.merchant}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{receipt.date}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLES[receipt.status]}`}>
                                    {receipt.status.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm font-semibold text-navy w-16 text-right">${receipt.amount.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}