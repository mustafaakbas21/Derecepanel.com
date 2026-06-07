export type {
  ColumnHypothesis,
  ColumnMappingState,
  ColumnRole,
  ConfidenceLevel,
  MappedTxtRow,
  ParseEngineReport,
  ParsedTxtFile,
  TxtDelimiter,
} from "@/lib/txtParser/types";

export { parseTxtFileV2 } from "@/lib/txtParser/engine-v2";

export {
  applyColumnMapping,
  buildInitialMapping,
  canSimulateMapping,
  COLUMN_ROLE_OPTIONS,
  getMappedRole,
  hypothesisForColumn,
  updateColumnMapping,
} from "@/lib/txtParser/mapping";

export {
  buildMappingSummary,
  buildMappingStudentPreview,
  formatCellPreview,
  type MappingStudentPreviewRow,
  type MappingSummaryItem,
} from "@/lib/txtParser/mapping-summary";

/** Geriye dönük — V2 motor */
export { parseTxtFileV2 as parseTxtFile } from "@/lib/txtParser/engine-v2";
