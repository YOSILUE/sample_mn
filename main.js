//----------------------------------------------------
// デバッグログ用
//----------------------------------------------------
function log(msg) {
  console.log(msg);
  const area = document.getElementById("logArea");
  area.textContent += msg + "\n";
  area.scrollTop = area.scrollHeight;
}

//----------------------------------------------------
// WASM ローダー設定
//----------------------------------------------------
log("[INIT] ORT 設定開始...");

ort.env.wasm.wasmPaths = "https://yosilue.github.io/sample_mn/onnx/";
ort.env.wasm.numThreads = 1;

log("[INIT] wasmPaths = " + ort.env.wasm.wasmPaths);

//----------------------------------------------------
// モデルロード
//----------------------------------------------------
const modelPath = "https://yosilue.github.io/sample_mn/model/best.onnx/";
log("[INIT] モデルパス = " + modelPath);

// グローバル変数
let session = null;
let inputImageData = null;

//----------------------------------------------------
// 画像プレビュー
//----------------------------------------------------
document.getElementById("imageInput").onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  document.getElementById("preview").src = url;
  log("[IMAGE] プレビュー表示完了: " + file.name);

  // 画像読み込み
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
      log("[SESSION] セッション初期化開始...");
      session = await ort.InferenceSession.create(modelPath);
      log("[SESSION] セッション初期化完了");
    }

    // YOLO 用の前処理は必要に応じて追加
    log("[RUN] 入力テンソル作成中...");
    const tensor = new ort.Tensor("float32", new Float32Array([0]), [1, 1]);

    log("[RUN] 実行中...");
    const outputs = await session.run({ images: tensor });

    log("[RUN] 推論成功！");
    log(JSON.stringify(outputs, null, 2));

  } catch (e) {
    log("[ERROR] 推論失敗: " + e);
  }
};

log("[INIT] main.js 完了");
