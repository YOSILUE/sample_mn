export function cropBoxFromImage(imgElement, box) {

  const imgW = imgElement.naturalWidth;
  const imgH = imgElement.naturalHeight;

  // 推論640 → 元画像スケール
  const sx = imgW / 640;
  const sy = imgH / 640;

  const x = Math.max(0, box.x1 * sx);
  const y = Math.max(0, box.y1 * sy);
  const w = Math.min(imgW, (box.x2 - box.x1) * sx);
  const h = Math.min(imgH, (box.y2 - box.y1) * sy);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = Math.max(1, Math.floor(w));
  canvas.height = Math.max(1, Math.floor(h));

  ctx.drawImage(
    imgElement,
    x,
    y,
    w,
    h,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas;
}
