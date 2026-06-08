"use client";

import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AtlasSinglePicker } from "@/components/yks-sim/atlas-single-picker";
import { loadCoaches } from "@/lib/admin/coach-storage";
import {
  DEFAULT_COACH_ID,
  GENDER_LABELS,
  KAYIT_PAKETI_OPTIONS,
  PARENT_RELATION_LABELS,
  PROGRAM_TYPE_OPTIONS,
  SINIF_OPTIONS,
  STATUS_LABELS,
  buildGoal,
  createOgrenciId,
  createStudentCode,
  emptyStudentForm,
  recordToForm,
} from "@/lib/students/constants";
import type { UniversityDegreeLevel } from "@/lib/universities/types";
import { normalizeUsernameInput } from "@/lib/auth/local-auth";
import { fetchAtlasMeta, fetchAtlasPrograms } from "@/lib/yks-sim/fetch-atlas";
import { uniqueBolumler } from "@/lib/yks-sim/atlas-filter";
import type { StudentFormState, StudentRecord } from "@/lib/students/types";
import { cn } from "@/lib/utils";

const inputCls =
  "h-12 rounded-xl border-slate-200 bg-white px-3.5 text-[15px] text-slate-900 shadow-sm";

const STEPS = [
  { n: 1, title: "Kişisel" },
  { n: 2, title: "Akademik" },
  { n: 3, title: "Veli" },
  { n: 4, title: "Panel" },
] as const;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "add" | "edit";
  initial?: StudentRecord | null;
  onSave: (record: StudentRecord) => void;
  defaultCoachId?: string;
  showCoachPicker?: boolean;
};

export function StudentWizardModal({
  open,
  onOpenChange,
  mode,
  initial,
  onSave,
  defaultCoachId,
  showCoachPicker = false,
}: Props) {
  const [step, setStep] = useState(1);
  const [unlocked, setUnlocked] = useState(1);
  const [form, setForm] = useState<StudentFormState>(emptyStudentForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPass, setShowPass] = useState(false);
  const [degreeLevel, setDegreeLevel] = useState<UniversityDegreeLevel>("lisans");
  const [universities, setUniversities] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [uniLoading, setUniLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [selectedCoachId, setSelectedCoachId] = useState(
    defaultCoachId || initial?.coachId || DEFAULT_COACH_ID
  );

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && initial) {
      setForm(recordToForm(initial));
      setSelectedCoachId(initial.coachId || defaultCoachId || DEFAULT_COACH_ID);
      setStep(1);
      setUnlocked(4);
    } else {
      setForm(emptyStudentForm());
      setSelectedCoachId(defaultCoachId || DEFAULT_COACH_ID);
      setStep(1);
      setUnlocked(1);
    }
    setErrors({});
    setShowPass(false);
  }, [open, mode, initial, defaultCoachId]);

  useEffect(() => {
    if (!open || step !== 2) return;
    let cancelled = false;
    setUniLoading(true);
    fetchAtlasMeta(degreeLevel)
      .then((meta) => {
        if (!cancelled) setUniversities(meta.universities);
      })
      .catch(() => {
        if (!cancelled) setUniversities([]);
      })
      .finally(() => {
        if (!cancelled) setUniLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, step, degreeLevel]);

  useEffect(() => {
    const uni = form.targetUniversity?.trim();
    if (!uni) {
      setDepartments([]);
      return;
    }
    let cancelled = false;
    setDeptLoading(true);
    fetchAtlasPrograms({ level: degreeLevel, universite: uni, limit: 500 })
      .then((data) => {
        if (!cancelled) setDepartments(uniqueBolumler(data.programs));
      })
      .catch(() => {
        if (!cancelled) setDepartments([]);
      })
      .finally(() => {
        if (!cancelled) setDeptLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.targetUniversity, degreeLevel]);

  const uniOptions = useMemo(() => {
    const list = universities.map((u) => ({ value: u, label: u }));
    const cur = form.targetUniversity?.trim();
    if (cur && !list.some((o) => o.value === cur)) {
      list.unshift({ value: cur, label: cur });
    }
    return list;
  }, [universities, form.targetUniversity]);

  const deptOptions = useMemo(() => {
    const list = departments.map((d) => ({ value: d, label: d }));
    const cur = form.targetDepartment?.trim();
    if (cur && !list.some((o) => o.value === cur)) {
      list.unshift({ value: cur, label: cur });
    }
    return list;
  }, [departments, form.targetDepartment]);

  const set = <K extends keyof StudentFormState>(key: K, value: StudentFormState[K]) => {
    setForm((p) => {
      const next = { ...p, [key]: value };
      if (key === "targetUniversity" || key === "targetDepartment") {
        next.goal = buildGoal(
          key === "targetUniversity" ? (value as string) : (p.targetUniversity ?? ""),
          key === "targetDepartment" ? (value as string) : (p.targetDepartment ?? "")
        );
      }
      return next;
    });
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 1 && !form.name.trim()) e.name = "Ad soyad zorunludur";
    if (s === 2) {
      if (!form.sinifBranch) e.sinifBranch = "Sınıf seçin";
      if (!form.goal.trim() && !form.targetUniversity?.trim())
        e.targetUniversity = "Hedef üniversite veya bölüm girin";
    }
    if (s === 3) {
      if (!form.parent.trim()) e.parent = "Veli adı zorunlu";
      if (!form.parentPhone.trim()) e.parentPhone = "Veli telefonu zorunlu";
    }
    if (s === 4) {
      if (showCoachPicker && !selectedCoachId) e.coachId = "Bağlı koç seçin";
      if (!normalizeUsernameInput(form.kullaniciAdi ?? ""))
        e.kullaniciAdi = "Panel kullanıcı adı zorunlu";
      if (!form.panelSifre?.trim()) e.panelSifre = "Panel şifresi zorunlu";
      else if (form.panelSifre.trim().length < 8)
        e.panelSifre = "Panel şifresi en az 8 karakter olmalı";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    const next = Math.min(4, step + 1);
    setStep(next);
    setUnlocked((u) => Math.max(u, next));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = () => {
    for (const s of [1, 2, 3, 4] as const) {
      if (!validateStep(s)) {
        setStep(s);
        return;
      }
    }
    const code = form.studentCode?.trim() || createStudentCode();
    const record: StudentRecord = {
      ...form,
      ogrenciId: initial?.ogrenciId ?? createOgrenciId(),
      coachId: selectedCoachId || initial?.coachId || defaultCoachId || DEFAULT_COACH_ID,
      name: form.name.trim(),
      studentCode: code,
      goal: form.goal.trim() || buildGoal(form.targetUniversity ?? "", form.targetDepartment ?? ""),
      parent: form.parent.trim(),
      parentPhone: form.parentPhone.trim(),
      kullaniciAdi: normalizeUsernameInput(form.kullaniciAdi ?? ""),
      kayitDate: form.kayitDate || new Date().toISOString().slice(0, 10),
    };
    onSave(record);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-[640px]"
        onEscapeKeyDown={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === "add" ? "Yeni Öğrenci Kaydı" : "Öğrenciyi Düzenle"}
          </DialogTitle>
          <DialogDescription>
            4 adımda öğrenci bilgilerini tamamlayın.
          </DialogDescription>
        </DialogHeader>

        <nav className="mb-6 flex gap-2" aria-label="Kayıt adımları">
          {STEPS.map(({ n, title }) => (
            <button
              key={n}
              type="button"
              disabled={n > unlocked}
              onClick={() => n <= unlocked && setStep(n)}
              className={cn(
                "flex-1 rounded-full py-2 text-center text-[11px] font-bold transition",
                step === n
                  ? "bg-slate-900 text-white"
                  : n <= unlocked
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-slate-50 text-slate-300 cursor-not-allowed"
              )}
            >
              {n}. {title}
            </button>
          ))}
        </nav>

        {step === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Ad Soyad *</Label>
              <Input id="name" className={inputCls} value={form.name} onChange={(e) => set("name", e.target.value)} />
              {errors.name && <p className="text-[11px] text-red-600">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tcNo">TC Kimlik No</Label>
              <Input id="tcNo" maxLength={11} className={inputCls} value={form.tcNo ?? ""} onChange={(e) => set("tcNo", e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="space-y-1.5">
              <Label>Cinsiyet</Label>
              <Select value={form.gender ?? ""} onValueChange={(v) => set("gender", v as StudentFormState["gender"])}>
                <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(GENDER_LABELS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="birthDate">Doğum Tarihi</Label>
              <Input id="birthDate" type="date" className={inputCls} value={form.birthDate ?? ""} onChange={(e) => set("birthDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-posta</Label>
              <Input id="email" type="email" className={inputCls} value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" className={inputCls} value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city">İl</Label>
              <Input id="city" className={inputCls} value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ilce">İlçe</Label>
              <Input id="ilce" className={inputCls} value={form.ilce ?? ""} onChange={(e) => set("ilce", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="studentCode">Öğrenci Kodu</Label>
              <Input id="studentCode" className={inputCls} placeholder="Boş bırakılırsa otomatik" value={form.studentCode} onChange={(e) => set("studentCode", e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Sınıf *</Label>
              <Select value={form.sinifBranch} onValueChange={(v) => set("sinifBranch", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SINIF_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Alan</Label>
              <Select value={form.alan} onValueChange={(v) => set("alan", v as StudentFormState["alan"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="tyt">TYT</SelectItem>
                  <SelectItem value="sayisal">Sayısal</SelectItem>
                  <SelectItem value="esit">Eşit Ağırlık</SelectItem>
                  <SelectItem value="sozel">Sözel</SelectItem>
                  <SelectItem value="dil">Dil</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Program türü</Label>
              <Select
                value={degreeLevel}
                onValueChange={(v) => {
                  setDegreeLevel(v as UniversityDegreeLevel);
                  set("targetUniversity", "");
                  set("targetDepartment", "");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lisans">Lisans (4 yıl)</SelectItem>
                  <SelectItem value="onlisans">Önlisans (2 yıl)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <AtlasSinglePicker
                label="Hedef Üniversite"
                options={uniOptions}
                value={form.targetUniversity ?? ""}
                onChange={(v) => {
                  set("targetUniversity", v);
                  set("targetDepartment", "");
                }}
                placeholder="Üniversite seçin"
                disabled={uniLoading}
                loading={uniLoading}
                emptyHint="Üniversite bulunamadı"
              />
              {errors.targetUniversity && (
                <p className="text-[11px] text-red-600">{errors.targetUniversity}</p>
              )}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <AtlasSinglePicker
                label="Hedef Bölüm"
                options={deptOptions}
                value={form.targetDepartment ?? ""}
                onChange={(v) => set("targetDepartment", v)}
                placeholder={form.targetUniversity ? "Bölüm seçin" : "Önce üniversite seçin"}
                disabled={!form.targetUniversity || deptLoading}
                loading={deptLoading}
                emptyHint="Bölüm bulunamadı"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Hedef Özeti</Label>
              <Input className={inputCls} readOnly value={form.goal} />
            </div>
            <div className="space-y-1.5">
              <Label>Koç</Label>
              <Input className={inputCls} value={form.counselorName ?? ""} onChange={(e) => set("counselorName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Kayıt Paketi</Label>
              <Select value={form.kayitPaketi ?? ""} onValueChange={(v) => set("kayitPaketi", v)}>
                <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                <SelectContent>
                  {KAYIT_PAKETI_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Program</Label>
              <Select value={form.programType ?? ""} onValueChange={(v) => set("programType", v)}>
                <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                <SelectContent>
                  {PROGRAM_TYPE_OPTIONS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="kayitDate">Kayıt Tarihi</Label>
              <Input id="kayitDate" type="date" className={inputCls} value={form.kayitDate} onChange={(e) => set("kayitDate", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="burs">Burs %</Label>
              <Input id="burs" type="number" min={0} max={100} className={inputCls} value={form.bursPercent ?? 0} onChange={(e) => set("bursPercent", Number(e.target.value))} />
            </div>
            {mode === "edit" && (
              <div className="space-y-2 sm:col-span-2">
                <Label>Durum</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => set("status", st)}
                      className={cn(
                        "rounded-full px-4 py-2 text-[12px] font-semibold transition",
                        form.status === st ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                      )}
                    >
                      {STATUS_LABELS[st]}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="address">Adres</Label>
              <textarea id="address" rows={2} className={cn(inputCls, "w-full resize-none py-2")} value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="notes">Notlar</Label>
              <textarea id="notes" rows={2} className={cn(inputCls, "w-full resize-none py-2")} value={form.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="parent">Veli Ad Soyad *</Label>
              <Input id="parent" className={inputCls} value={form.parent} onChange={(e) => set("parent", e.target.value)} />
              {errors.parent && <p className="text-[11px] text-red-600">{errors.parent}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Yakınlık</Label>
              <Select value={form.parentRelation ?? ""} onValueChange={(v) => set("parentRelation", v as StudentFormState["parentRelation"])}>
                <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PARENT_RELATION_LABELS).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="parentPhone">Veli Telefon *</Label>
              <Input id="parentPhone" className={inputCls} value={form.parentPhone} onChange={(e) => set("parentPhone", e.target.value)} />
              {errors.parentPhone && <p className="text-[11px] text-red-600">{errors.parentPhone}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="parentEmail">Veli E-posta</Label>
              <Input id="parentEmail" type="email" className={inputCls} value={form.parentEmail ?? ""} onChange={(e) => set("parentEmail", e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="emergency">Acil Durum Notu</Label>
              <textarea id="emergency" rows={3} className={cn(inputCls, "w-full resize-none py-2")} value={form.emergencyNotes ?? ""} onChange={(e) => set("emergencyNotes", e.target.value)} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="grid gap-3">
            {showCoachPicker ? (
              <div className="space-y-1.5">
                <Label>Bağlı koç *</Label>
                <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                  <SelectTrigger className={inputCls}>
                    <SelectValue placeholder="Koç seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadCoaches().map((c) => (
                      <SelectItem key={c.coachId} value={c.coachId}>
                        {c.displayName || c.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.coachId ? (
                  <p className="text-[11px] text-red-600">{errors.coachId}</p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="kullaniciAdi">Panel Kullanıcı Adı</Label>
              <Input
                id="kullaniciAdi"
                className={inputCls}
                value={form.kullaniciAdi ?? ""}
                onChange={(e) => set("kullaniciAdi", e.target.value)}
                placeholder="Öğrenci panel giriş adı"
                autoComplete="off"
                spellCheck={false}
              />
              {errors.kullaniciAdi && (
                <p className="text-[11px] text-red-600">{errors.kullaniciAdi}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="panelSifre">Panel Şifresi</Label>
              <div className="relative">
                <Input
                  id="panelSifre"
                  type={showPass ? "text" : "password"}
                  className={cn(inputCls, "pr-10")}
                  value={form.panelSifre ?? ""}
                  onChange={(e) => set("panelSifre", e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Şifreyi gizle" : "Şifreyi göster"}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.panelSifre && (
                <p className="text-[11px] text-red-600">{errors.panelSifre}</p>
              )}
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-3 text-[12px] leading-relaxed text-slate-600">
              <p>
                Panel kullanıcı adı ve şifresini siz belirlersiniz. Öğrencinize güvenli bir kanaldan
                iletmenizi rica ederiz.
              </p>
              <p className="mt-1.5 text-slate-500">
                Unutulma, yanlış yazım veya paylaşım kaynaklı giriş sorunlarında platform tarafı
                sorumluluk üstlenmez; gerekirse kayıt sonrası bu ekrandan bilgileri
                güncelleyebilirsiniz.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <div className="flex gap-2">
            {step > 1 && (
              <Button type="button" variant="outline" className="rounded-xl" onClick={goBack}>
                Geri
              </Button>
            )}
            {step < 4 ? (
              <Button type="button" variant="primary" onClick={goNext}>
                İleri
              </Button>
            ) : (
              <Button type="button" variant="primary" onClick={handleSubmit}>
                {mode === "add" ? "Kaydı tamamla" : "Değişiklikleri kaydet"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
