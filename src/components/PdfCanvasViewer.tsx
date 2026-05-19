import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

type PdfDoc = {
  numPages: number;
  getPage: (n: number) => Promise<{
    getViewport: (opts: { scale: number }) => { width: number; height: number };
    render: (ctx: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
  }>;
};

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then(async (mod) => {
      const workerUrl = (
        await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
      ).default;
      mod.GlobalWorkerOptions.workerSrc = workerUrl;
      return mod;
    });
  }
  return pdfjsPromise;
}

export function PdfCanvasViewer({ url }: { url: string }) {
  const t = useT();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const doc = (await pdfjs.getDocument({ url }).promise) as PdfDoc;
        if (cancelled) return;

        const container = containerRef.current;
        if (!container) return;
        container.innerHTML = "";

        const cssWidth = Math.min(
          container.clientWidth || 800,
          1200,
        );
        const dpr = window.devicePixelRatio || 1;

        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          if (cancelled) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const scale = cssWidth / baseViewport.width;
          const viewport = page.getViewport({ scale: scale * dpr });

          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.style.display = "block";
          canvas.style.marginBottom = "12px";
          canvas.style.background = "white";
          canvas.style.boxShadow = "0 1px 3px rgba(0,0,0,0.08)";

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          container.appendChild(canvas);
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
        if (!cancelled) setLoading(false);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError(t("paper.pdfLoadError"));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url, t]);

  return (
    <div
      className="relative w-full border border-border bg-muted p-2 md:p-4"
      onContextMenu={(e) => e.preventDefault()}
    >
      {loading && !error && (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
          <p className="font-mono text-[10px] uppercase tracking-widest">
            {t("paper.pdfLoading")}
          </p>
        </div>
      )}
      {error && (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <p className="font-display text-sm text-foreground">{error}</p>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
