//----------------------------------------------------
// デバッグログ用
//----------------------------------------------------
function log(msg) {
  console.log(msg);
  const area = document.getElementById("logArea");
  area.textContent += msg + "\n";
  area.scrollTop = area.scrollHeight;
}

log("[INFO] APP ver 2025.12.13_0236");
//----------------------------------------------------
// ORT 事前設定（WebGL → WASM の順にフォールバック）
//----------------------------------------------------
log("[INIT] ORT 設定開始...");
ort.env.wasm.wasmPaths = "https://yosilue.github.io/sample_mn/onnx/";
ort.env.wasm.numThreads = 2;
ort.env.wasm.simd = true;         // SIMD ON（高速化）
ort.env.debug = false;

log("[INIT] wasmPaths = " + ort.env.wasm.wasmPaths);
log("[INIT] Execution = WASM only");
//----------------------------------------------------
// モデルロード
//----------------------------------------------------
const modelPath = "https://yosilue.github.io/sample_mn/model/best_y8_o12.onnx";
log("[INIT] モデルパス = " + modelPath);

// グローバル変数
let session = null;         // 推論セッション
let inputImageData = null;  // 入力画像データ

//----------------------------------------------------
// モデルファイルのサイズを事前に取得する関数
//----------------------------------------------------
async function logModelFileSize(modelUrl) {
    try {
        // ---- HEAD を試す ----
        let response = await fetch(modelUrl, { method: "HEAD" });
        let size = response.headers.get("Content-Length");

        if (size) {
            const mb = (Number(size) / (1024 * 1024)).toFixed(2);
            log(`[MODEL] ファイルサイズ: ${mb} MB (${size} bytes)`);
            return;
        }
    } catch (e) {
        log("[MODEL] サイズ取得エラー: " + e);
    }
}

//----------------------------------------------------
// ★ 起動直後にモデルをプリロード（高速化）
//----------------------------------------------------
(async () => {
  try {
    // モデルサイズをログ出力
    logModelFileSize(modelPath);   
    log("[PRELOAD] セッション事前読み込み開始…");

    // wasm をロード
    session = await ort.InferenceSession.create(modelPath, {
      //executionProviders: ["webgl", "wasm"]
      executionProviders: ["wasm"]
    });

    log("[PRELOAD] セッション事前読み込み完了（WASM）");
  } catch (e) {
    log("[PRELOAD] セッション事前読み込み失敗: " + e);
  }
})();

//----------------------------------------------------
// 画像プレビュー
//----------------------------------------------------
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
// 推論実行
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
    log("[RUN] 実行中...");
    log("[DEBUG] inputNames = " + JSON.stringify(session.inputNames));

    const outputs = await session.run({ images: tensor });

    log("[RUN] 推論成功！");
    log(JSON.stringify(outputs, null, 2));

  } catch (e) {
    log("[ERROR] 推論失敗: " + e);
  }
};

log("[INIT] main.js 完了");
