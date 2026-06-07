export type StudentDailyTask = {
  id: string;
  title: string;
  completed: boolean;
};

export type StudentExamSnapshot = {
  tytNet: number | null;
  aytNet: number | null;
  weakTopic: string | null;
  examName?: string;
  savedAt?: string;
};

export type StudentDashboardData = {
  briefingText: string;
  tasks: StudentDailyTask[];
  exam: StudentExamSnapshot | null;
  taskCount: number;
  source: "appwrite" | "empty";
  generatedAt: string;
};

export function studentDashboardGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Günaydın";
  if (hour < 18) return "İyi günler";
  return "İyi akşamlar";
}
