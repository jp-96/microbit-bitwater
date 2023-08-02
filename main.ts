mstate.defineStateDescription("初期化", ["容量と水量の初期化"], function (STATE) {
    mstate.declareTransition(STATE, "アイドル", "初期化完了")
})
mstate.defineStateDescription("アイドル", ["水量の表示"], function (STATE) {
	
})
mstate.exportUml("初期化", true, function (line) {
    console.log(line)
})
