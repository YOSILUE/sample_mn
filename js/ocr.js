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
// OCR実行
//----------------------------------------------------
export async function recognizeText(canvas) {

  if (!worker) {
    throw new Error("OCR worker not initialized");
  }

  log(
    `[OCR] recognize start (${canvas.width}x${canvas.height})`
  );

  const result =
    await worker.recognize(canvas);

  const text =
    result.data.text.trim();

  const confidence =
    result.data.confidence;

  log(
    `[OCR] text="${text}" conf=${confidence.toFixed(2)}`
  );

  return {
    text,
    confidence
  };
}
