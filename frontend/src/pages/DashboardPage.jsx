import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

import { useAuth } from '../context/AuthContext';
import { updateBudget } from '../api/users';
// IMPORTANT: Update your API imports to include the new summary endpoint
import { getDashboardSummary } from '../api/receipts'; 
import { FINANCIAL_TIPS } from '../data/financialTips';

const PIE_COLORS = ['#0F2D4A', '#2A9D8F', '#F59E0B', '#EF4444', '#6366F1'];
const BUDGET_PRESETS = [500, 1000, 2000, 5000];
const CATEGORY_ICONS = { Food: '🍔', Transport: '🚗', Bills: '💡', Shopping: '🛍️', Health: '💊', Other: '📦' };

const getCurrentMonth = () => new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
const getTodayString = () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const CustomTooltip = ({ active, payload, label, currSymbol }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-lg">
                <p className="text-xs text-slate-400 mb-0.5">{label}</p>
                <p className="text-sm font-bold text-navy">{currSymbol}{payload[0].value.toLocaleString('en-US')}</p>
            </div>
        );
    }
    return null;
};

const TipCard = () => {
    const tip = FINANCIAL_TIPS[new Date().getDate() % FINANCIAL_TIPS.length];
    return (
        <div className="bg-white rounded-2xl border border-slate-200 px-8 py-5 flex flex-col items-center text-center gap-2">
            <div className="text-2xl">💡</div>
            <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-navy">Financial Tip of the Day</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: 'rgba(42,157,143,0.1)', color: '#2A9D8F' }}>
                    {tip.tag}
                </span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">{tip.tip}</p>
        </div>
    );
};

const BudgetSetupCard = ({ onSave, currSymbol }) => {
    const [selected, setSelected] = useState(null);
    const [custom, setCustom] = useState('');
    const effectiveValue = custom !== '' ? custom : selected;

    const handleSave = () => {
        const val = parseFloat(effectiveValue);
        if (!val || val <= 0) return;
        onSave(val);
    };

    return (
        <div className="bg-white rounded-2xl border-2 px-5 py-4" style={{ borderColor: 'rgba(42,157,143,0.3)' }}>
            <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                     style={{ backgroundColor: 'rgba(42,157,143,0.1)', color: '#2A9D8F' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                    </svg>
                </div>
                <div>
                    <p className="text-sm font-semibold text-navy">Set your budget for {getCurrentMonth()}</p>
                    <p className="text-xs text-slate-400">Pick a preset or enter a custom amount</p>
                </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
                {BUDGET_PRESETS.map(p => (
                    <button
                        key={p}
                        onClick={() => { setSelected(p); setCustom(''); }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                            selected === p && custom === ''
                                ? 'border-teal text-teal bg-teal/5'
                                : 'border-slate-200 text-slate-600 hover:border-teal/40'
                        }`}
                    >
                        {currSymbol}{p.toLocaleString()}
                    </button>
                ))}
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">{currSymbol}</span>
                    <input
                        type="number"
                        placeholder="Custom"
                        value={custom}
                        onChange={e => { setCustom(e.target.value); setSelected(null); }}
                        className="pl-6 pr-3 py-1.5 w-24 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-teal outline-none transition-all"
                    />
                </div>
                <button
                    onClick={handleSave}
                    disabled={!effectiveValue}
                    className="ml-auto px-5 py-1.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
                    style={{ backgroundColor: '#2A9D8F' }}
                >
                    Save
                </button>
            </div>
        </div>
    );
};

const BudgetBarRow = ({ spent, limit, onEdit, currSymbol }) => {
    const pct = Math.min((spent / limit) * 100, 100);
    const barColor = pct < 70 ? '#2A9D8F' : pct < 90 ? '#F59E0B' : '#EF4444';
    return (
        <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3">
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-slate-400 font-medium">Budget for {getCurrentMonth()}</span>
                        <span className="text-xs font-semibold text-navy">
                            {currSymbol}{spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            <span className="text-slate-400 font-normal"> / {currSymbol}{limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{(100 - pct).toFixed(0)}% remaining this month</p>
                </div>
                <button
                    onClick={onEdit}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-teal hover:border-teal transition-all shrink-0"
                    title="Edit budget"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default function DashboardPage() {
    const { user } = useAuth();
    const { refreshTrigger } = useOutletContext() || {};
    

    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState('ILS');
    const [ilsMonthlySpent, setIlsMonthlySpent] = useState(0);

    const [budgetLimit, setBudgetLimit] = useState(user?.monthly_budget ? parseFloat(user.monthly_budget) : null);
    const [budgetSaved, setBudgetSaved] = useState(!!user?.monthly_budget);

    const currSymbol = currency === 'ILS' ? '₪' : '$';

    const handleBudgetSave = async (val) => {
        await updateBudget(val);
        setBudgetLimit(val);
        setBudgetSaved(true);
    };

    useEffect(() => {
        if (user?.monthly_budget) {
            setBudgetLimit(parseFloat(user.monthly_budget));
            setBudgetSaved(true);
        }
    }, [user?.monthly_budget]);
    
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await getDashboardSummary(currency);
                setSummaryData(data);
                // Always keep ILS spent for accurate budget % regardless of display currency
                if (currency !== 'ILS') {
                    const ilsData = await getDashboardSummary('ILS');
                    setIlsMonthlySpent(ilsData?.this_month_spent || 0);
                } else {
                    setIlsMonthlySpent(data?.this_month_spent || 0);
                }
            } catch (error) {
                console.error('Failed to load dashboard summary', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [refreshTrigger, currency]);

    // Data Mapping from Backend Schema
    const monthlySpent = summaryData?.this_month_spent || 0;
    // Derive exchange rate from the two fetches to convert budget limit into display currency
    const exchangeRate = (currency !== 'ILS' && ilsMonthlySpent > 0 && monthlySpent > 0)
        ? monthlySpent / ilsMonthlySpent
        : 1;
    const displayBudgetLimit = budgetLimit ? parseFloat((budgetLimit * exchangeRate).toFixed(2)) : null;
    const lastMonthSpent = summaryData?.last_month_spent || 0;
    const totalTracked = summaryData?.total_tracked || 0;
    const totalReceipts = summaryData?.total_receipts || 0;
    const pendingReview = summaryData?.pending_review_count || 0;
    const approvedThisMonth = summaryData?.approved_this_month_count || 0;
    const avgReceipt = summaryData?.avg_receipt_amount || 0;
    
    // Recharts expects an array sorted by value for the Pie chart to look best
    const categoryData = [...(summaryData?.category_breakdown || [])].sort((a, b) => b.value - a.value);
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoPrefix = sixMonthsAgo.toISOString().slice(0, 7);
    const monthlyChartData = (summaryData?.monthly_chart_data || []).filter(m => m.month >= sixMonthsAgoPrefix);
    
    const biggestReceipt = summaryData?.biggest_receipt_merchant ? {
        merchant_name: summaryData.biggest_receipt_merchant,
        total_amount: summaryData.biggest_receipt_amount,
        receipt_date: summaryData.biggest_receipt_date
    } : null;

    // Client-side MoM (Month over Month) calculation based on server-provided sums
    const momDiff = monthlySpent - lastMonthSpent;
    const momPct = lastMonthSpent > 0 ? Math.abs((momDiff / lastMonthSpent) * 100).toFixed(0) : null;
    const momDown = momDiff < 0;

    const prevMonthName = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    const topCategory = categoryData.length > 0 ? categoryData[0] : null;
    const topCategoryPct = topCategory && budgetLimit
        ? ((topCategory.value / budgetLimit) * 100).toFixed(0)
        : '—';
    const hasChartData = monthlyChartData.some(m => m.total > 0);

    const summaryCards = [
        {
            label: 'Total Receipts',
            value: loading ? '—' : totalReceipts.toString(),
            sub: 'All time',
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
        },
        {
            label: 'This Month',
            value: loading ? '—' : `${currSymbol}${monthlySpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            sub: getCurrentMonth(),
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>,
        },
        {
            label: 'Pending Review',
            value: loading ? '—' : pendingReview.toString(),
            sub: 'Needs attention',
            icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>,
        },
    ];

    return (
        <div className="p-5 md:p-6 space-y-4">

            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Overview</h1>
                    <p className="text-sm text-slate-400 mt-0.5">{getTodayString()}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 sm:gap-6">
                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                        <button 
                            onClick={() => setCurrency('ILS')} 
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${currency === 'ILS' ? 'bg-white shadow text-navy' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            ILS (₪)
                        </button>
                        <button 
                            onClick={() => setCurrency('USD')} 
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${currency === 'USD' ? 'bg-white shadow text-navy' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            USD ($)
                        </button>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 mb-0.5">Total tracked</p>
                        <p className="text-xl font-bold text-navy">
                            {loading ? '—' : `${currSymbol}${totalTracked.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {summaryCards.map((card) => (
                    <div key={card.label} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 hover:shadow-md transition-shadow duration-200">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                             style={{ backgroundColor: 'rgba(42,157,143,0.1)', color: '#2A9D8F' }}>
                            {card.icon}
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">{card.label}</p>
                            <p className="text-xl font-bold text-navy leading-tight mt-0.5">{card.value}</p>
                            <p className="text-xs text-slate-400">{card.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {budgetSaved && budgetLimit ? (
                <BudgetBarRow spent={monthlySpent} limit={displayBudgetLimit} onEdit={() => setBudgetSaved(false)} currSymbol={currSymbol} />
            ) : (
                <BudgetSetupCard onSave={handleBudgetSave} currSymbol={'₪'} />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-4">
                    <h2 className="text-sm font-semibold text-navy mb-0.5">Monthly Expenses</h2>
                    <p className="text-xs text-slate-400 mb-3">Last 6 months — approved receipts only</p>
                    {hasChartData ? (
                        <ResponsiveContainer width="100%" height={175}>
                            <BarChart data={monthlyChartData} barSize={26}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currSymbol}${v}`} />
                                <Tooltip content={<CustomTooltip currSymbol={currSymbol} />} cursor={{ fill: 'rgba(42,157,143,0.06)' }} />
                                <Bar dataKey="total" fill="#0F2D4A" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-44 flex items-center justify-center">
                            <p className="text-sm text-slate-400 text-center">Upload your first receipts to see<br />your spending history here</p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <h2 className="text-sm font-semibold text-navy mb-0.5">By Category</h2>
                    <p className="text-xs text-slate-400 mb-1">Current month breakdown</p>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="42%" innerRadius={52} outerRadius={80} paddingAngle={categoryData.length > 1 ? 3 : 0} dataKey="value" stroke="none">
                                    {categoryData.map((_, index) => (
                                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
                                <Tooltip formatter={(value) => `${currSymbol}${value.toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-52 flex items-center justify-center">
                            <p className="text-sm text-slate-400 text-center">No approved receipts<br />this month yet</p>
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h2 className="text-sm font-semibold text-navy mb-2">Insights</h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

                    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-start gap-2.5">
                        <div className="text-xl mt-0.5">{topCategory ? (CATEGORY_ICONS[topCategory.name] || '📦') : '📦'}</div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Top Category</p>
                            {topCategory ? (
                                <>
                                    <p className="text-sm font-bold text-navy mt-0.5">{topCategory.name}</p>
                                    <p className="text-xs text-slate-400">{currSymbol}{topCategory.value.toLocaleString('en-US', { minimumFractionDigits: 2 })} · {topCategoryPct}% of budget</p>
                                </>
                            ) : (
                                <p className="text-xs text-slate-300 mt-1">Upload receipts for a full breakdown</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                             style={{ backgroundColor: 'rgba(239,68,68,0.08)', color: '#EF4444' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Biggest Receipt</p>
                            {biggestReceipt ? (
                                <>
                                    <p className="text-sm font-bold text-navy mt-0.5">{biggestReceipt.merchant_name}</p>
                                    <p className="text-xs text-slate-400">{currSymbol}{parseFloat(biggestReceipt.total_amount).toFixed(2)} · {biggestReceipt.receipt_date}</p>
                                </>
                            ) : (
                                <p className="text-xs text-slate-300 mt-1">Your largest purchase will show here</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                             style={{ backgroundColor: 'rgba(42,157,143,0.1)', color: '#2A9D8F' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">Avg. Receipt</p>
                            {approvedThisMonth > 0 ? (
                                <>
                                    <p className="text-sm font-bold text-navy mt-0.5">{currSymbol}{avgReceipt.toFixed(2)}</p>
                                    <p className="text-xs text-slate-400">Across {approvedThisMonth} approved</p>
                                </>
                            ) : (
                                <p className="text-xs text-slate-300 mt-1">Approve receipts to see your average</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                             style={{ backgroundColor: momDown ? 'rgba(42,157,143,0.1)' : 'rgba(245,158,11,0.08)', color: momDown ? '#2A9D8F' : '#F59E0B' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="w-4 h-4">
                                {momDown
                                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                                }
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium">vs Last Month</p>
                            {momPct !== null ? (
                                <>
                                    <p className="text-sm font-bold mt-0.5" style={{ color: momDown ? '#2A9D8F' : '#F59E0B' }}>
                                        {momDown ? '↓' : '↑'} {momPct}%
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {currSymbol}{Math.abs(momDiff).toFixed(2)} {momDown ? 'less' : 'more'} than {prevMonthName}
                                    </p>
                                </>
                            ) : (
                                <p className="text-xs text-slate-300 mt-1">Not enough data yet to compare</p>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            <TipCard />

        </div>
    );
}