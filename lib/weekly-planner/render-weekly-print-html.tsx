import { renderToStaticMarkup } from "react-dom/server";

import {
  WeeklyPrintDocument,
  type WeeklyPrintDocumentProps,
} from "@/components/weekly-planner/weekly-print-document";

/** DOM’a bağlı kalmadan yazdırma HTML’i üretir */
export function renderWeeklyPrintSheetHtml(props: WeeklyPrintDocumentProps): string {
  return renderToStaticMarkup(<WeeklyPrintDocument {...props} forExport />);
}
