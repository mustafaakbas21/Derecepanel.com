import { Construction } from "lucide-react";

import {
  LIBRARY_PAGE_CLASS,
  LIBRARY_PANEL_CLASS,
  LIBRARY_PANEL_INNER,
  LibraryPageHeader,
} from "@/components/library/library-shell";

type Props = {
  title: string;
  description: string;
};

export function StudentPlaceholderPage({ title, description }: Props) {
  return (
    <div className={LIBRARY_PAGE_CLASS}>
      <LibraryPageHeader title={title} description={description} />
      <div className={LIBRARY_PANEL_CLASS}>
        <div className={`${LIBRARY_PANEL_INNER} flex flex-col items-center justify-center py-16 text-center`}>
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: "#fff7ed" }}
          >
            <Construction className="h-7 w-7 text-orange-500" strokeWidth={2} />
          </div>
          <p className="text-lg font-semibold text-slate-900">Yakında</p>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-slate-500">
            Bu bölüm üzerinde çalışıyoruz. Koçunuz atama yaptığında veya modül
            hazır olduğunda burada görünecek.
          </p>
        </div>
      </div>
    </div>
  );
}
