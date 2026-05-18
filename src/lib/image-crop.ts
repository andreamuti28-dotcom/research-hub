export async function cropTo4x5Jpeg(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Il file selezionato non è un'immagine.");
  }
  const dataUrl: string = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("Impossibile leggere il file."));
    r.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("Immagine non valida."));
    i.src = dataUrl;
  });

  const targetRatio = 4 / 5;
  const srcRatio = img.width / img.height;
  let sx = 0,
    sy = 0,
    sw = img.width,
    sh = img.height;
  if (srcRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else if (srcRatio < targetRatio) {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  const outW = Math.min(1200, Math.round(sw));
  const outH = Math.round(outW / targetRatio);
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponibile.");
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("Conversione immagine fallita."))),
      "image/jpeg",
      0.9,
    ),
  );
  return blob;
}
