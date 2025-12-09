// ログ出力
function log(msg) {
  const area = document.getElementById("logArea");
  const time = new Date().toLocaleTimeString();
  area.textContent += "[" + time + "] " + msg + "\n";
  area.scrollTop = area.scrollHeight;
  console.log(msg);
}

// onload
window.onload = () => {
  log("ページ読み込み成功：onload 発火済み（ONNX テスト版: external files）");
};

// モデル読み込みテスト
document.getElementById("loadModelBtn").onclick = async () => {
  log("=== モデル読み込みテスト開始 ===");

  const modelUrl = "https://yosilue.github.io/sample_mn/model/best.onnx";

  try {
    log("モデル取得(fetch)開始：" + modelUrl);

    const res = await fetch(modelUrl);
    log("HTTP status: " + res.status);

    if (!res.ok) {
      log("取得失敗：res.ok = false");
      return;
    }

    const arrayBuffer = await res.arrayBuffer();
    log("取得成功：バイト数 = " + arrayBuffer.byteLength);

    // ONNX Runtime でロード
    log("ONNX Runtime: InferenceSession 作成開始...");
    const session = await ort.InferenceSession.create(arrayBuffer);
    log("ONNX Runtime: モデル読み込み成功！");

  } catch (err) {
    log("モデル読み込みエラー: " + err);
  }

  log("=== モデル読み込みテスト終了 ===");
};
