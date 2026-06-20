import { log } from "https://yosilue.github.io/sample_mn/js/logger.js";

//----------------------------------------------------
// BOX領域切り出し
//----------------------------------------------------
export function cropBox(imgElement, box) {

  const imgW = imgElement.naturalWidth;
  const imgH = imgElement.naturalHeight;

  // 推論空間(640) → 元画像空間
  const sx = imgW / 640;
  const sy = imgH / 640;

  const x = Math.max(0, Math.floor(box.x1 * sx));
  const y = Math.max(0, Math.floor(box.y1 * sy));
  const w = Math.max( 1, Math.floor((box.x2 - box.x1) * sx));
  const h = Math.max( 1, Math.floor((box.y2 - box.y1) * sy));

  log(`[CROP] x=${x}, y=${y}, w=${w}, h=${h}`);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(
    imgElement,
    x,
    y,
    w,
    h,
    0,
    0,
    w,
    h
  );

  return canvas;
}
