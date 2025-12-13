# バージョン対応表
## モデルVer + OpsetVer = CPU処理・GPU処理の対応
| YOLO    | Opset | ORT 実行環境      | 結果     | 状態 / エラー内容                                  | 備考                            |
| ------- | ----- | ------------     | -----     | -------------------------------------------------- | ---------------------------     |
| YOLOv8n | 12    | WebGL + WASM     | ❌ 失敗   | `resize (packed) does not support mode: 'nearest'` | WebGL backend の Resize 制限    |
| YOLOv8n | 17    | WebGL + WASM     | ❌ 失敗   | `cannot resolve operator 'Split'`                  | ORT-Web が opset17 Split 未対応 |
| YOLOv8n | 18    | WebGL + WASM     | ❌ 失敗   | WebGL 非対応オペレータ                             | Split / Resize 系               |
| YOLOv8n | 18    | WebGL only       | ❌ 失敗   | 同上                                               | 現状不可                        |
| YOLOv8n | 12    | WASM only        | ✅ 成功   | 推論成功（数値出力あり）                           | 現在の安定構成                  |
| YOLOv8n | 17    | WASM only        | ❌ 未確認 | （WebGL失敗時点で中断）                            | ※理論上は可能性あり            |
| YOLOv8n | 18    | WASM only        | ✅ 成功   | 推論成功（output0: [1,5,8400]）                    | 後処理実装可能                  |
