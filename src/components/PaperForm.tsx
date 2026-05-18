import { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export interface PaperFormValues {
  slug: string;
  title: string;
  abstract: string;
  content: string;
  tags: string[];
  pdfUrl: string;
  publishedDate: string;
  isPublished: boolean;
}

export const emptyPaperForm: PaperFormValues = {
  slug: "",
  title: "",
  abstract: "",
  content: "",
  tags: [],
  pdfUrl: "",
  publishedDate: new Date().toISOString().slice(0, 10),
  isPublished: true,
};

export function PaperForm({
  initial,
  submitLabel,
  onSubmit,
  pending,
  error,
}: {
  initial: PaperFormValues;
  submitLabel: string;
  onSubmit: (values: PaperFormValues) => void;
  pending: boolean;
  error: string | null;
}) {
  const [values, setValues] = useState<PaperFormValues>(initial);
  const [tagsInput, setTagsInput] = useState(initial.tags.join(", "));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileUpload = async (file: File) => {
    if (file.type !== "application/pdf") {
      setUploadError("Solo file PDF sono accettati.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("Il file supera i 25 MB.");
      return;
    }
    setUploadError(null);
    setUploading(true);
    const ext = "pdf";
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80)}`;
    const { error: upErr } = await supabase.storage
      .from("papers")
      .upload(path, file, { contentType: "application/pdf", upsert: false });
    if (upErr) {
      setUploadError(upErr.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("papers").getPublicUrl(path);
    update("pdfUrl", data.publicUrl);
    setUploading(false);
    void ext;
  };

  const update = <K extends keyof PaperFormValues>(
    key: K,
    value: PaperFormValues[K],
  ) => setValues((v) => ({ ...v, [key]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSubmit({ ...values, tags });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <Field label="Titolo">
        <input
          required
          maxLength={300}
          value={values.title}
          onChange={(e) => {
            update("title", e.target.value);
            if (!values.slug) {
              update(
                "slug",
                e.target.value
                  .toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-+|-+$/g, "")
                  .slice(0, 120),
              );
            }
          }}
          className={inputCls}
        />
      </Field>

      <div className="grid md:grid-cols-2 gap-6">
        <Field label="Slug (URL)">
          <input
            required
            pattern="[a-z0-9-]+"
            maxLength={120}
            value={values.slug}
            onChange={(e) => update("slug", e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Data di pubblicazione">
          <input
            type="date"
            required
            value={values.publishedDate}
            onChange={(e) => update("publishedDate", e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <Field label="Abstract">
        <textarea
          required
          maxLength={1000}
          rows={3}
          value={values.abstract}
          onChange={(e) => update("abstract", e.target.value)}
          className={inputCls}
        />
      </Field>

      <Field label="Contenuto (separa i paragrafi con righe vuote)">
        <textarea
          rows={14}
          maxLength={100_000}
          value={values.content}
          onChange={(e) => update("content", e.target.value)}
          className={`${inputCls} font-serif text-base leading-relaxed`}
        />
      </Field>

      <div className="grid md:grid-cols-2 gap-6">
        <Field label="Tag (separati da virgola)">
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="AI, Etica, Infrastrutture"
            className={inputCls}
          />
        </Field>
        <Field label="PDF del paper (opzionale)">
          <div className="space-y-2">
            <input
              type="file"
              accept="application/pdf"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFileUpload(f);
                e.target.value = "";
              }}
              className="block w-full text-xs text-surface-dark-foreground/70 file:mr-3 file:px-3 file:py-2 file:border-0 file:bg-background file:text-foreground file:font-display file:text-[10px] file:font-bold file:uppercase file:tracking-wider file:cursor-pointer hover:file:bg-primary"
            />
            {uploading && (
              <p className="font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60">
                Caricamento in corso…
              </p>
            )}
            {uploadError && (
              <p className="font-mono text-[10px] text-destructive">{uploadError}</p>
            )}
            {values.pdfUrl && !uploading && (
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <a
                  href={values.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary truncate hover:underline"
                >
                  📄 PDF caricato
                </a>
                <button
                  type="button"
                  onClick={() => update("pdfUrl", "")}
                  className="text-surface-dark-foreground/60 hover:text-destructive uppercase tracking-widest"
                >
                  Rimuovi
                </button>
              </div>
            )}
          </div>
        </Field>

      <label className="flex items-center gap-3 font-display text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={values.isPublished}
          onChange={(e) => update("isPublished", e.target.checked)}
          className="size-4 accent-primary"
        />
        Pubblicato (visibile sul sito pubblico)
      </label>

      {error && (
        <div className="border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3 text-sm font-display">
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-surface-dark-muted">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 bg-background text-foreground font-display text-[11px] font-bold uppercase tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50"
        >
          {pending ? "Salvataggio…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => navigate({ to: "/admin" })}
          className="px-5 py-2.5 border border-surface-dark-muted font-display text-[11px] font-bold uppercase tracking-wider hover:border-background hover:text-background transition-colors"
        >
          Annulla
        </button>
        <Link
          to="/admin"
          className="ml-auto font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 hover:text-background self-center"
        >
          ← Dashboard
        </Link>
      </div>
    </form>
  );
}

const inputCls =
  "w-full bg-surface-dark border border-surface-dark-muted px-4 py-2.5 text-sm text-background font-display focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-surface-dark-foreground/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-surface-dark-foreground/60 mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
