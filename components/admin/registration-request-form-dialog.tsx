"use client";

import { useEffect, useState } from "react";

import type { RegistrationRequestRecord } from "@/lib/admin/registration-requests";
import { REGISTER_ROLE_LABELS, type RegisterRole } from "@/lib/marketing/registration-request";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
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

const inputCls =
  "h-11 rounded-xl border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm";

export type RegistrationRequestDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message?: string;
  role: RegisterRole;
  status: RegistrationRequestRecord["status"];
  planName?: string;
  billingPeriod?: "aylik" | "yillik";
  organization?: string;
  teamSize?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: RegistrationRequestRecord | null;
  onSave: (draft: RegistrationRequestDraft) => void;
};

export function RegistrationRequestFormDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState<RegisterRole>("koc");
  const [status, setStatus] = useState<RegistrationRequestRecord["status"]>("yeni");
  const [planName, setPlanName] = useState("");
  const [billingPeriod, setBillingPeriod] = useState<"aylik" | "yillik" | "">("");
  const [organization, setOrganization] = useState("");
  const [teamSize, setTeamSize] = useState("");

  useEffect(() => {
    if (!open || !initial) return;
    setFirstName(initial.firstName);
    setLastName(initial.lastName);
    setEmail(initial.email);
    setPhone(initial.phone ?? "");
    setMessage(initial.message ?? "");
    setRole(initial.role);
    setStatus(initial.status);
    setPlanName(initial.planName ?? "");
    setBillingPeriod(initial.billingPeriod ?? "");
    setOrganization(initial.organization ?? "");
    setTeamSize(initial.teamSize ?? "");
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      firstName,
      lastName,
      email,
      phone: phone || undefined,
      message: message || undefined,
      role,
      status,
      planName: planName || undefined,
      billingPeriod: billingPeriod || undefined,
      organization: organization || undefined,
      teamSize: teamSize || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Teklif talebini düzenle</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="req-first">Ad *</Label>
              <Input
                id="req-first"
                className={inputCls}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-last">Soyad *</Label>
              <Input
                id="req-last"
                className={inputCls}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-email">E-posta *</Label>
            <Input
              id="req-email"
              type="email"
              className={inputCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-phone">Telefon</Label>
            <Input
              id="req-phone"
              className={inputCls}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Rol</Label>
              <Select value={role} onValueChange={(v) => setRole(v as RegisterRole)}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(REGISTER_ROLE_LABELS) as RegisterRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      {REGISTER_ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Durum</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as RegistrationRequestRecord["status"])}
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yeni">Yeni</SelectItem>
                  <SelectItem value="okundu">Okundu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-plan">Paket</Label>
            <Input
              id="req-plan"
              className={inputCls}
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Faturalandırma</Label>
              <Select
                value={billingPeriod || "none"}
                onValueChange={(v) =>
                  setBillingPeriod(v === "none" ? "" : (v as "aylik" | "yillik"))
                }
              >
                <SelectTrigger className={inputCls}>
                  <SelectValue placeholder="Seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Belirtilmedi</SelectItem>
                  <SelectItem value="aylik">Aylık</SelectItem>
                  <SelectItem value="yillik">Yıllık</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="req-team">Ekip / ölçek</Label>
              <Input
                id="req-team"
                className={inputCls}
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-org">Kurum / okul</Label>
            <Input
              id="req-org"
              className={inputCls}
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="req-msg">Not</Label>
            <textarea
              id="req-msg"
              className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              İptal
            </Button>
            <Button variant="primary" type="submit">
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
