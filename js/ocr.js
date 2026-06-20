// js/ocr.js

import { log } from "https://yosilue.github.io/sample_mn/js/logger.js";

let worker = null;

//----------------------------------------------------
// OCR初期化
//----------------------------------------------------
export async function initOCR() {

  if (worker) {
    log("[OCR] worker already initialized");
    return;
  }

  log("[OCR] worker creating...");

  worker = await Tesseract.createWorker("eng");

  await worker.setParameters({
    tessedit_char_whitelist:
      "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  });

  log("[OCR] worker ready");
}

//----------------------------------------------------
// Canvas回転
//----------------------------------------------------
function rotateCanvas(srcCanvas, angleDeg) {

  const rad = angleDeg * Math.PI / 180;

  const w = srcCanvas.width;
  const h = srcCanvas.height;

  const dst = document.createElement("canvas");
  const ctx = dst.getContext("2d");

  const sin = Math.abs(Math.sin(rad));
  const cos = Math.abs(Math.cos(rad));

  dst.width = Math.ceil(w * cos + h * sin);
  dst.height = Math.ceil(w * sin + h * cos);

  ctx.translate(dst.width / 2, dst.height / 2);
  ctx.rotate(rad);

  ctx.drawImage(
    srcCanvas,
    -w / 2,
    -h / 2
  );

  return dst;
}

//----------------------------------------------------
// OCR実行
//----------------------------------------------------
export async function recognizeText(canvas) {

  if (!worker) {
    throw new Error("OCR worker not initialized");
  }

  log(
    `[OCR] recognize start (${canvas.width}x${canvas.height})`
  );

  const angles = [
    -45,
    -30,
    -15,
     0,
     15,
     30,
     45
  ];

  let bestText = "";
  let bestConf = -1;

  for (const angle of angles) {

    const target =
      angle === 0
        ? canvas
        : rotateCanvas(canvas, angle);

    const result =
      await worker.recognize(target);

    const text =
      result.data.text.trim();

    const conf =
      result.data.confidence;

    log(
      `[OCR] angle=${angle} text="${text}" conf=${conf.toFixed(1)}`
    );

    if (conf > bestConf) {
      bestConf = conf;
      bestText = text;
    }
  }

  return {
    text: bestText,
    confidence: bestConf
  };
}
