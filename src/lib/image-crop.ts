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

/**
 * Crop a source image to a square PNG sized for favicons.
 * posX/posY are 0–100 and represent the focal point of the crop
 * (same convention as CSS object-position percentages).
 */
export async function cropFaviconPng(
  file: File,
  posX: number,
  posY: number,
  outSize = 256,
): Promise<Blob> {
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

  const side = Math.min(img.width, img.height);
  const maxSx = img.width - side;
  const maxSy = img.height - side;
  const sx = Math.round((Math.max(0, Math.min(100, posX)) / 100) * maxSx);
  const sy = Math.round((Math.max(0, Math.min(100, posY)) / 100) * maxSy);

  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponibile.");
  ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);

  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("Conversione favicon fallita."))),
      "image/png",
    ),
  );
  return blob;
}

/**
 * Crop a source image URL (e.g. previously uploaded original) to a square
 * favicon PNG. Used when the user only changed the focal point and we need
 * to regenerate the favicon without re-selecting the file.
 */
export async function cropFaviconPngFromUrl(
  url: string,
  posX: number,
  posY: number,
  outSize = 256,
): Promise<Blob> {
  const img: HTMLImageElement = await new Promise((res, rej) => {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => res(i);
    i.onerror = () => rej(new Error("Immagine non valida."));
    i.src = url;
  });
  const side = Math.min(img.width, img.height);
  const maxSx = img.width - side;
  const maxSy = img.height - side;
  const sx = Math.round((Math.max(0, Math.min(100, posX)) / 100) * maxSx);
  const sy = Math.round((Math.max(0, Math.min(100, posY)) / 100) * maxSy);

  const canvas = document.createElement("canvas");
  canvas.width = outSize;
  canvas.height = outSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas non disponibile.");
  ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);

  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("Conversione favicon fallita."))),
      "image/png",
    ),
  );
  return blob;
}
