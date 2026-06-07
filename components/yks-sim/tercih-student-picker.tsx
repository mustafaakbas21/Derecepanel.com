"use client";

import { useMemo } from "react";
import { User } from "lucide-react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

type Props = {
  students: StudentRecord[];
  value: string;
  onChange: (ogrenciId: string) => void;
  className?: string;
  id?: string;
};

export function TercihStudentPicker({
  students,
  value,
  onChange,
  className,
  id = "tercih-student-select",
}: Props) {
  const selected = useMemo(
    () => students.find((s) => s.ogrenciId === value),
    [students, value]
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
        <User className="h-3.5 w-3.5" />
        Öğrenci (Öğrencilerim)
      </Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger id={id} className="h-10 bg-white">
          <SelectValue placeholder="Tercih listesi için öğrenci seçin" />
        </SelectTrigger>
        <SelectContent>
          {students.map((s) => (
            <SelectItem key={s.ogrenciId} value={s.ogrenciId}>
              {s.name}
              {s.studentCode ? ` · ${s.studentCode}` : ""}
              {s.sinifBranch ? ` · ${s.sinifBranch}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!students.length ? (
        <p className="text-[11px] text-rose-700">
          Öğrencilerim listesinde aktif öğrenci yok — önce öğrenci ekleyin.
        </p>
      ) : selected ? (
        <p className="text-[11px] text-slate-500">
          Seçili: <span className="font-semibold text-slate-700">{selected.name}</span>
        </p>
      ) : (
        <p className="text-[11px] text-amber-700">
          Program eklemeden önce bir öğrenci seçin.
        </p>
      )}
    </div>
  );
}
