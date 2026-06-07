import { flattenModernColorsInClone } from "@/lib/html-export/html2canvas-onclone";
import { STORY_HEIGHT, STORY_WIDTH } from "./constants";
import type { StoryKind } from "./types";
import { waitForImages } from "./templates/engine-port";

export type ExportStoryParams = {
  kind: StoryKind;
  style: string;
  examId?: string;
};

function buildFilename({ kind, style, examId }: ExportStoryParams): string {
  return `story-${kind}${style ? `-stil${style}` : ""}${examId ? `-${examId}` : ""}.png`;
}

/** ESKİ downloadPngFromStory — html2canvas 1080×1920 PNG */
export async function downloadPngFromStory(params: ExportStoryParams): Promise<void> {
  const story = document.getElementById("pm-story-root");
  if (!story) return;

  const html2canvas = (await import("html2canvas")).default;
  const fn = buildFilename(params);

  const waitFonts =
    document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  await waitFonts;
  await waitForImages(story, 15000);

  const canvas = await html2canvas(story, {
    scale: 1,
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    backgroundColor: "transparent",
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 15000,
    foreignObjectRendering: true,
    onclone: (clonedDoc) => {
      try {
        flattenModernColorsInClone(clonedDoc);
        if (!clonedDoc?.getElementById) return;
        const el = clonedDoc.getElementById("pm-story-root");
        if (!el) return;

        clonedDoc.body.innerHTML = "";
        clonedDoc.documentElement.style.background = "transparent";
        clonedDoc.body.style.background = "transparent";
        clonedDoc.body.style.margin = "0";
        clonedDoc.body.style.padding = "0";

        const stage = clonedDoc.createElement("div");
        stage.style.position = "fixed";
        stage.style.left = "0";
        stage.style.top = "0";
        stage.style.width = `${STORY_WIDTH}px`;
        stage.style.height = `${STORY_HEIGHT}px`;
        stage.style.margin = "0";
        stage.style.padding = "0";
        stage.style.background = "transparent";
        stage.appendChild(el);
        clonedDoc.body.appendChild(stage);

        el.style.width = `${STORY_WIDTH}px`;
        el.style.height = `${STORY_HEIGHT}px`;
        el.style.margin = "0";
        el.style.left = "0";
        el.style.top = "0";
        el.style.position = "relative";
        el.style.transform = "translateZ(0)";
        el.style.borderRadius = "40px";
        el.style.overflow = "hidden";

        const imgs = el.querySelectorAll("img");
        imgs.forEach((im) => {
          const src = im.getAttribute("src");
          if (!src) {
            im.parentNode?.removeChild(im);
            return;
          }
          if (
            (im.naturalWidth === 0 && im.naturalHeight === 0) ||
            im.width === 0 ||
            im.height === 0
          ) {
            im.style.display = "none";
          }
        });

        el.querySelectorAll("canvas").forEach((c) => {
          if (!c.width || !c.height) c.parentNode?.removeChild(c);
        });

        el.querySelectorAll<HTMLElement>("*").forEach((node) => {
          if (!node.style) return;
          node.style.backdropFilter = "none";
          (node.style as CSSStyleDeclaration & { webkitBackdropFilter?: string }).webkitBackdropFilter = "none";
        });
      } catch {
        /* ignore clone cleanup */
      }
    },
  });

  if (!canvas?.width || !canvas.height) {
    throw new Error("Canvas boş üretildi");
  }

  const done = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fn;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (canvas.toBlob) {
    await new Promise<void>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            done(canvas.toDataURL("image/png"));
            resolve();
            return;
          }
          const url = URL.createObjectURL(blob);
          done(url);
          setTimeout(() => {
            try {
              URL.revokeObjectURL(url);
            } catch {
              /* ignore */
            }
          }, 2000);
          resolve();
        },
        "image/png"
      );
    });
  } else {
    done(canvas.toDataURL("image/png"));
  }
}
