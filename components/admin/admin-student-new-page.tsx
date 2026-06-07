"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { StudentWizardModal } from "@/components/students/student-wizard-modal";
import {
  LIBRARY_PAGE_CLASS,
  LibraryPageHeader,
} from "@/components/library/library-shell";
import { ADMIN_ROUTES } from "@/lib/admin/admin-nav-config";
import { loadCoaches } from "@/lib/admin/coach-storage";
import { appToast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { loadStudentsFull, persistStudentsFull } from "@/lib/students/storage";
import type { StudentRecord } from "@/lib/students/types";

const selectCls =
  "h-12 rounded-xl border-slate-200 bg-white px-3.5 text-[15px] text-slate-900 shadow-sm";

export function AdminStudentNewPage() {
  const router = useRouter();
  const [coachId, setCoachId] = useState("");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [coaches, setCoaches] = useState<ReturnType<typeof loadCoaches>>([]);

  useEffect(() => {
    const list = loadCoaches();
    setCoaches(list);
    if (list.length > 0) {
      setCoachId((prev) => prev || list[0]!.coachId);
    }
  }, []);

  const handleSave = useCallback(
    (record: StudentRecord) => {
      const students = loadStudentsFull({ seedIfEmpty: false });
      persistStudentsFull([...students, record]);
      appToast.studentSaved(false);
      router.push(ADMIN_ROUTES.students);
    },
    [router]
  );

  const openWizard = () => {
    if (!coachId) {
      appToast.error("Önce bir koç seçin.");
      return;
    }
    setWizardOpen(true);
  };

  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader
        title="Yeni Öğrenci"
        description="Öğrenciyi bir koça bağlayarak panel hesabı oluşturun."
        action={
          <Button variant="outline" onClick={() => router.push(ADMIN_ROUTES.students)}>
            Listeye dön
          </Button>
        }
      />

      <section className="max-w-lg space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
        <div className="space-y-1.5">
          <Label>Bağlı koç *</Label>
          <Select value={coachId} onValueChange={setCoachId}>
            <SelectTrigger className={selectCls}>
              <SelectValue placeholder="Koç seçin" />
            </SelectTrigger>
            <SelectContent>
              {coaches.map((c) => (
                <SelectItem key={c.coachId} value={c.coachId}>
                  {c.displayName || c.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="primary" onClick={openWizard} disabled={!coachId}>
          Kayıt sihirbazını başlat
        </Button>
      </section>

      <StudentWizardModal
        open={wizardOpen}
        onOpenChange={setWizardOpen}
        mode="add"
        defaultCoachId={coachId}
        showCoachPicker
        onSave={handleSave}
      />
    </div>
  );
}
