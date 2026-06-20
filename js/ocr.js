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
      "0123456789"
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

  log(`[OCR] recognize start (${canvas.width}x${canvas.height})`);

  const allTexts = [];
  const angles = [];
  for (let a = -40; a <= 40; a += 5) {
    angles.push(a);
  }

  let bestText = "";
  let bestConf = -1;

  for (const angle of angles) {

    const target = angle === 0 ? canvas : rotateCanvas(canvas, angle);

    const result = await worker.recognize(target);

    const text =
      result.data.text
      .trim()
      .toUpperCase();

    const conf = result.data.confidence;

    log(`[OCR] angle=${angle} text="${text}" conf=${conf.toFixed(1)}`);

    allTexts.push(text);
  }

  const voted = voteNumber(allTexts);
  log(`[OCR] vote winner=${voted.number} count=${voted.count}`);
  log(`[OCR] votes=${JSON.stringify(voted.votes)}`);

  return voted.number;
}

//----------------------------------------------------
// OCR結果を集計
//----------------------------------------------------
function voteNumber(results) {

  const votes = {};

  results.forEach(text => {

    // 数字だけ抽出
    const num = text.replace(/\d{3}/, '"$&"');

    // 3桁のみ採用
    if (num.length !== 3) return;

    votes[num] = (votes[num] || 0) + 1;
  });

  let bestNumber = null;
  let bestCount = 0;

  Object.entries(votes).forEach(([num, count]) => {

    if (count > bestCount) {
      bestNumber = num;
      bestCount = count;
    }
  });

  return {
    number: bestNumber,
    count: bestCount,
    votes
  };
}