export type AppointmentStatus = "bekliyor" | "tamamlandi" | "iptal";

export type AppointmentTip = "yuz_yuze" | "online" | "telefon";

export interface Appointment {
  id: string;
  studentId: string;
  ogrenci: string;
  tarih: string;
  saat: string;
  sure: number;
  tip: AppointmentTip;
  status: AppointmentStatus;
  konu: string;
  notlar: string;
  yer: string;
  ts: number;
}

export type StatusFilterKey = "all" | "upcoming" | "done" | "cancelled";

export type TypeFilterKey = "all" | "yuz_yuze" | "online";

export interface AppointmentFormValues {
  studentId: string;
  tarih: string;
  saat: string;
  sure: number;
  tip: AppointmentTip;
  status: AppointmentStatus;
  konu: string;
  notlar: string;
  yer: string;
  notifyStudent: boolean;
}

export interface StudentRosterEntry {
  id: string;
  name: string;
  studentCode?: string;
  ogrenciId?: string;
  phone?: string;
  telefon?: string;
  gsm?: string;
  parentPhone?: string;
  kullaniciAdi?: string;
  sinifBranch?: string;
}

export interface StudentNotification {
  type: string;
  text: string;
  read: boolean;
}

export interface CurrentUser {
  id?: string;
  ogrenciId?: string;
  name?: string;
  studentCode?: string;
  code?: string;
  kullaniciAdi?: string;
}
