export type ConfidenceLevel = "high" | "medium" | "low";

export type ColumnRole =
  | "tc"
  | "student_no"
  | "student_id_name"
  | "name"
  | "class_branch"
  | "booklet"
  | "test_block"
  | "unknown"
  | "ignore";

export type TxtDelimiter = "tab" | "semicolon" | "comma" | "space" | "smart";

export interface ColumnHypothesis {
  index: number;
  role: ColumnRole;
  label: string;
  confidence: ConfidenceLevel;
  testBlockLength?: number;
  /** Örnek hücre (önizleme) */
  sample?: string;
}

export interface ParseEngineReport {
  version: 2;
  delimiter: TxtDelimiter;
  delimiterLabel: string;
  rawLineCount: number;
  columnCount: number;
  compositeCellsSplit: number;
  warnings: string[];
  /** Sütun başına eşleşme oranı özeti */
  columnScores: { index: number; role: ColumnRole; score: number }[];
}

export interface ParsedTxtFile {
  delimiter: TxtDelimiter;
  rawLineCount: number;
  rows: string[][];
  columns: ColumnHypothesis[];
  report: ParseEngineReport;
}

export interface ColumnMappingState {
  byIndex: Record<number, ColumnRole>;
}

export interface MappedTxtRow {
  tc: string;
  studentNo: string;
  name: string;
  booklet: string;
  classBranch: string;
  answers: string;
  rawCells: string[];
}
