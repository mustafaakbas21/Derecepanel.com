"use client";

import { useEffect, useState } from "react";

import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TRANSACTION_CATEGORY_LABELS,
  type AccountingDraft,
  type AccountingTransaction,
  type PaymentStatus,
  type TransactionCategory,
  type TransactionType,
} from "@/lib/admin/accounting";
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
  initial?: AccountingTransaction | null;
  onSave: (draft: AccountingDraft) => void;
};

export function AccountingFormDialog({ open, onOpenChange, initial, onSave }: Props) {
  const [type, setType] = useState<TransactionType>("gelir");
  const [category, setCategory] = useState<TransactionCategory>("ogrenci_ucreti");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("odendi");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setType(initial?.type ?? "gelir");
    setCategory(initial?.category ?? "ogrenci_ucreti");
    setTitle(initial?.title ?? "");
    setAmount(initial ? String(initial.amount) : "");
    setDate(initial?.date ?? new Date().toISOString().slice(0, 10));
    setStatus(initial?.status ?? "odendi");
    setDescription(initial?.description ?? "");
  }, [open, initial]);

  useEffect(() => {
    const cats = type === "gelir" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!cats.includes(category)) {
      setCategory(cats[0]!);
    }
  }, [type, category]);

  const categories = type === "gelir" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      category,
      title,
      amount: Number(amount),
      date,
      status,
      description: description || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{initial ? "Kaydı düzenle" : "Yeni muhasebe kaydı"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>İşlem türü</Label>
              <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gelir">Gelir</SelectItem>
                  <SelectItem value="gider">Gider</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as TransactionCategory)}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {TRANSACTION_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-title">Başlık *</Label>
            <Input
              id="acc-title"
              className={inputCls}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="acc-amount">Tutar (₺) *</Label>
              <Input
                id="acc-amount"
                type="number"
                min="0"
                step="0.01"
                className={inputCls}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-date">Tarih *</Label>
              <Input
                id="acc-date"
                type="date"
                className={inputCls}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Durum</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PaymentStatus)}>
              <SelectTrigger className={inputCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="odendi">Ödendi</SelectItem>
                <SelectItem value="beklemede">Beklemede</SelectItem>
                <SelectItem value="iptal">İptal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-desc">Açıklama</Label>
            <textarea
              id="acc-desc"
              className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none focus:ring-2 focus:ring-slate-200"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
