// js/main.js
import { log } from "https://yosilue.github.io/sample_mn/js/logger.js";
import { postprocessYOLO } from "https://yosilue.github.io/sample_mn/js/nms.js";
import { drawBoxes } from "https://yosilue.github.io/sample_mn/js/renderer.js";

//アプリ更新日を出力
log("[INFO] App update 2025.12.17_0347");

//----------------------------------------------------
// グローバル変数初期化
//----------------------------------------------------
let inputImageData = null;
let session = null;

// ORT 設定
log("[INIT] ORT 設定開始...");
ort.env.wasm.wasmPaths = "https://yosilue.github.io/sample_mn/onnx/";
log("[INIT] wasmPaths = " + ort.env.wasm.wasmPaths);
ort.env.wasm.numThreads = 2;

const modelPath = "https://yosilue.github.io/sample_mn/model/best_y11n_o18.onnx";
log("[INIT] モデルパス = " + modelPath);

// 事前ロード
(async () => {
  log("[PRELOAD] セッション事前ロード開始…");
  try{
    //例外が発生する可能性のある処理
    session = await ort.InferenceSession.create(modelPath, {
    executionProviders: ["webgl"],
    });
    log("[PRELOAD] セッション事前ロード完了（WebGL）");
  }catch(e){
    //例外が発生した場合の処理
    session = await ort.InferenceSession.create(modelPath, {
    //executionProviders: ["wasm"],
    });
    log("[PRELOAD] セッション事前ロード完了（WASM）");
  }
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

//----------------------------------------------------
// 推論
//----------------------------------------------------
document.getElementById("runBtn").onclick = async () => {
  log("[RUN] 推論開始...");

  if (!inputImageData) {
    log("[ERROR] 画像が読み込まれていません。");
    return;
  }

  try {
    if (!session) {
      log("[SESSION] セッション再ロード開始（WASM）...");
      session = await ort.InferenceSession.create(modelPath, {
        executionProviders: ["wasm"]
      });
      log("[SESSION] セッション再ロード完了");
    }

    //------------------------------------------------
    // 画像を 640x640 にリサイズ
    //------------------------------------------------
    log("[RUN] 入力テンソル作成中...");

    const imgElement = document.getElementById("preview");
    if (!imgElement || !imgElement.src) {
      throw new Error("プレビュー画像がロードされていません");
    }

    const target = 640;
    const canvas = document.createElement("canvas");
    canvas.width = target;
    canvas.height = target;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      imgElement,
      0, 0, imgElement.naturalWidth, imgElement.naturalHeight,
      0, 0, target, target
    );

    const resized = ctx.getImageData(0, 0, target, target);

    //------------------------------------------------
    // CHW float32 変換
    //------------------------------------------------
    const chw = new Float32Array(3 * target * target);
    let p = 0;
    for (let y = 0; y < target; y++) {
      for (let x = 0; x < target; x++) {
        const idx = (y * target + x) * 4;
        chw[p] = resized.data[idx] / 255;
        chw[p + target * target] = resized.data[idx + 1] / 255;
        chw[p + 2 * target * target] = resized.data[idx + 2] / 255;
        p++;
      }
    }

    const tensor = new ort.Tensor("float32", chw, [1, 3, target, target]);

    //------------------------------------------------
    // 推論実行
    //------------------------------------------------
    log("[RUN] 推論実行中...");
    log("[DEBUG] inputNames = " + JSON.stringify(session.inputNames));
    const t0 = performance.now();
    const outputs = await session.run({ images: tensor });
    const t1 = performance.now();
  
    const boxes = postprocessYOLO(outputs, 0.05, 0.45);
    log(`[POST] final boxes=${boxes.length}`);
    console.log(boxes);

    // ★ 描画
    //const imgElement = document.getElementById("preview");
    drawBoxes(boxes, imgElement);
    
    const elapsed = t1 - t0; // ms
    const fps = 1000 / elapsed;
    log(`[PERF] 推論時間: ${elapsed.toFixed(2)} ms`);
    log(`[PERF] FPS: ${fps.toFixed(2)}`);
  } catch (e) {
      log("[ERROR] 推論失敗: " + e);
  }
};

log("[INIT] main.js 完了");
