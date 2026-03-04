/**
 * Client-side image compression utility.
 * Compresses large images before uploading to keep DB storage reasonable.
 * Targets max ~200KB output.
 */

export interface CompressedImage {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

// Team photos: 1600x900 (16:9 landscape)
// Player photos: 800x1200 (2:3 portrait)
const TEAM_WIDTH = 1600;
const TEAM_HEIGHT = 900;
const PLAYER_MAX_WIDTH = 800;
const PLAYER_MAX_HEIGHT = 1200;
const JPEG_QUALITY = 0.82;

export type PhotoMode = "team" | "player";

export function compressImage(file: File, mode: PhotoMode = "player"): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let targetWidth: number;
        let targetHeight: number;

        if (mode === "team") {
          // Force exact 1600x900 for team photos (crop/fit to 16:9)
          targetWidth = TEAM_WIDTH;
          targetHeight = TEAM_HEIGHT;
        } else {
          // Player photos: scale down preserving aspect ratio
          let { width, height } = img;
          if (width > PLAYER_MAX_WIDTH) {
            height = Math.round((height * PLAYER_MAX_WIDTH) / width);
            width = PLAYER_MAX_WIDTH;
          }
          if (height > PLAYER_MAX_HEIGHT) {
            width = Math.round((width * PLAYER_MAX_HEIGHT) / height);
            height = PLAYER_MAX_HEIGHT;
          }
          targetWidth = width;
          targetHeight = height;
        }

        // Draw to canvas
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context unavailable"));
          return;
        }
        if (mode === "team") {
          // Cover-crop into 16:9: fill canvas, center crop
          const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
          const sw = targetWidth / scale;
          const sh = targetHeight / scale;
          const sx = (img.width - sw) / 2;
          const sy = (img.height - sh) / 2;
          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
        } else {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
        }

        // Export as JPEG
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        const compressedSize = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          originalSize: file.size,
          compressedSize,
          width: targetWidth,
          height: targetHeight,
        });
      };
      img.onerror = () => reject(new Error("Impossibile caricare l'immagine"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Errore lettura file"));
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
