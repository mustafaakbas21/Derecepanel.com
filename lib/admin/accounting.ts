export const ACCOUNTING_KEY = "accounting_transactions_v1";

export type TransactionType = "gelir" | "gider";
export type PaymentStatus = "odendi" | "beklemede" | "iptal";

export type TransactionCategory =
  | "ogrenci_ucreti"
  | "kurum_anlasmasi"
  | "abonelik"
  | "diger_gelir"
  | "maas"
  | "ofis"
  | "pazarlama"
  | "yazilim"
  | "vergi"
  | "diger_gider";

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  ogrenci_ucreti: "Öğrenci ücreti",
  kurum_anlasmasi: "Kurum anlaşması",
  abonelik: "Abonelik",
  diger_gelir: "Diğer gelir",
  maas: "Maaş / hakediş",
  ofis: "Ofis / kira",
  pazarlama: "Pazarlama",
  yazilim: "Yazılım / altyapı",
  vergi: "Vergi / resmi",
  diger_gider: "Diğer gider",
};

export const INCOME_CATEGORIES: TransactionCategory[] = [
  "ogrenci_ucreti",
  "kurum_anlasmasi",
  "abonelik",
  "diger_gelir",
];

export const EXPENSE_CATEGORIES: TransactionCategory[] = [
  "maas",
  "ofis",
  "pazarlama",
  "yazilim",
  "vergi",
  "diger_gider",
];

export type AccountingTransaction = {
  id: string;
  type: TransactionType;
  category: TransactionCategory;
  title: string;
  amount: number;
  date: string;
  status: PaymentStatus;
  description?: string;
  relatedCoachId?: string;
  relatedStudentId?: string;
  relatedInstitutionId?: string;
  createdAt: string;
};

export type AccountingDraft = {
  type: TransactionType;
  category: TransactionCategory;
  title: string;
  amount: number;
  date: string;
  status: PaymentStatus;
  description?: string;
  relatedCoachId?: string;
  relatedStudentId?: string;
  relatedInstitutionId?: string;
};

export type MonthlyFinance = {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
};

export type CategoryFinance = {
  category: TransactionCategory;
  label: string;
  amount: number;
  type: TransactionType;
};

export type AccountingStats = {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  monthIncome: number;
  monthExpense: number;
  monthNet: number;
  monthTrendPercent: number;
  pendingIncome: number;
  pendingExpense: number;
  paidTransactionCount: number;
  monthlyFinance: MonthlyFinance[];
  incomeByCategory: CategoryFinance[];
  expenseByCategory: CategoryFinance[];
  recentTransactions: AccountingTransaction[];
};

const MONTH_LABELS = [
  "Oca",
  "Şub",
  "Mar",
  "Nis",
  "May",
  "Haz",
  "Tem",
  "Ağu",
  "Eyl",
  "Eki",
  "Kas",
  "Ara",
];

export function formatTry(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(amount);
}

function sumByType(
  transactions: AccountingTransaction[],
  type: TransactionType,
  options?: { status?: PaymentStatus; monthKey?: string }
): number {
  return transactions
    .filter((t) => {
      if (t.type !== type) return false;
      if (options?.status && t.status !== options.status) return false;
      if (options?.monthKey && !t.date.startsWith(options.monthKey)) return false;
      return true;
    })
    .reduce((s, t) => s + t.amount, 0);
}

function buildMonthlyFinance(transactions: AccountingTransaction[]): MonthlyFinance[] {
  const now = new Date();
  const buckets: MonthlyFinance[] = [];

  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.push({
      month: key,
      label: MONTH_LABELS[d.getMonth()] ?? key,
      income: 0,
      expense: 0,
      net: 0,
    });
  }

  for (const t of transactions) {
    if (t.status === "iptal") continue;
    const key = t.date.slice(0, 7);
    const bucket = buckets.find((b) => b.month === key);
    if (!bucket) continue;
    if (t.type === "gelir") bucket.income += t.amount;
    else bucket.expense += t.amount;
  }

  for (const b of buckets) {
    b.income = Math.round(b.income);
    b.expense = Math.round(b.expense);
    b.net = b.income - b.expense;
  }

  return buckets;
}

function buildCategoryBreakdown(
  transactions: AccountingTransaction[],
  type: TransactionType
): CategoryFinance[] {
  const map = new Map<TransactionCategory, number>();
  for (const t of transactions) {
    if (t.type !== type || t.status === "iptal") continue;
    map.set(t.category, (map.get(t.category) || 0) + t.amount);
  }
  return Array.from(map.entries())
    .map(([category, amount]) => ({
      category,
      label: TRANSACTION_CATEGORY_LABELS[category],
      amount: Math.round(amount),
      type,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export function computeAccountingStats(transactions: AccountingTransaction[]): AccountingStats {
  const paid = transactions.filter((t) => t.status === "odendi");
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;

  const totalIncome = sumByType(paid, "gelir");
  const totalExpense = sumByType(paid, "gider");
  const monthIncome = sumByType(paid, "gelir", { monthKey });
  const monthExpense = sumByType(paid, "gider", { monthKey });
  const prevMonthNet =
    sumByType(paid, "gelir", { monthKey: prevKey }) -
    sumByType(paid, "gider", { monthKey: prevKey });
  const monthNet = monthIncome - monthExpense;

  const monthTrendPercent =
    prevMonthNet !== 0
      ? Math.round(((monthNet - prevMonthNet) / Math.abs(prevMonthNet)) * 1000) / 10
      : monthNet > 0
        ? 100
        : 0;

  return {
    totalIncome: Math.round(totalIncome),
    totalExpense: Math.round(totalExpense),
    netBalance: Math.round(totalIncome - totalExpense),
    monthIncome: Math.round(monthIncome),
    monthExpense: Math.round(monthExpense),
    monthNet: Math.round(monthNet),
    monthTrendPercent,
    pendingIncome: Math.round(sumByType(transactions, "gelir", { status: "beklemede" })),
    pendingExpense: Math.round(sumByType(transactions, "gider", { status: "beklemede" })),
    paidTransactionCount: paid.length,
    monthlyFinance: buildMonthlyFinance(transactions),
    incomeByCategory: buildCategoryBreakdown(transactions, "gelir"),
    expenseByCategory: buildCategoryBreakdown(transactions, "gider"),
    recentTransactions: transactions.slice(0, 6),
  };
}
