import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n";

let pdfjsPromise: Promise<typeof import("pdfjs-dist")> | null = null;
async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((mod) => {
      // Serve the worker from our own origin: the site CSP forbids third-party scripts.
      mod.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
      ).toString();
      return mod;
    });
  }
  return pdfjsPromise;
}

const FLIP_MS = 650;

type Flip = { dir: "next" | "prev"; from: number; to: number };

/**
 * PDF reader shown as a book.
 *
 * Inline, only the cover is shown, sized to fit the screen. Clicking it opens a
 * full-screen reader: on wide screens an open book (two pages side by side,
 * starting with the cover on the left), on phones and narrow windows one page
 * at a time. Pages turn with an animation on Space, arrow keys, the buttons,
 * a click on either half of the book or a swipe.
 */
export function PdfCanvasViewer({ url }: { url: string }) {
  const t = useT();
  const pdfLoadError = t("paper.pdfLoadError");
  const [pages, setPages] = useState<string[]>([]);
  const [numPages, setNumPages] = useState(0);
  const [aspect, setAspect] = useState(210 / 297);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // Render every page once to a JPEG blob; the book only swaps images.
  useEffect(() => {
    let cancelled = false;
    const created: string[] = [];
    setPages([]);
    setNumPages(0);
    setError(null);

    (async () => {
      try {
        const pdfjs = await loadPdfjs();
        const doc = await pdfjs.getDocument({
          url,
          standardFontDataUrl: "/pdfjs/standard_fonts/",
          cMapUrl: "/pdfjs/cmaps/",
          cMapPacked: true,
        }).promise;
        if (cancelled) return;
        setNumPages(doc.numPages);

        const dpr = window.devicePixelRatio || 1;
        const targetH = Math.min(2200, Math.ceil(Math.max(window.screen.height, 900) * dpr));

        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          if (i === 1) setAspect(base.width / base.height);
          const viewport = page.getViewport({ scale: targetH / base.height });
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport }).promise;
          const blob = await new Promise<Blob | null>((res) =>
            canvas.toBlob(res, "image/jpeg", 0.9),
          );
          if (cancelled || !blob) return;
          const objectUrl = URL.createObjectURL(blob);
          created.push(objectUrl);
          setPages((prev) => [...prev, objectUrl]);
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setError(pdfLoadError);
        }
      }
    })();

    return () => {
      cancelled = true;
      created.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [url, pdfLoadError]);

  const cover = pages[0];

  return (
    <div className="w-full" onContextMenu={(e) => e.preventDefault()}>
      {error ? (
        <p className="py-12 text-center font-display text-sm text-foreground">{error}</p>
      ) : !cover ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-border border-t-foreground rounded-full animate-spin" />
          <p className="font-mono text-[10px] uppercase tracking-widest">{t("paper.pdfLoading")}</p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative mx-auto block cursor-pointer"
          style={{ width: `min(100%, calc(min(72vh, 640px) * ${aspect}))` }}
          aria-label={t("paper.pdfOpen")}
        >
          <img
            src={cover}
            alt=""
            draggable={false}
            className="block w-full h-auto shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:-translate-y-1"
          />
          <span className="absolute inset-x-0 bottom-4 mx-auto w-max rounded-full bg-black/70 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[#d8b45a] opacity-90 transition-opacity group-hover:opacity-100">
            {t("paper.pdfOpen")}
            {numPages > 0 ? ` · ${numPages}` : ""}
          </span>
        </button>
      )}

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <BookReader
            pages={pages}
            numPages={numPages}
            aspect={aspect}
            onClose={() => setOpen(false)}
          />,
          document.body,
        )}
    </div>
  );
}

function useViewport() {
  const [size, setSize] = useState(() => ({
    w: typeof window === "undefined" ? 1200 : window.innerWidth,
    h: typeof window === "undefined" ? 800 : window.innerHeight,
  }));
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

function BookReader({
  pages,
  numPages,
  aspect,
  onClose,
}: {
  pages: string[];
  numPages: number;
  aspect: number;
  onClose: () => void;
}) {
  const t = useT();
  const { w, h } = useViewport();
  const twoUp = w >= 900 && w > h * 1.05;
  const step = twoUp ? 2 : 1;

  // First visible page (0-based). In the open-book layout it is always even,
  // so every spread is [cover | 2], [3 | 4], …
  const [pos, setPos] = useState(0);
  const [flip, setFlip] = useState<Flip | null>(null);
  const current = twoUp ? pos - (pos % 2) : pos;

  const barH = 52;
  const pad = w < 640 ? 12 : 32;
  const availW = w - pad * 2;
  const availH = h - barH - pad * 2;
  const pageH = Math.floor(Math.min(availH, (twoUp ? availW / 2 : availW) / aspect));
  const pageW = Math.floor(pageH * aspect);

  const total = numPages || pages.length;
  const canNext = current + step < total;
  const canPrev = current > 0;

  const go = useCallback(
    (dir: "next" | "prev") => {
      if (flip) return;
      if (dir === "next" && !canNext) return;
      if (dir === "prev" && !canPrev) return;
      const to = dir === "next" ? current + step : Math.max(0, current - step);
      setFlip({ dir, from: current, to });
      window.setTimeout(() => {
        setPos(to);
        setFlip(null);
      }, FLIP_MS);
    },
    [flip, canNext, canPrev, current, step],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) {
        e.preventDefault();
        go("next");
      } else if (e.key === "ArrowLeft" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) {
        e.preventDefault();
        go("prev");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const touchX = useRef<number | null>(null);

  const label = useMemo(() => {
    const shown = flip ? flip.to : current;
    const last = twoUp ? Math.min(shown + 2, total) : shown + 1;
    const range = last > shown + 1 ? `${shown + 1}–${last}` : `${shown + 1}`;
    return `${t("paper.pdfPage")} ${range} / ${total}`;
  }, [flip, current, twoUp, total, t]);

  const pageImg = (i: number) =>
    i >= 0 && i < total ? (
      pages[i] ? (
        <img
          src={pages[i]}
          alt=""
          draggable={false}
          className="block h-full w-full select-none bg-white"
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-neutral-200" />
      )
    ) : null;

  const slot = (i: number, side: "left" | "right" | "single") => (
    <div
      className="absolute top-0 h-full"
      style={{
        width: pageW,
        left: side === "right" ? pageW : 0,
        boxShadow: i >= 0 && i < total ? "0 10px 30px rgba(0,0,0,0.45)" : undefined,
      }}
    >
      {pageImg(i)}
    </div>
  );

  // Static pages under the turning leaf, and the leaf itself.
  let layers: React.ReactNode;
  if (twoUp) {
    const L = current;
    if (!flip) {
      layers = (
        <>
          {slot(L, "left")}
          {slot(L + 1, "right")}
        </>
      );
    } else if (flip.dir === "next") {
      layers = (
        <>
          {slot(L, "left")}
          {slot(L + 3, "right")}
          <Leaf
            left={pageW}
            width={pageW}
            origin="left"
            anim="am-flip-next"
            front={pageImg(L + 1)}
            back={pageImg(L + 2)}
          />
        </>
      );
    } else {
      layers = (
        <>
          {slot(L - 2, "left")}
          {slot(L + 1, "right")}
          <Leaf
            left={0}
            width={pageW}
            origin="right"
            anim="am-flip-prev"
            front={pageImg(L)}
            back={pageImg(L - 1)}
          />
        </>
      );
    }
  } else if (!flip) {
    layers = slot(current, "single");
  } else if (flip.dir === "next") {
    layers = (
      <>
        {slot(flip.to, "single")}
        <Leaf
          left={0}
          width={pageW}
          origin="left"
          anim="am-flip-next"
          front={pageImg(flip.from)}
          back={null}
        />
      </>
    );
  } else {
    layers = (
      <>
        {slot(flip.from, "single")}
        <Leaf
          left={0}
          width={pageW}
          origin="left"
          anim="am-flip-back-in"
          front={pageImg(flip.to)}
          back={null}
        />
      </>
    );
  }

  const bookW = twoUp ? pageW * 2 : pageW;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0b0b0b]/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{`
        @keyframes am-flip-next { from { transform: rotateY(0deg); } to { transform: rotateY(-180deg); } }
        @keyframes am-flip-prev { from { transform: rotateY(0deg); } to { transform: rotateY(180deg); } }
        @keyframes am-flip-back-in { from { transform: rotateY(-180deg); } to { transform: rotateY(0deg); } }
      `}</style>

      <div
        className="flex items-center justify-between px-4 text-[#d8b45a]"
        style={{ height: barH }}
      >
        <span className="font-mono text-[11px] uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-1">
          <ToolbarButton label={t("paper.pdfPrev")} disabled={!canPrev} onClick={() => go("prev")}>
            <path d="M15 18l-6-6 6-6" />
          </ToolbarButton>
          <ToolbarButton label={t("paper.pdfNext")} disabled={!canNext} onClick={() => go("next")}>
            <path d="M9 18l6-6-6-6" />
          </ToolbarButton>
          <ToolbarButton label={t("paper.pdfClose")} onClick={onClose}>
            <path d="M6 6l12 12M18 6L6 18" />
          </ToolbarButton>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        onTouchStart={(e) => {
          touchX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchX.current;
          touchX.current = null;
          const end = e.changedTouches[0]?.clientX;
          if (start == null || end == null) return;
          if (end - start < -40) go("next");
          else if (end - start > 40) go("prev");
        }}
      >
        <div
          className="relative cursor-pointer"
          style={{ width: bookW, height: pageH, perspective: pageW * 4 }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            if (e.clientX - rect.left > rect.width / 2) go("next");
            else go("prev");
          }}
        >
          {layers}
          {twoUp && (
            <div
              className="pointer-events-none absolute top-0 h-full"
              style={{
                left: pageW - 18,
                width: 36,
                background:
                  "linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.28) 50%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0) 100%)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Leaf({
  left,
  width,
  origin,
  anim,
  front,
  back,
}: {
  left: number;
  width: number;
  origin: "left" | "right";
  anim: string;
  front: React.ReactNode;
  back: React.ReactNode;
}) {
  return (
    <div
      className="absolute top-0 h-full"
      style={{
        left,
        width,
        transformStyle: "preserve-3d",
        transformOrigin: `${origin} center`,
        animation: `${anim} ${FLIP_MS}ms cubic-bezier(0.645, 0.045, 0.355, 1) forwards`,
        zIndex: 5,
      }}
    >
      <div
        className="absolute inset-0"
        style={{ backfaceVisibility: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.45)" }}
      >
        {front}
      </div>
      <div
        className="absolute inset-0"
        style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
      >
        {back}
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      <svg
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {children}
      </svg>
    </button>
  );
}
