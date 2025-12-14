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

  // ---- 表示サイズ（CSS反映後） ----
  const rect = imgElement.getBoundingClientRect();
  const dispW = rect.width;
  const dispH = rect.height;

  // ---- 倍率計算 ---- 
  const max = Math.max(dispW, dispH);
  const scale = 640 / max;

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
  ctx.strokeStyle = "red";
  ctx.fillStyle = "red";
  ctx.font = "18px sans-serif";

  // ---- 描画 ----
  boxes.forEach((b, i) => {
    const { x1, y1, x2, y2, score } = b;

    //const w = x2 - x1;
    //const h = y2 - y1;   
    //log(`[DEBUG] x1=${x1}, y1=${y1}, w=${w}, h=${h}, score=${score}`);
    //ctx.strokeRect(x1, y1, w, h);
    
    const bx = x1 / scale;
    const by = y1 / scale;
    const bw = (x2 - x1) / scale;
    const bh = (y2 - y1) / scale;
    //log(`[DEBUG] bx=${bx}, by=${by}, bw=${bw}, bh=${bh}, score=${score}`);
    ctx.strokeRect(bx, by, bw, bh);
    
    const label = (typeof score === "number") ? score : 0;
  　ctx.fillText(label.toFixed(2), x1, Math.max(16, y1 - 4));
  });
}
