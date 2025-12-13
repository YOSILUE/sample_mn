// js/main.js
import { log } from "./logger.js";
import { postprocessYOLO } from "./nms.js";

log("[INFO] App ver 2025.12.13_1924");

// ORT 設定
log("[INIT] ORT 設定開始...");
ort.env.wasm.wasmPaths = "https://yosilue.github.io/sample_mn/onnx/";
log("[INIT] wasmPaths = " + ort.env.wasm.wasmPaths);
ort.env.wasm.numThreads = 2;

const modelPath = "https://yosilue.github.io/sample_mn/model/best_y8_o18.onnx";
log("[INIT] モデルパス = " + modelPath);
let session = null;

// 事前ロード
(async () => {
  log("[PRELOAD] セッション事前ロード開始…");
  session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ["wasm"],
  });
  log("[PRELOAD] セッション事前ロード完了（WASM）");
})();

// 画像プレビュー
document.getElementById("imageInput").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  document.getElementById("preview").src = url;
  log("[IMAGE] プレビュー表示完了: " + file.name);

  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);

    inputImageData = ctx.getImageData(0, 0, img.width, img.height);
    log("[IMAGE] ImageData 取得完了: " + img.width + "x" + img.height);
  };
  img.src = url;
};

// 推論
document.getElementById("runBtn").onclick = async () => {
  if (!session) return;

  const tensor = /* 既存の入力テンソル生成 */;
  const t0 = performance.now();
  const outputs = await session.run({ images: tensor });
  const t1 = performance.now();

  const boxes = postprocessYOLO(outputs);
  log(`[POST] boxes=${boxes.length}`);

  const elapsed = t1 - t0; // ms
  const fps = 1000 / elapsed;
  log(`[PERF] 推論時間: ${elapsed.toFixed(2)} ms`);
  log(`[PERF] FPS: ${fps.toFixed(2)}`);

  console.log(boxes);
};
