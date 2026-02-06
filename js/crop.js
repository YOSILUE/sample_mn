export function cropBoxFromImage(imgElement, box) {

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const w = box.x2 - box.x1;
  const h = box.y2 - box.y1;

  canvas.width = w;
  canvas.height = h;

  ctx.drawImage(
    imgElement,
    box.x1,
    box.y1,
    w,
    h,
    0,
    0,
    w,
    h
  );

  return canvas;
}
