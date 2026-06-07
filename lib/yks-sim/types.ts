import type { YokAtlasProgram } from "@/lib/universities/types";

export type YksSimUser = {
  id?: string;
  ogrenciId?: string;
  name?: string;
  studentCode?: string;
  kullaniciAdi?: string;
  username?: string;
  email?: string;
  goal?: string;
};

export type StudentTargetPayload = {
  universite: string;
  bolum: string;
  fakulteYO?: string;
  sehir?: string;
  puanTipi?: string;
  programKodu?: string;
  taban?: string;
  basari?: string;
  year?: string;
  setAt?: string;
  university?: string;
  department?: string;
};

export type TercihFromPuanPayload = {
  v: 1;
  ts: number;
  primaryPuanTipi: string;
  obpContribution: number;
  puanlar: Record<string, number | null>;
  ham: Record<string, number | null>;
};

export type NsBranchId =
  | "tyt_tr"
  | "tyt_mat"
  | "tyt_fen"
  | "tyt_sos"
  | "ayt_mat"
  | "ayt_fiz"
  | "ayt_kim"
  | "ayt_bio"
  | "ayt_edb"
  | "ayt_tar1"
  | "ayt_cog1"
  | "ayt_tar2"
  | "ayt_cog2"
  | "ayt_dil";

export type AtlasRow = YokAtlasProgram & { _search?: string };
