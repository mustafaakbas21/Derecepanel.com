import "server-only";

import { generateStudentBriefingText } from "@/lib/student/dashboard/student-briefing-ai";
import {
  fetchLatestExamFromAppwrite,
  fetchTodayTasksFromAppwrite,
} from "@/lib/appwrite/dashboard-server";
import type { StudentDashboardData } from "@/lib/student/dashboard/types";
import { isAppwriteServerConfigured } from "@/lib/appwrite/server";

export async function buildStudentDashboard(
  studentId: string
): Promise<StudentDashboardData> {
  const hasAppwrite = isAppwriteServerConfigured();

  const [tasks, exam] = hasAppwrite
    ? await Promise.all([
        fetchTodayTasksFromAppwrite(studentId),
        fetchLatestExamFromAppwrite(studentId),
      ])
    : [[], null];

  const taskCount = tasks.length;
  const weakTopic = exam?.weakTopic ?? null;

  const briefingText = await generateStudentBriefingText({
    taskCount,
    weakTopic,
    exam,
  });

  return {
    briefingText,
    tasks,
    exam,
    taskCount,
    source: hasAppwrite && (tasks.length > 0 || exam) ? "appwrite" : "empty",
    generatedAt: new Date().toISOString(),
  };
}
