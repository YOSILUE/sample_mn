// js/nms.js
// 推論後の後処理
//----------------------------------------------------
// YOLO 出力パース
//----------------------------------------------------
export function parseYOLOOutput(output, confThreshold = 0.25) {
  const data = output.cpuData;
  const numBoxes = output.dims[2]; // 8400
  const boxes = [];

  for (let i = 0; i < numBoxes; i++) {
    const x = data[i];
    const y = data[numBoxes + i];
    const w = data[2 * numBoxes + i];
    const h = data[3 * numBoxes + i];
    const conf = data[4 * numBoxes + i];

    if (conf < confThreshold) continue;

    boxes.push({
      x1: x - w / 2,
      y1: y - h / 2,
      x2: x + w / 2,
      y2: y + h / 2,
      conf
    });
  }
  return boxes;
}

//----------------------------------------------------
// IoU（Intersection over Union）=重なり具合という指標
//----------------------------------------------------
export function iou(a, b) {
  const x1 = Math.max(a.x1, b.x1);
  const y1 = Math.max(a.y1, b.y1);
  const x2 = Math.min(a.x2, b.x2);
  const y2 = Math.min(a.y2, b.y2);

  const w = Math.max(0, x2 - x1);
  const h = Math.max(0, y2 - y1);
  const inter = w * h;

  const areaA = (a.x2 - a.x1) * (a.y2 - a.y1);
  const areaB = (b.x2 - b.x1) * (b.y2 - b.y1);

  return inter / (areaA + areaB - inter);
}

//----------------------------------------------------
// NMS（Non-Maximum Suppression）=非最大抑制、検出精度の調整
//----------------------------------------------------
export function nms(boxes, iouThreshold = 0.5) {
  boxes.sort((a, b) => b.conf - a.conf);
  const selected = [];

  while (boxes.length) {
    const best = boxes.shift();
    selected.push(best);
    boxes = boxes.filter(b => iou(best, b) < iouThreshold);
  }
  return selected;
}

//----------------------------------------------------
// YOLO 後処理まとめ
//----------------------------------------------------
export function postprocessYOLO(outputs) {
  const raw = parseYOLOOutput(outputs.output0, 0.25);
  return nms(raw, 0.5);
}
