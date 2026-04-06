import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  TrendingUp,
  Wallet,
  TrendingDown,
  PiggyBank,
  LayoutDashboard,
  Table2,
  Lightbulb,
  Shield,
  User,
  Moon,
  Sun,
  Menu,
  X,
  Pencil,
  Trash2,
  ChevronDown,
  Search,
  CheckCircle,
  ArrowUpDown
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const CATEGORIES = ["Food", "Transport", "Shopping", "Salary", "Utilities"];
const TYPES = ["Income", "Expense"];
const STORAGE_KEY = "transactions_v1";
const SETTINGS_KEY = "finance_app_settings_v1";
const ACTIVE_TAB_KEY = "finance_active_tab_v1";
const INR_PER_USD = 83;

const DEMO_TRANSACTIONS = [
  { id: 1, date: "2024-06-10", description: "Grocery", category: "Food", type: "Expense", amount: 800 },
  { id: 2, date: "2024-06-11", description: "Salary", category: "Salary", type: "Income", amount: 25000 },
  { id: 3, date: "2024-06-12", description: "Bus Pass", category: "Transport", type: "Expense", amount: 1600 },
];

const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f97316", "#10b981"];

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "transactions", label: "Transactions", icon: Table2 },
  { id: "insights", label: "Insights", icon: Lightbulb },
];

function loadTransactions() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    if (json) {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) return parsed;
    }
    return DEMO_TRANSACTIONS;
  } catch {
    return DEMO_TRANSACTIONS;
  }
}

function loadSettings() {
  try {
    const json = localStorage.getItem(SETTINGS_KEY);
    if (json) {
      const parsed = JSON.parse(json);
      return {
        currency: parsed.currency === "USD" ? "USD" : "INR",
        role: parsed.role === "viewer" ? "viewer" : "admin",
        theme: parsed.theme === "light" ? "light" : "dark",
      };
    }
  } catch {
    /* ignore */
  }
  return { currency: "INR", role: "admin", theme: "dark" };
}

function loadActiveTab() {
  try {
    const v = localStorage.getItem(ACTIVE_TAB_KEY);
    if (v === "dashboard" || v === "transactions" || v === "insights") return v;
  } catch {
    /* ignore */
  }
  return "dashboard";
}

function monthKey(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatDisplayAmount(amountInr, currency) {
  if (currency === "USD") {
    const usd = amountInr / INR_PER_USD;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(usd);
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amountInr);
}

function formatIndianSummaryInr(amountInr) {
  const n = Number(amountInr);
  const sign = n < 0 ? "−" : "";
  const v = Math.abs(n);
  if (v >= 1e7) return `${sign}₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `${sign}₹${(v / 1e5).toFixed(1)} L`;
  if (v >= 1e3) return `${sign}₹${(v / 1e3).toFixed(1)}K`;
  return `${sign}₹${v.toLocaleString("en-IN")}`;
}

function formatSummaryCardAmount(amountInr, currency) {
  if (currency === "USD") {
    const usd = amountInr / INR_PER_USD;
    const sign = usd < 0 ? "−" : "";
    const v = Math.abs(usd);
    if (v >= 1e6) return `${sign}$${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return `${sign}$${(v / 1e3).toFixed(1)}K`;
    return `${sign}$${v.toFixed(0)}`;
  }
  return formatIndianSummaryInr(amountInr);
}

function escapeCsvCell(value) {
  const s = String(value ?? "");
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportToCSV(transactions) {
  if (!transactions.length) {
    alert("No transactions to export.");
    return;
  }
  const headers = ["Date", "Description", "Category", "Type", "Amount"];
  const rows = transactions.map((t) => [
    t.date,
    t.description,
    t.category,
    t.type,
    t.amount,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildInsights({
  transactions,
  income,
  expense,
  expenseByCategory,
  monthlyBudget,
  formatMoney,
  currency
}) {
  if (!transactions.length) {
    return [
      "Add your first transaction to unlock personalized insights tailored to your spending.",
    ];
  }
  const lines = [];
  
  const top = expenseByCategory.reduce(
    (best, cur) => (cur.value > (best?.value ?? 0) ? cur : best),
    null
  );
  if (top && top.value > 0) {
    lines.push(
      `You spent the most on ${top.name} (${currency === 'INR' ? '₹' : '$'}${Number(currency === 'USD' ? top.value / INR_PER_USD : top.value).toLocaleString(currency === 'USD' ? 'en-US' : 'en-IN', {maximumFractionDigits: 0})}).`
    );
  }

  if (expense > monthlyBudget) {
    lines.push("⚠️ Budget exceeded: You have spent over your monthly cap.");
  } else if (expense > income && income > 0) {
    lines.push("⚠️ Deficit alert: Your expenses are currently higher than your income.");
  } else if (expense < monthlyBudget && expense < income) {
    lines.push("🎉 Great job! You are staying under budget and saving money this month.");
  }

  if (!lines.length) {
    lines.push("Keep logging transactions to see richer insights here.");
  }
  return lines;
}

function CardShell({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-sm backdrop-blur-xl transition dark:border-white/5 dark:bg-[#111827]/80 ${className}`}
    >
      {children}
    </div>
  );
}

function SummaryCard({ title, valueInr, currency, accent, icon: Icon }) {
  const accentClass =
    accent === "green"
      ? "text-green-500"
      : accent === "red"
        ? "text-red-500"
        : accent === "violet"
          ? "text-violet-500 dark:text-violet-400"
          : "text-gray-900 dark:text-white";
  const valueStr = formatSummaryCardAmount(valueInr, currency);
  return (
    <CardShell className="transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-indigo-500/10">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${accentClass}`}>
            {valueStr}
          </p>
        </div>
        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              accent === "green"
                ? "bg-green-500/10 text-green-500"
                : accent === "red"
                  ? "bg-red-500/10 text-red-500"
                  : accent === "violet"
                    ? "bg-violet-500/10 text-violet-500"
                    : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
            }`}
          >
            <Icon className="h-5 w-5" strokeWidth={2} />
          </div>
        )}
      </div>
    </CardShell>
  );
}

function PremiumChartTooltip({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/95 p-3 text-white shadow-2xl backdrop-blur-md">
      {label != null && label !== "" && (
        <p className="mb-2 border-b border-gray-700 pb-2 text-xs font-medium text-gray-300">
          {label}
        </p>
      )}
      <ul className="space-y-1.5">
        {payload.map((p, i) => (
          <li key={i} className="flex items-center justify-between gap-6 text-sm">
            <span className="text-gray-400">{p.name}</span>
            <span className="font-semibold tabular-nums text-white">
              {formatDisplayAmount(Number(p.value), currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function headerGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning! 👋";
  if (h < 17) return "Good afternoon! 👋";
  return "Good evening! 👋";
}

const COLOR_SCHEME = "[color-scheme:light] dark:[color-scheme:dark]";
const SELECT_CLASSES = `min-w-0 cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-white/5 dark:bg-[#111827] dark:text-white ${COLOR_SCHEME} [&_option]:bg-white [&_option]:text-gray-900 dark:[&_option]:bg-[#111827] dark:[&_option]:text-white`;
const SELECT_CLASSES_WIDE = `${SELECT_CLASSES} pr-8`;
const FORM_INPUT = `w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-white/5 dark:bg-[#111827] dark:text-white dark:placeholder:text-gray-500 ${COLOR_SCHEME}`;

export default function App() {
  const [transactions, setTransactions] = useState(loadTransactions);
  const [settings, setSettings] = useState(loadSettings);
  const [activeTab, setActiveTab] = useState(loadActiveTab);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [monthlyBudget, setMonthlyBudget] = useState(() => Number(localStorage.getItem('monthlyBudget')) || 40000);

  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false); 
  const [isTypeOpen, setIsTypeOpen] = useState(false);         
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");

  const [filterCategory, setFilterCategory] = useState("");
  const [filterType, setFilterType] = useState("");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [modalTransaction, setModalTransaction] = useState(null);
  const [form, setForm] = useState({ date: "", description: "", category: "", type: "", amount: "" });
  const [formError, setFormError] = useState("");

  const { currency, role, theme } = settings;
  const isAdmin = role === "admin";
  const formatMoney = useCallback((amountInr) => formatDisplayAmount(amountInr, currency), [currency]);

  useEffect(() => { localStorage.setItem('monthlyBudget', monthlyBudget); }, [monthlyBudget]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(ACTIVE_TAB_KEY, activeTab); }, [activeTab]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const income = useMemo(() => transactions.filter((t) => t.type === "Income").reduce((a, t) => a + t.amount, 0), [transactions]);
  const expense = useMemo(() => transactions.filter((t) => t.type === "Expense").reduce((a, t) => a + t.amount, 0), [transactions]);
  const balance = income - expense;

  const currentMonth = monthKey(new Date().toISOString().slice(0, 10));
  const monthIncome = useMemo(() => transactions.filter((t) => t.type === "Income" && monthKey(t.date) === currentMonth).reduce((a, t) => a + t.amount, 0), [transactions, currentMonth]);
  const monthExpense = useMemo(() => transactions.filter((t) => t.type === "Expense" && monthKey(t.date) === currentMonth).reduce((a, t) => a + t.amount, 0), [transactions, currentMonth]);
  const netSavingsMonth = monthIncome - monthExpense;

  const filteredAndSortedTransactions = useMemo(() => {
    let items = [...transactions].filter(
      (t) =>
        (!filterCategory || t.category === filterCategory) &&
        (!filterType || t.type === filterType) &&
        t.description.toLowerCase().includes(search.toLowerCase())
    );

    if (sortConfig.key) {
      items.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'amount') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [transactions, filterCategory, filterType, search, sortConfig]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const expenseByCategory = useMemo(
    () => CATEGORIES.map((cat) => ({
      name: cat,
      value: transactions.filter((t) => t.type === "Expense" && t.category === cat).reduce((sum, t) => sum + t.amount, 0),
    })).filter((d) => d.value > 0), [transactions]
  );

  const months = useMemo(() => {
    const keys = Array.from(new Set(transactions.map((t) => monthKey(t.date)).filter(Boolean)));
    return keys.sort();
  }, [transactions]);

  const barData = useMemo(() => months.map((m) => ({
    month: m,
    Income: transactions.filter((t) => monthKey(t.date) === m && t.type === "Income").reduce((s, t) => s + t.amount, 0),
    Expense: transactions.filter((t) => monthKey(t.date) === m && t.type === "Expense").reduce((s, t) => s + t.amount, 0),
  })), [months, transactions]);

  const insightLines = useMemo(
    () => buildInsights({ transactions, income, expense, expenseByCategory, monthlyBudget, formatMoney, currency }),
    [transactions, income, expense, expenseByCategory, monthlyBudget, formatMoney, currency]
  );

  const renderPremiumTooltip = useCallback((props) => <PremiumChartTooltip {...props} currency={currency} />, [currency]);

  const topExpenseCategories = useMemo(() => {
    const map = {};
    for (const t of transactions) {
      if (t.type !== "Expense") continue;
      map[t.category] = (map[t.category] || 0) + t.amount;
    }
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 3);
  }, [transactions]);

  const topCategoryMax = topExpenseCategories[0]?.value || 1;
  const recentFiveTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  const budgetUsedPct = useMemo(() => (monthlyBudget > 0 ? Math.min(150, (monthExpense / monthlyBudget) * 100) : 0), [monthExpense, monthlyBudget]);
  const budgetBarClass = budgetUsedPct <= 70 ? "bg-green-500" : budgetUsedPct <= 100 ? "bg-yellow-500" : "bg-red-500";

  const headerSubtitle = activeTab === "dashboard" ? "Your financial snapshot" : activeTab === "transactions" ? "History & Logs" : "Predictive Trends & Analysis";

  const openBudgetModal = () => {
    if (!isAdmin) return;
    setBudgetInput(String(monthlyBudget));
    setShowBudgetModal(true);
  };

  const saveBudget = (e) => {
    e.preventDefault();
    const newBudget = Number(budgetInput);
    if (!isNaN(newBudget) && newBudget > 0) {
      setMonthlyBudget(newBudget);
      setShowBudgetModal(false);
    }
  };

  function setCurrency(c) { setSettings((s) => ({ ...s, currency: c })); }
  function toggleRole() { setSettings((s) => ({ ...s, role: s.role === "admin" ? "viewer" : "admin" })); }
  function toggleTheme() { setSettings((s) => ({ ...s, theme: s.theme === "dark" ? "light" : "dark" })); }

  function openModalAdd() {
    if (!isAdmin) return;
    setModalMode("add");
    setForm({ date: "", description: "", category: "", type: "", amount: "" });
    setFormError("");
    setModalTransaction(null);
    setShowModal(true);
  }

  function openModalEdit(transaction) {
    if (!isAdmin) return;
    setModalMode("edit");
    setForm({
      date: transaction.date,
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      amount: String(transaction.amount),
    });
    setFormError("");
    setModalTransaction(transaction);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setFormError("");
    setModalTransaction(null);
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "amount" ? value.replace(/[^\d.]/g, "") : value }));
    setFormError("");
  }

  function validateForm() {
    if (!form.date || !form.description.trim() || !form.category || !form.type || !form.amount) {
      setFormError("All fields are required.");
      return false;
    }
    const n = Number(form.amount);
    if (Number.isNaN(n) || n <= 0) {
      setFormError("Amount must be a number greater than 0.");
      return false;
    }
    return true;
  }

  function handleAddTransaction(e) {
    e.preventDefault();
    if (!isAdmin || !validateForm()) return;
    const amount = parseFloat(form.amount);
    const newTransaction = {
      id: transactions.length > 0 ? Math.max(...transactions.map((t) => t.id)) + 1 : 1,
      date: form.date,
      description: form.description.trim(),
      category: form.category,
      type: form.type,
      amount,
    };
    setTransactions((txs) => [newTransaction, ...txs]);
    closeModal();
  }

  function handleUpdateTransaction(e) {
    e.preventDefault();
    if (!isAdmin || !validateForm() || !modalTransaction) return;
    const amount = parseFloat(form.amount);
    setTransactions((txs) =>
      txs.map((t) => t.id === modalTransaction.id ? { ...t, date: form.date, description: form.description.trim(), category: form.category, type: form.type, amount } : t)
    );
    closeModal();
  }

  function handleDeleteTransaction(id) {
    if (!isAdmin) return;
    setTransactions((txs) => txs.filter((t) => t.id !== id));
    if (showModal && modalTransaction?.id === id) closeModal();
  }

  const sidebarClass = `
    fixed inset-y-0 left-0 z-40 flex h-screen w-72 flex-col border-r border-gray-200 bg-white/95 px-5 py-8 shadow-lg backdrop-blur-xl
    transition-transform duration-200 ease-out dark:border-white/5 dark:bg-[#111827]/80 lg:static lg:translate-x-0
    ${mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
  `;

  return (
    
    <div className="relative flex h-screen w-full min-w-0 overflow-hidden bg-gray-50 font-sans transition-colors duration-500 dark:bg-[#0B0F19]">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap');`}
      </style>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-indigo-600 blur-[120px] opacity-10 dark:opacity-20" />
        <div className="absolute -right-16 bottom-20 h-96 w-96 rounded-full bg-purple-600 blur-[120px] opacity-10 dark:opacity-20" />
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 w-full">
        {mobileNavOpen && (
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <aside className={sidebarClass}>
          <div className="mb-8 flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25">
                <TrendingUp className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Finvyn
                </p>
                <p className="mt-1 whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-slate-400">
                  FINANCIAL INSIGHTS, SIMPLIFIED
                </p>
              </div>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV.map((navItem) => {
              const { id, label, icon: NavIcon } = navItem;
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setActiveTab(id); setMobileNavOpen(false); }}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition duration-200 ${
                    active
                      ? "bg-gray-900 text-white shadow-md dark:bg-white dark:text-gray-900"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white hover:text-gray-900"
                  }`}
                >
                  <NavIcon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2} />
                  {label}
                </button>
              );
            })}
          </nav>

          <p className="mt-8 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            Demo data loads when storage is empty. Amounts stored in INR; USD uses a display rate (~₹{INR_PER_USD} = $1).
          </p>
        </aside>

        {}
        <div className="flex min-h-0 flex-1 flex-col w-full min-w-0 lg:ml-0">
          <header className="z-20 shrink-0 border-b border-gray-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur-xl dark:border-white/5 dark:bg-[#111827]/80 sm:px-6 lg:px-10">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-gray-200 p-2.5 text-gray-600 shadow-sm hover:bg-gray-50 active:scale-95 dark:border-white/5 dark:text-gray-300 dark:hover:bg-white/5 lg:hidden"
                  onClick={() => setMobileNavOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
                    {headerGreeting()}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {headerSubtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <div className="relative inline-block text-left">
                  <button
                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                    className="flex items-center justify-between min-w-[110px] px-3 py-2 h-10 bg-white dark:bg-[#111827] border border-gray-300 dark:border-white/10 rounded-lg text-sm font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <span>{currency === 'INR' ? '₹ INR' : '$ USD'}</span>
                    <ChevronDown size={16} className={`transition-transform duration-200 ${isCurrencyOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isCurrencyOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-full origin-top-right rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 shadow-xl shadow-black/20 overflow-hidden backdrop-blur-xl transition-all">
                      <button onClick={() => { setCurrency('INR'); setIsCurrencyOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${currency === 'INR' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>₹ INR</button>
                      <button onClick={() => { setCurrency('USD'); setIsCurrencyOpen(false); }} className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${currency === 'USD' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>$ USD</button>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={toggleRole}
                  className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 active:scale-95 dark:border-white/5 dark:bg-[#111827]/80 dark:text-white dark:hover:bg-white/5"
                  aria-pressed={isAdmin}
                >
                  {isAdmin ? <Shield className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> : <User className="h-4 w-4 text-gray-400" />}
                  <span className="capitalize">{role}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-95 dark:border-white/5 dark:bg-[#111827]/80 dark:text-amber-300 dark:hover:bg-white/5"
                  aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </header>

          {/* STRICT WIDTH CONSTRAINT: w-full min-w-0 to prevent horizontal stretching */}
          <main className="custom-scrollbar mx-auto w-full min-w-0 max-w-7xl flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-10">
            {activeTab === "dashboard" && (
              <>
                <section className="mb-8 w-full min-w-0">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard title="Total balance" valueInr={balance} currency={currency} accent={undefined} icon={Wallet} />
                    <SummaryCard title="Income" valueInr={income} currency={currency} accent="green" icon={TrendingUp} />
                    <SummaryCard title="Expenses" valueInr={expense} currency={currency} accent="red" icon={TrendingDown} />
                    <SummaryCard title="Net savings (this month)" valueInr={netSavingsMonth} currency={currency} accent="violet" icon={PiggyBank} />
                  </div>
                </section>

                <section className="mb-8 w-full min-w-0">
                  <CardShell>
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Monthly budget tracker
                      </h2>
                      <div onClick={openBudgetModal} className="flex items-center gap-1 cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors group" title="Click to edit budget">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatMoney(monthExpense)} / {formatMoney(monthlyBudget)}
                        </span>
                        {isAdmin && <Pencil size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      This month&apos;s expenses vs. your monthly budget cap.
                    </p>
                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${budgetBarClass}`}
                        style={{ width: `${Math.min(100, budgetUsedPct)}%` }}
                      />
                    </div>
                  </CardShell>
                </section>

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-3 w-full min-w-0">
                  <CardShell className="lg:col-span-2">
                    <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">
                      Monthly income vs expenses
                    </h2>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                      Stacked by calendar month
                    </p>
                    {barData.length === 0 ? (
                      <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 py-12 text-center dark:border-white/5 dark:bg-gray-900/40">
                        <p className="text-gray-500 dark:text-gray-400">No monthly data yet</p>
                        <p className="mt-1 text-sm text-gray-400">Transactions with valid dates will appear here.</p>
                      </div>
                    ) : (
                      <div className="h-[320px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-gray-500" />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                              cursor={{ fill: "rgba(128, 128, 128, 0.1)" }}
                              animationDuration={150}
                              contentStyle={{ backgroundColor: "#111827", borderRadius: "12px", border: "1px solid #374151", color: "#fff" }}
                              formatter={(value) => formatDisplayAmount(Number(value), currency)}
                            />
                            <Legend />
                            <Bar dataKey="Income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" isAnimationActive={true} />
                            <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" isAnimationActive={true} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardShell>

                  <CardShell className="lg:col-span-1">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                      Recent transactions
                    </h2>
                    {recentFiveTransactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Table2 className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No transactions yet.</p>
                        {isAdmin && (
                          <button onClick={() => setActiveTab("transactions")} className="mt-4 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
                            Add your first entry &rarr;
                          </button>
                        )}
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-100 dark:divide-white/5 w-full">
                        {recentFiveTransactions.map((t) => (
                          <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0 w-full min-w-0">
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-gray-900 dark:text-white">{t.description}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">{t.date} · {t.category}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className={`text-sm font-semibold tabular-nums ${t.type === "Income" ? "text-green-500" : "text-red-500"}`}>
                                {t.type === "Income" ? "+" : "−"}
                                {formatDisplayAmount(t.amount, currency)}
                              </span>
                              <span className="ml-2 text-xs text-gray-400">{t.type}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardShell>
                </section>
              </>
            )}

            {activeTab === "transactions" && (
              <section className="space-y-6 w-full min-w-0">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between w-full min-w-0">
                  <div className="flex w-full flex-col gap-3 md:flex-1 md:flex-row md:flex-wrap min-w-0">
                    <input
                      type="search"
                      placeholder="Search description..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={`${FORM_INPUT} w-full shadow-sm md:max-w-xs`}
                      aria-label="Search transactions"
                    />
                    
                    <div className="relative inline-block text-left w-full md:w-auto md:min-w-[160px]">
                      <button onClick={() => setIsCategoryOpen(!isCategoryOpen)} className="flex items-center justify-between w-full px-3 py-2.5 bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/5 rounded-xl text-sm text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500/20">
                        <span>{filterCategory || "All categories"}</span>
                        <ChevronDown size={16} className="text-gray-500" />
                      </button>
                      {isCategoryOpen && (
                        <div className="absolute z-50 mt-2 w-full rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
                          <button onClick={() => { setFilterCategory(""); setIsCategoryOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">All categories</button>
                          {CATEGORIES.map(c => (
                            <button key={c} onClick={() => { setFilterCategory(c); setIsCategoryOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">{c}</button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative inline-block text-left w-full md:w-auto md:min-w-[140px]">
                      <button onClick={() => setIsTypeOpen(!isTypeOpen)} className="flex items-center justify-between w-full px-3 py-2.5 bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/5 rounded-xl text-sm text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500/20">
                        <span>{filterType || "All types"}</span>
                        <ChevronDown size={16} className="text-gray-500" />
                      </button>
                      {isTypeOpen && (
                        <div className="absolute z-50 mt-2 w-full rounded-xl bg-white dark:bg-[#111827] border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
                          <button onClick={() => { setFilterType(""); setIsTypeOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">All types</button>
                          {TYPES.map(t => (
                            <button key={t} onClick={() => { setFilterType(t); setIsTypeOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">{t}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end min-w-0">
                    <button
                      type="button"
                      onClick={() => exportToCSV(transactions)}
                      className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all duration-200 shadow-sm"
                    >
                      Export CSV
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={openModalAdd}
                        className="bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all duration-200 text-white rounded-lg px-4 py-2 font-medium shadow-md"
                      >
                        + Add transaction
                      </button>
                    )}
                  </div>
                </div>

                {/* STRICT WIDTH CONSTRAINT: min-w-0 stops the table wrapper from expanding the page */}
                <div className="w-full min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/5 dark:bg-[#111827]/80 overflow-hidden">
                  <div className="w-full overflow-x-auto custom-scrollbar">
                    <table className="w-full min-w-[700px] text-left border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/90 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:border-white/5 dark:bg-gray-900/50 dark:text-gray-400">
                          <th className="px-5 py-4 whitespace-nowrap cursor-pointer hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors" onClick={() => handleSort('date')}>
                            <div className="flex items-center gap-1">Date <ArrowUpDown size={14} className={sortConfig.key === 'date' ? 'text-indigo-500' : 'opacity-50'} /></div>
                          </th>
                          <th className="px-5 py-4 whitespace-nowrap">Description</th>
                          <th className="px-5 py-4 whitespace-nowrap">Category</th>
                          <th className="px-5 py-4 whitespace-nowrap">Type</th>
                          <th className="px-5 py-4 text-right whitespace-nowrap cursor-pointer hover:bg-gray-200/50 dark:hover:bg-white/10 transition-colors" onClick={() => handleSort('amount')}>
                            <div className="flex items-center justify-end gap-1">Amount <ArrowUpDown size={14} className={sortConfig.key === 'amount' ? 'text-indigo-500' : 'opacity-50'} /></div>
                          </th>
                          {isAdmin && <th className="px-5 py-4 text-right whitespace-nowrap">Actions</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {filteredAndSortedTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={isAdmin ? 6 : 5} className="px-5 py-16 text-center">
                              <div className="flex flex-col items-center justify-center">
                                <Search className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-3" />
                                <p className="text-base font-medium text-slate-700 dark:text-slate-200">No transactions found.</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">Your financial story starts here. Try adjusting your filters or add your first entry.</p>
                                {isAdmin && (
                                  <button onClick={openModalAdd} className="mt-6 px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 font-medium rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">
                                    + Add New Transaction
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredAndSortedTransactions.map((t) => (
                            <tr key={t.id} className="transition hover:bg-gray-50/80 dark:hover:bg-white/5">
                              <td className="whitespace-nowrap px-5 py-4 text-gray-600 dark:text-gray-300 tabular-nums">{t.date}</td>
                              <td className="px-5 py-4 font-medium text-gray-900 dark:text-white truncate max-w-[200px] whitespace-nowrap">{t.description}</td>
                              <td className="px-5 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{t.category}</td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${t.type === "Income" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                  {t.type}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right font-semibold tabular-nums text-gray-900 dark:text-white whitespace-nowrap">
                                <span className="inline-flex items-center justify-end gap-1">
                                  {currency === 'INR' 
                                    ? '₹' + Number(t.amount).toLocaleString('en-IN') 
                                    : '$' + Number(t.amount / INR_PER_USD).toLocaleString('en-US', {maximumFractionDigits: 0})}
                                </span>
                              </td>
                              {isAdmin && (
                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openModalEdit(t)}
                                      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-200"
                                      title="Edit transaction"
                                    >
                                      <Pencil size={18} strokeWidth={2} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setItemToDelete(t.id)}
                                      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
                                      title="Delete transaction"
                                    >
                                      <Trash2 size={18} strokeWidth={2} />
                                    </button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeTab === "insights" && (
              <section className="space-y-6 w-full min-w-0">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <CardShell>
                    <h2 className="mb-1 text-lg font-semibold text-gray-900 dark:text-white">Expense distribution</h2>
                    <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">By category</p>
                    {expenseByCategory.length === 0 ? (
                      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-gray-500 dark:border-white/5">
                        No expenses to visualize
                      </div>
                    ) : (
                      <div className="h-[300px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={expenseByCategory}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={90}
                              paddingAngle={2}
                              isAnimationActive={true}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {expenseByCategory.map((entry, idx) => (
                                <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              animationDuration={0} 
                              isAnimationActive={false} 
                              contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #374151', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                              itemStyle={{ color: '#e5e7eb' }} 
                              cursor={false} 
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardShell>

                  <div className="flex flex-col gap-6 min-w-0 w-full">
                    <CardShell>
                      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Smart insights</h2>
                      <ul className="space-y-3">
                        {insightLines.map((line, i) => (
                          <li key={i} className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-white/5 dark:bg-gray-900/40 dark:text-gray-200 flex items-start gap-3">
                            {line.startsWith('You') ? <PiggyBank className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /> : line.startsWith('🎉') ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> : <TrendingDown className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                            <span>{line.replace('🎉 Great job! ', '').replace('⚠️ Budget exceeded: ', '').replace('⚠️ Deficit alert: ', '')}</span>
                          </li>
                        ))}
                        {income > 0 && (
                          <li className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700 dark:border-white/5 dark:bg-gray-900/40 dark:text-gray-200 flex items-start gap-3">
                            {((income - expense) / income * 100) > 20 ? <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" /> : <Shield className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}
                            <span>Savings Rate: You have saved {((income - expense) / income * 100).toFixed(1)}% of your income this month.</span>
                          </li>
                        )}
                      </ul>
                    </CardShell>

                    <CardShell>
                      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Top spending categories</h2>
                      {topExpenseCategories.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No expense categories yet — add expenses to see top spend areas.</p>
                      ) : (
                        <ul className="space-y-4">
                          {topExpenseCategories.map((cat, idx) => (
                            <li key={cat.name}>
                              <div className="mb-1 flex justify-between text-sm">
                                <span className="font-medium text-gray-800 dark:text-gray-100 tabular-nums">{idx + 1}. {cat.name}</span>
                                <span className="tabular-nums text-gray-600 dark:text-gray-300">{formatMoney(cat.value)}</span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500" style={{ width: `${Math.min(100, (cat.value / topCategoryMax) * 100)}%` }} />
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardShell>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => exportToCSV(transactions)}
                    className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#111827] border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all duration-200 shadow-sm"
                  >
                    Export CSV
                  </button>
                </div>
              </section>
            )}

            {/* Add / Edit Transaction Modal */}
            {showModal && isAdmin && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/5 dark:bg-[#111827]/95">
                  <h2 id="modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
                    {modalMode === "edit" ? "Edit transaction" : "Add transaction"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Amounts are saved in INR.</p>
                  <form className="mt-6 flex flex-col gap-4" onSubmit={modalMode === "edit" ? handleUpdateTransaction : handleAddTransaction}>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Date <span className="text-red-500">*</span></label>
                      <input type="date" name="date" value={form.date} onChange={handleFormChange} max={new Date().toISOString().slice(0, 10)} className={FORM_INPUT} required />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Description <span className="text-red-500">*</span></label>
                      <input type="text" name="description" value={form.description} onChange={handleFormChange} maxLength={120} className={FORM_INPUT} required />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category <span className="text-red-500">*</span></label>
                      <select name="category" value={form.category} onChange={handleFormChange} className={`w-full ${SELECT_CLASSES}`} required>
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Type <span className="text-red-500">*</span></label>
                      <select name="type" value={form.type} onChange={handleFormChange} className={`w-full ${SELECT_CLASSES}`} required>
                        <option value="">Select type</option>
                        {TYPES.map((ty) => (<option key={ty} value={ty}>{ty}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Amount (INR) <span className="text-red-500">*</span></label>
                      <input type="text" name="amount" inputMode="decimal" value={form.amount} onChange={handleFormChange} className={FORM_INPUT} placeholder="e.g. 1500" required />
                    </div>
                    {formError && <p className="text-sm font-medium text-red-500">{formError}</p>}
                    <div className="mt-2 flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-white/5">
                      <button type="button" onClick={closeModal} className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100 active:scale-95 dark:text-gray-300 dark:hover:bg-white/5">
                        Cancel
                      </button>
                      <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700 active:scale-95">
                        {modalMode === "edit" ? "Save changes" : "Add transaction"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Custom Budget Modal */}
            {showBudgetModal && isAdmin && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
                <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-white/5 dark:bg-[#111827]">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Monthly Budget</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Set your maximum expense cap for the month.</p>
                  <form onSubmit={saveBudget} className="mt-4">
                    <input type="number" value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} className={FORM_INPUT} placeholder="Enter amount" autoFocus required min="1" />
                    <div className="mt-6 flex gap-3">
                      <button type="button" onClick={() => setShowBudgetModal(false)} className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:scale-95 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 transition-all">Cancel</button>
                      <button type="submit" className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 transition-all">Save Budget</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {itemToDelete !== null && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
                <div className="bg-white dark:bg-[#111827] rounded-2xl border border-gray-200 dark:border-white/10 p-6 shadow-2xl w-full max-w-sm transform transition-all">
                  <Trash2 className="text-red-500 w-8 h-8 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Delete Transaction</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Are you sure you want to delete this? This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setItemToDelete(null)}
                      className="px-4 py-2 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleDeleteTransaction(itemToDelete); setItemToDelete(null); }}
                      className="px-4 py-2 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 active:scale-95 transition-all duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
}