import { OnyxApp } from "@/components/onyx/onyx-app";

export const metadata = {
  title: "Onyx AI | Öğrenci",
  description: "Soru fotoğrafı ve yazılı soru çözümü — Onyx akademik asistan",
};

export default function StudentOnyxPage() {
  return (
    <div className="onyx-page-host -mx-9 -mb-0 flex min-h-0 flex-1 flex-col overflow-hidden">
      <OnyxApp role="student" className="min-h-0 flex-1 h-full w-full" />
    </div>
  );
}
