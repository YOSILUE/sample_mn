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
const modelPath = "https://yosilue.github.io/sample_mn/model/best.onnx";
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

  // YOLO 用の前処理 (ImageData → Float32 CHW)
  log("[RUN] 入力テンソル作成中...");

  // --- ① ImageData を YOLO サイズにリサイズ（640×640推奨） ---
  const target = 640;

  const canvas = document.createElement("canvas");
  canvas.width = target;
  canvas.height = target;
  const ctx = canvas.getContext("2d");

  // 大きい ImageData をリサイズして描画
  ctx.drawImage(
    imgElement,      // ← ここ重要！ImageData ではなく画像要素を使う
    0, 0, imgWidth, imgHeight,
    0, 0, target, target
  );

  const resized = ctx.getImageData(0, 0, target, target);

  // --- ② RGB → CHW float32 ---
  const chw = new Float32Array(3 * target * target);
  let p = 0;

  for (let y = 0; y < target; y++) {
    for (let x = 0; x < target; x++) {

      const index = (y * target + x) * 4;

      const r = resized.data[index]     / 255;
      const g = resized.data[index + 1] / 255;
      const b = resized.data[index + 2] / 255;

      chw[p] = r;
      chw[p + target * target] = g;
      chw[p + 2 * target * target] = b;

      p++;
    }
  }
  
  // --- ③ 4D Tensor (1,3,640,640) ---
  const tensor = new ort.Tensor("float32", chw, [1, 3, height, width]);

  log("[RUN] 実行中...");

  // 入力名 `images` で推論
  const outputs = await session.run({ images: tensor });

  log("[RUN] 推論成功！");
  log(JSON.stringify(outputs, null, 2));

} catch (e) {
  log("[ERROR] 推論失敗: " + e);
}
};

log("[INIT] main.js 完了");
