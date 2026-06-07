"use client";

import { useEffect, useState } from "react";

import type { Institution, InstitutionDraft } from "@/lib/admin/institutions";
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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: Institution | null;
  onSave: (draft: InstitutionDraft) => void;
};

export function InstitutionFormDialog({ open, onOpenChange, initial, onSave }: Props) {
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"Aktif" | "Pasif">("Aktif");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setContactName(initial?.contactName ?? "");
    setPhone(initial?.phone ?? "");
    setEmail(initial?.email ?? "");
    setStatus(initial?.status ?? "Aktif");
  }, [open, initial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      contactName: contactName || undefined,
      phone: phone || undefined,
      email: email || undefined,
      status,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Kurumu düzenle" : "Yeni kurum"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="inst-name">Kurum adı *</Label>
            <Input
              id="inst-name"
              className={inputCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="inst-contact">Yetkili</Label>
            <Input
              id="inst-contact"
              className={inputCls}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inst-phone">Telefon</Label>
              <Input
                id="inst-phone"
                className={inputCls}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inst-email">E-posta</Label>
              <Input
                id="inst-email"
                type="email"
                className={inputCls}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Durum</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "Aktif" | "Pasif")}>
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Aktif">Aktif</SelectItem>
                <SelectItem value="Pasif">Pasif</SelectItem>
              </SelectContent>
            </Select>
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
