// js/logger.js
//----------------------------------------------------
// デバッグログ用
//----------------------------------------------------
export function log(msg) {
  console.log(msg);
  const area = document.getElementById("logArea");
  if (!area) return;

  area.textContent += msg + "\n";
  area.scrollTop = area.scrollHeight;
}
