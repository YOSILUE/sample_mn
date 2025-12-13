//----------------------------------------------------
// 検出結果描画（Canvas Overlay）
//----------------------------------------------------
export function drawBoxes(boxes, imgElement) {
  const canvas = document.getElementById("overlay");
  const ctx = canvas.getContext("2d");

  // canvas サイズを画像に合わせる
  const w = imgElement.naturalWidth;
  const h = imgElement.naturalHeight;

  canvas.width = w;
  canvas.height = h;

  // 表示サイズを img に合わせる（CSS的に）
  canvas.style.width = imgElement.width + "px";
  canvas.style.height = imgElement.height + "px";

  // クリア
  ctx.clearRect(0, 0, w, h);

  // 描画スタイル
  ctx.lineWidth = 2;
  ctx.strokeStyle = "red";
  ctx.fillStyle = "red";
  ctx.font = "16px sans-serif";

  boxes.forEach((b) => {
    const { x1, y1, x2, y2, score } = b;

    const bw = x2 - x1;
    const bh = y2 - y1;

    // bbox
    ctx.strokeRect(x1, y1, bw, bh);

    // label
    const label = score.toFixed(2);
    ctx.fillText(label, x1, Math.max(10, y1 - 4));
  });
}
