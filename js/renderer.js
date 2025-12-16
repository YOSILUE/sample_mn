//共通ライブラリ インポート
import { log } from "https://yosilue.github.io/sample_mn/js/logger.js";

//----------------------------------------------------
// 検出結果描画（Canvas Overlay / Responsive対応）
//----------------------------------------------------
export function drawBoxes(boxes, imgElement) {
  const canvas = document.getElementById("overlay");
  const ctx = canvas.getContext("2d");

  // ---- 元画像サイズ（推論座標系） ----
  const imgW = imgElement.naturalWidth;
  const imgH = imgElement.naturalHeight;

  // ---- 推論空間 → 元画像空間のスケール変換用 ----
  const sx = imgW / 640;
  const sy = imgH / 640;

  // ---- 表示サイズ（CSS反映後） ----
  const rect = imgElement.getBoundingClientRect();
  const dispW = rect.width;
  const dispH = rect.height;
  log(`[RENDERER] dispW=${dispW}, dispH=${dispH}`);

  // ---- canvas 内部解像度（重要）----
  canvas.width = imgW;
  canvas.height = imgH;

  // ---- canvas 表示サイズを画像に完全追従 ----
  canvas.style.width = dispW + "px";
  canvas.style.height = dispH + "px";

  // ---- 画像の上に重ねる ----
  canvas.style.position = "absolute";
  canvas.style.left = "0";
  canvas.style.top = "0";
  canvas.style.pointerEvents = "none"; // 操作を邪魔しない

  // ---- クリア ----
  ctx.clearRect(0, 0, imgW, imgH);

  // ---- 描画スタイル ----
  ctx.lineWidth = 2;
  ctx.font = "18px sans-serif";

  // ---- 描画処理 ----
  boxes.forEach((b, i) => {
     // ---- 状態駆動 ----
    const color = b.color || "red";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
  
    // 推論時のアクセプト比640 → 元画像へスケール変換
    const rx = b.x1 * sx;
    const ry = b.y1 * sy;
    const rw = (b.x2 - b.x1) * sx;
    const rh = (b.y2 - b.y1) * sy;

    // 矩形を描画
    ctx.strokeRect(rx, ry, rw, rh);
    
    // ---- 表示ラベル ----
    let label = "";
    
    if (b.ocrText) {
      label = b.ocrText;
    } else if (typeof b.score === "number") {
      label = b.score.toFixed(2);
    }
    
  　ctx.fillText(label, rx, Math.max(16, ry - 4));
  });
  log(`[RENDERER] drawBoxes: ${boxes.length}`);
}
