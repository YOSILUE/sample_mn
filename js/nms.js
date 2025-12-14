// js/nms.js
// 推論後の後処理
import { log } from "https://yosilue.github.io/sample_mn/js/logger.js";
//----------------------------------------------------
// IoU（Intersection over Union）=重なり具合という指標
//----------------------------------------------------
function boxIoU(a, b) {
  const x1 = Math.max(a.x1, b.x1);
  const y1 = Math.max(a.y1, b.y1);
  const x2 = Math.min(a.x2, b.x2);
  const y2 = Math.min(a.y2, b.y2);

  const interW = Math.max(0, x2 - x1);
  const interH = Math.max(0, y2 - y1);
  const interArea = interW * interH;

  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);

  return interArea / (areaA + areaB - interArea + 1e-6);
}

//----------------------------------------------------
// NMS（Non-Maximum Suppression）=非最大抑制、検出精度の調整
//----------------------------------------------------
function nonMaxSuppression(boxes, iouThreshold) {
  // score 降順
  boxes.sort((a, b) => b.score - a.score);

  const selected = [];
  let suppressed = 0;

  for (const box of boxes) {
    let keep = true;
    for (const sel of selected) {
      if (boxIoU(box, sel) > iouThreshold) {
        keep = false;
        suppressed++;
        break;
      }
    }
    if (keep) selected.push(box);
  }

  log(`[NMS] suppressed by IoU = ${suppressed}`);
  return selected;
}

//----------------------------------------------------
// YOLOv8 postprocess + NMS
//----------------------------------------------------
export function postprocessYOLO(
  outputs,
  confThreshold = 0.25,
  iouThreshold = 0.45
) {
  const out = outputs.output0;
  const data = out.cpuData;
  const [_, C, N] = out.dims; // [1,5,8400]

  log(`[POST] dims = ${out.dims.join(",")}`);

  let maxConf = 0;
  let rawCount = 0;

  const candidates = [];

  for (let i = 0; i < N; i++) {
    const score = data[4 * N + i];
    if (score > maxConf) maxConf = score;

    if (score < confThreshold) continue;

    rawCount++;

    const cx = data[0 * N + i];
    const cy = data[1 * N + i];
    const w  = data[2 * N + i];
    const h  = data[3 * N + i];

    candidates.push({
      x1: cx - w / 2,
      y1: cy - h / 2,
      x2: cx + w / 2,
      y2: cy + h / 2,
      cx, cy, w, h,
      score
    });
  }

  log(`[POST] max conf = ${maxConf.toFixed(4)}`);
  log(`[POST] confThreshold = ${confThreshold}`);
  log(`[POST] after conf filter = ${rawCount}`);

  if (candidates.length === 0) {
    log("[POST] No boxes passed confidence filter");
    return [];
  }

  const finalBoxes = nonMaxSuppression(candidates, iouThreshold);
  log(`[POST] after NMS = ${finalBoxes.length}`);

  return finalBoxes;
}
