export const coachProfile = {
  name: "Ayşe Yılmaz",
  role: "YKS Koçu",
  email: "ayse.yilmaz@derecepanel.com",
  avatarInitials: "AY",
};

export const navItems = {
  menu: [
    { label: "Ana Sayfa", href: "/dashboard", icon: "home" as const, active: false },
    { label: "Öğrenciler", href: "/dashboard/ogrencilerim", icon: "users" as const, active: false },
    { label: "Sınıflarım", href: "/dashboard/siniflar", icon: "classes" as const, active: false },
    { label: "Randevular", href: "/dashboard/randevular", icon: "calendar" as const, active: false },
  ],
};

export const summaryStats = [
  {
    label: "Toplam Net Ortalaması",
    value: "78.4",
    sublabel: "Son 12 ayda",
    icon: "wallet" as const,
  },
  {
    label: "Bu Ay Deneme",
    value: "12",
    sublabel: "Son 12 ayda",
    icon: "card" as const,
  },
  {
    label: "Aktif Öğrenci",
    value: "24",
    sublabel: "Son 12 ayda",
    icon: "export" as const,
  },
];

export const monthlyNetTrend = [
  { month: "Oca", net: 42 },
  { month: "Şub", net: 51 },
  { month: "Mar", net: 48 },
  { month: "Nis", net: 60 },
  { month: "May", net: 65 },
  { month: "Haz", net: 72 },
  { month: "Tem", net: 78 },
  { month: "Ağu", net: 85 },
  { month: "Eyl", net: 80 },
  { month: "Eki", net: 88 },
];

export const recentActivities = [
  {
    id: "1",
    title: "TYT Deneme #14 girildi",
    subtitle: "Ahmet Kaya",
    time: "2 dk önce",
    amount: "+4.2 net",
    secondary: "87.5 TYT",
    icon: "math" as const,
    iconBg: "#fff7ed",
    iconColor: "#f97316",
  },
  {
    id: "2",
    title: "Görüşme tamamlandı",
    subtitle: "Zeynep Arslan",
    time: "4 sa önce",
    amount: "64.0 AYT",
    secondary: "Hedef güncellendi",
    icon: "turkish" as const,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
  },
  {
    id: "3",
    title: "Paragraf seti teslim",
    subtitle: "Mert Öztürk",
    time: "1 gün önce",
    amount: "-2 hata",
    secondary: "Set B · 45 soru",
    icon: "physics" as const,
    iconBg: "#eff6ff",
    iconColor: "#2563eb",
  },
  {
    id: "4",
    title: "Haftalık rapor alındı",
    subtitle: "Elif Yıldız",
    time: "3 gün önce",
    amount: "92.0 net",
    secondary: "Hacettepe / Tıp",
    icon: "bio" as const,
    iconBg: "#fef2f2",
    iconColor: "#dc2626",
  },
];

export const examTransactions = [
  {
    id: "#876543",
    type: "TYT Deneme — Matematik Analizi",
    date: "27 May 2026 · 14:32",
    student: "Ahmet Kaya",
    amount: "26.5 net",
    balance: "Kalan: 3 konu",
    direction: "up" as const,
  },
  {
    id: "#876542",
    type: "AYT Fizik — Konu Testi",
    date: "26 May 2026 · 11:15",
    student: "Zeynep Arslan",
    amount: "18.0 net",
    balance: "Kalan: 5 konu",
    direction: "down" as const,
  },
  {
    id: "#876541",
    type: "Paragraf Kampı — Set B",
    date: "25 May 2026 · 09:48",
    student: "Mert Öztürk",
    amount: "42 / 45",
    balance: "Doğruluk: %93",
    direction: "up" as const,
  },
  {
    id: "#876540",
    type: "TYT Genel — Deneme #13",
    date: "24 May 2026 · 16:20",
    student: "Elif Yıldız",
    amount: "92.0 net",
    balance: "Hedef: 95+",
    direction: "up" as const,
  },
  {
    id: "#876539",
    type: "Geometri — Eksik Analizi",
    date: "23 May 2026 · 10:05",
    student: "Can Şahin",
    amount: "12 hata",
    balance: "Kalan: 8 konu",
    direction: "down" as const,
  },
];
