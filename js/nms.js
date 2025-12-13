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
function nonMaxSuppression(boxes, iouThreshold = 0.45) {
  // confidence 降順
  boxes.sort((a, b) => b.conf - a.conf);

  const selected = [];

  for (const box of boxes) {
    let keep = true;

    for (const sel of selected) {
      if (boxIoU(box, sel) > iouThreshold) {
        keep = false;
        break;
      }
    }
    if (keep) selected.push(box);
  }
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

  const boxes = [];

  for (let i = 0; i < N; i++) {
    const cx = data[0 * N + i];
    const cy = data[1 * N + i];
    const w  = data[2 * N + i];
    const h  = data[3 * N + i];
    const conf = data[4 * N + i];

    if (conf < confThreshold) continue;

    const x1 = cx - w / 2;
    const y1 = cy - h / 2;
    const x2 = cx + w / 2;
    const y2 = cy + h / 2;

    boxes.push({
      x1, y1, x2, y2,
      cx, cy, w, h,
      conf
    });
  }

  // NMS
  return nonMaxSuppression(boxes, iouThreshold);
}
