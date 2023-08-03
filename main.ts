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
    mstate.declareEntry(STATE, function (prev) {
        容量 = 0
        水量 = 0
    })
    mstate.declareDo(STATE, 500, function () {
        前回の値 = 今回の値
        今回の値 = 0
        if (input.buttonIsPressed(Button.A)) {
            今回の値 += 10
        }
        if (input.buttonIsPressed(Button.B)) {
            今回の値 += 1
        }
    })
    mstate.declareExit(STATE, function (next) {
        if (1 == 今回の値) {
            容量 = 3
            水量 = 0
        } else if (10 == 今回の値) {
            容量 = 7
            水量 = 0
        } else {
            容量 = 10
            水量 = 10
        }
        if (10 > 容量) {
            basic.showNumber(容量)
        } else {
            basic.showLeds(`
                # . # # .
                # # . . #
                # # . . #
                # # . . #
                # . # # .
                `)
        }
    })
    mstate.declareTransitionSelectable(STATE, ["アイドル"], "", function () {
        if (0 < 今回の値 && 前回の値 == 今回の値) {
            mstate.selectTo("アイドル")
        }
    })
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
mstate.defineStateDescription("タイムアウト", ["Xの点滅", "__タイムアウト対象:__", "相手待ち ～ 受信完了 | 送信完了"], function (STATE) {
    mstate.declareEntry(STATE, function (prev) {
        点滅 = 0
        basic.showIcon(IconNames.No)
    })
    mstate.declareDo(STATE, 200, function () {
        if (0 == 点滅) {
            点滅 = 1
            led.setBrightness(100)
        } else {
            点滅 = 0
            led.setBrightness(255)
        }
    })
    mstate.declareExit(STATE, function (next) {
        led.setBrightness(255)
        basic.showIcon(IconNames.Happy)
    })
    mstate.declareTransitionTimeout(STATE, "アイドル", 2000, true)
})
mstate.defineStateDescription("送信待ち", ["[SN]\"ACK\"の送信"], function (STATE) {
    mstate.declareTransition(STATE, "送信完了", "[SN]\"free\"=(空き容量)を受信した")
    mstate.declareTransitionTimeout(STATE, "タイムアウト", 3000, false)
})
// シミュレーターでA+Bを同時に押す為に配置（デバッグ用）
input.onButtonPressed(Button.AB, function () {
	
})
radio.onReceivedString(function (receivedString) {
    if ("moved" == receivedString) {
        最新のシリアル番号 = radio.receivedPacket(RadioPacketProperty.SerialNumber)
        mstate.fire("[SN]\"moved\"を受信した")
    } else {
    	
    }
})
radio.onReceivedValue(function (name, value) {
	
})
mstate.defineStateDescription("アイドル", ["水量の表示"], function (STATE) {
    mstate.declareEntry(STATE, function (prev) {
        if (10 > 水量) {
            basic.showNumber(水量)
        } else {
            basic.showLeds(`
                # . # # .
                # # . . #
                # # . . #
                # # . . #
                # . # # .
                `)
        }
    })
    mstate.declareDo(STATE, 100, function () {
        if (1200 < input.acceleration(Dimension.Strength)) {
            mstate.fire("自分が動いた")
        }
    })
    mstate.declareTransition(STATE, "相手待ち", "自分が動いた")
})
mstate.defineStateDescription("相手待ち", [
"[SN]\"moved\"の送信",
"__初期化：__",
"(相手のSN)",
"相手の(空き容量)",
"相手の(受け渡し量)"
], function (STATE) {
    mstate.declareEntry(STATE, function (prev) {
        radio.sendString("moved")
        相手のSN = 0
        相手の空き容量 = 0
        相手の受け渡し量 = 0
    })
    mstate.declareExit("State1", function (next) {
        if (mstate.convName(next) == "ペア確定") {
            相手のSN = 最新のシリアル番号
        }
    })
    mstate.declareTransition(STATE, "ペア確定", "[SN]\"moved\"を受信した")
    mstate.declareTransitionTimeout(STATE, "タイムアウト", 3000, false)
})
let 相手の受け渡し量 = 0
let 相手の空き容量 = 0
let 相手のSN = 0
let 最新のシリアル番号 = 0
let 点滅 = 0
let 今回の値 = 0
let 前回の値 = 0
let 水量 = 0
let 容量 = 0
radio.setGroup(1)
radio.setTransmitSerialNumber(true)
mstate.exportUml("初期化", true, function (line) {
    console.log(line)
})
mstate.start("初期化")
