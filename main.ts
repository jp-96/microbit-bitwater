mstate.defineStateDescription("ペア確定", ["[SN]\"moved\"の送信", "[SN]\"pairing\"=(相手のSN)の送受信(500ms)"], function (STATE) {
    mstate.declareTransition(STATE, "傾き待ち", "paringが相手と一致した")
    mstate.declareTransitionTimeout(STATE, "タイムアウト", 3000, false)
})
mstate.defineStateDescription("受信者候補", ["[SN]\"receiver\"の送信", "受信の表示"], function (STATE) {
    mstate.declareTransition(STATE, "受信待ち", "[SN]\"ACK\"を受信した")
    mstate.declareTransitionTimeout(STATE, "タイムアウト", 3000, false)
})
mstate.defineStateDescription("受信加算", ["水量の加算", "（トリガーキューのクリア）"], function (STATE) {
    mstate.declareTransition(STATE, "アイドル", "")
})
mstate.defineStateDescription("受信完了", ["[SN]\"ACK\"の送信"], function (STATE) {
    mstate.declareTransition(STATE, "受信加算", "[SN]\"ACK\"を受信した")
    mstate.declareTransitionTimeout(STATE, "タイムアウト", 3000, false)
})
mstate.defineStateDescription("初期化", ["容量と水量の初期化"], function (STATE) {
    mstate.declareTransition(STATE, "アイドル", "")
})
mstate.defineStateDescription("送信者衝突", [" [SN]\"NAK\"の送信", "衝突の表示"], function (STATE) {
    mstate.declareTransition(STATE, "傾き待ち", "")
})
mstate.defineStateDescription("受信待ち", ["[SN]\"free\"=(空き容量)の送信"], function (STATE) {
    mstate.declareTransition(STATE, "受信完了", "[SN]\"share\"=(受け渡し量)を受信")
    mstate.declareTransitionTimeout(STATE, "タイムアウト", 3000, false)
})
mstate.defineStateDescription("送信完了", ["[SN]\"share\"=(受け渡し量)の送信"], function (STATE) {
    mstate.declareTransition(STATE, "送信減算", "[SN]\"ACK\"を受信した")
    mstate.declareTransitionTimeout(STATE, "タイムアウト", 3000, false)
})
mstate.defineStateDescription("タイムアウト", ["__タイムアウト対象:__", "相手待ち ～ 受信完了 | 送信完了"], function (STATE) {
    mstate.declareTransition(STATE, "アイドル", "")
})
mstate.defineStateDescription("送信者候補", ["[SN]\"sender\"の送信", "送信の表示"], function (STATE) {
    mstate.declareTransition(STATE, "送信待ち", "[SN]\"receiver\"を受信した")
    mstate.declareTransition(STATE, "送信者衝突", "[SN]\"sender\"を受信した")
    mstate.declareTransition(STATE, "傾き待ち", "[SN]\"NAK\"を受信した")
    mstate.declareTransitionTimeout(STATE, "タイムアウト", 3000, false)
})
mstate.defineStateDescription("傾き待ち", ["ペアの表示"], function (STATE) {
    mstate.declareTransition(STATE, "送信者候補", "自分が傾いた")
    mstate.declareTransition(STATE, "受信者候補", "[SN]\"sender\"を受信した")
    mstate.declareTransitionTimeout(STATE, "タイムアウト", 3000, false)
})
mstate.defineStateDescription("送信減算", ["[SN]\"ACK\"の送信", "水量の減算", "（トリガーキューのクリア）"], function (STATE) {
    mstate.declareTransition(STATE, "アイドル", "")
})
mstate.defineStateDescription("送信待ち", ["[SN]\"ACK\"の送信"], function (STATE) {
    mstate.declareTransition(STATE, "送信完了", "[SN]\"free\"=(空き容量)を受信した")
    mstate.declareTransitionTimeout(STATE, "タイムアウト", 3000, false)
})
mstate.defineStateDescription("アイドル", ["水量の表示"], function (STATE) {
    mstate.declareTransition(STATE, "相手待ち", "自分が動いた")
})
mstate.defineStateDescription("相手待ち", [
"[SN]\"moved\"の送信",
"__初期化：__",
"(相手のSN)",
"相手の(空き容量)",
"相手の(受け渡し量)"
], function (STATE) {
    mstate.declareTransition(STATE, "ペア確定", "[SN]\"moved\"を受信した")
    mstate.declareTransitionTimeout(STATE, "タイムアウト", 3000, false)
})
mstate.exportUml("初期化", true, function (line) {
    console.log(line)
})
