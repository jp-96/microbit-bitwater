// mstate.defineStateDescription("受信加算", ["水量の加算", "（トリガーキューのクリア）"], function (STATE) {
mstate.defineState(StateMachines.M0, "受信加算", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        水量 += 受け渡し量
    })
    triggeredTransition(machine, state, "", "アイドル")
})
// mstate.defineStateDescription("送信待ち", ["[SN]\"ACK\"の送信"], function (STATE) {
mstate.defineState(StateMachines.M0, "送信待ち", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("ACK")
    })
    mstate.declareTransition(machine, state, "[SN]\"free\"=(空き容量)を受信した", ["送信完了"], function (args) {
        if (args[0] == 相手のSN) {
            空き容量 = args[1]
            mstate.transitTo(machine, 0)
        }
    })
    timeoutedTransition(machine, state, 3000, "タイムアウト")
})
// transition on triggered
function triggeredTransition (machine: number, state: number, triggerName: string, stateNameTo: string) {
    mstate.declareTransition(machine, state, triggerName, [stateNameTo], function (args) {
        mstate.transitTo(machine, 0)
    })
}
// mstate.defineStateDescription("送信者衝突表示", ["衝突の表示"], function (STATE) {
mstate.defineState(StateMachines.M0, "送信者衝突表示", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        basic.showIcon(IconNames.Confused)
    })
    triggeredTransition(machine, state, "", "傾き待ち")
})
input.onGesture(Gesture.TiltRight, function () {
    mstate.fire(StateMachines.M0, "自分が傾いた", [])
})
// mstate.defineStateDescription("ペア確定", ["[SN]\"moved\"の送信", "[SN]\"pairing\"=(相手のSN)の送受信(500ms)"], function (STATE) {
mstate.defineState(StateMachines.M0, "ペア確定", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("moved")
    })
    mstate.declareDo(machine, state, 500, function () {
        radio.sendValue("pairing", 相手のSN)
    })
    mstate.declareTransition(machine, state, "[SN]\"pairing\"を受信した", ["傾き待ち"], function (args) {
        if (args[0] == 相手のSN && args[1] == control.deviceSerialNumber()) {
            mstate.transitTo(machine, 0)
        }
    })
    timeoutedTransition(machine, state, 3000, "タイムアウト")
})
// mstate.defineStateDescription("受信完了", ["[SN]\"ACK\"の送信"], function (STATE) {
mstate.defineState(StateMachines.M0, "受信完了", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("ACK")
    })
    triggeredTransition(machine, state, "[SN]\"ACK\"を受信した", "受信加算")
    timeoutedTransition(machine, state, 3000, "タイムアウト")
})
input.onGesture(Gesture.TiltLeft, function () {
    mstate.fire(StateMachines.M0, "自分が傾いた", [])
})
// mstate.defineStateDescription("受信者候補", ["[SN]\"receiver\"の送信", "受信の表示"], function (STATE) {
mstate.defineState(StateMachines.M0, "受信者候補", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("receiver")
        basic.showLeds(`
            . . # . .
            . . # . .
            # . # . #
            . # # # .
            . . # . .
            `)
    })
    triggeredTransition(machine, state, "[SN]\"ACK\"を受信した", "受信待ち")
    timeoutedTransition(machine, state, 3000, "タイムアウト")
})
// mstate.defineStateDescription("送信完了", ["[SN]\"share\"=(受け渡し量)の送信"], function (STATE) {
mstate.defineState(StateMachines.M0, "送信完了", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        受け渡し量 = Math.min(空き容量, 水量)
        radio.sendValue("share", 受け渡し量)
    })
    triggeredTransition(machine, state, "[SN]\"ACK\"を受信した", "送信減算")
    timeoutedTransition(machine, state, 3000, "タイムアウト")
})
// mstate.defineStateDescription("送信者衝突", ["[SN]\"NAK\"の送信"], function (STATE) {
mstate.defineState(StateMachines.M0, "送信者衝突", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("NAK")
    })
    triggeredTransition(machine, state, "", "送信者衝突表示")
})
function showNum (value: number) {
    if (10 > value) {
        basic.showNumber(value)
    } else {
        basic.showLeds(`
            # . # # .
            # # . . #
            # # . . #
            # # . . #
            # . # # .
            `)
    }
}
// mstate.defineStateDescription("送信減算", ["[SN]\"ACK\"の送信", "水量の減算", "（トリガーキューのクリア）"], function (STATE) {
mstate.defineState(StateMachines.M0, "送信減算", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("ACK")
        水量 += -1 * 受け渡し量
    })
    triggeredTransition(machine, state, "", "アイドル")
})
// シミュレーターでA+Bを同時に押す為に配置（デバッグ用）
input.onButtonPressed(Button.AB, function () {
	
})
// mstate.defineStateDescription("初期化", ["容量と水量の初期化"], function (STATE) {
mstate.defineState(StateMachines.M0, "初期化", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        容量 = 0
        水量 = 0
    })
    mstate.declareDo(machine, state, 500, function () {
        前回の値 = 今回の値
        今回の値 = 0
        if (input.buttonIsPressed(Button.A)) {
            今回の値 += 10
        }
        if (input.buttonIsPressed(Button.B)) {
            今回の値 += 1
        }
    })
    mstate.declareTransition(machine, state, "", ["アイドル"], function (args) {
        if (0 < 今回の値 && 前回の値 == 今回の値) {
            mstate.transitTo(machine, 0)
            // exit
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
            showNum(容量)
        }
    })
})
radio.onReceivedString(function (receivedString) {
    if ("moved" == receivedString) {
        mstate.fire(StateMachines.M0, "[SN]\"moved\"を受信した", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("sender" == receivedString) {
        mstate.fire(StateMachines.M0, "[SN]\"sender\"を受信した", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("receiver" == receivedString) {
        mstate.fire(StateMachines.M0, "[SN]\"receiver\"を受信した", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("NAK" == receivedString) {
        mstate.fire(StateMachines.M0, "[SN]\"NAK\"を受信した", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("ACK" == receivedString) {
        mstate.fire(StateMachines.M0, "[SN]\"ACK\"を受信した", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else {
    	
    }
})
// mstate.defineStateDescription("相手待ち", [
// "[SN]\"moved\"の送信",
// "__初期化：__",
// "(相手のSN)",
// "相手の(空き容量)",
// "相手の(受け渡し量)"
// ], function (STATE) {
mstate.defineState(StateMachines.M0, "相手待ち", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        basic.showIcon(IconNames.Yes)
        radio.sendString("moved")
        相手のSN = 0
        空き容量 = 0
        受け渡し量 = 0
    })
    mstate.declareTransition(machine, state, "[SN]\"moved\"を受信した", ["ペア確定"], function (args) {
        相手のSN = args[0]
        mstate.transitTo(machine, 0)
    })
    timeoutedTransition(machine, state, 3000, "タイムアウト")
})
// transition on timetouted
function timeoutedTransition (machine: number, state: number, ms: number, stateNameTo: string) {
    mstate.declareTransition(machine, state, "", [stateNameTo], function (args) {
        if (mstate.isTimeouted(machine, ms)) {
            mstate.transitTo(machine, 0)
        }
    })
}
radio.onReceivedValue(function (name, value) {
    if ("pairing" == name) {
        mstate.fire(StateMachines.M0, "[SN]\"pairing\"を受信した", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else if ("free" == name) {
        mstate.fire(StateMachines.M0, "[SN]\"free\"=(空き容量)を受信した", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else if ("share" == name) {
        mstate.fire(StateMachines.M0, "[SN]\"share\"=(受け渡し量)を受信した", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else {
    	
    }
})
// mstate.defineStateName("傾き待ち", function (STATE) {
mstate.defineState(StateMachines.M0, "傾き待ち", function (machine, state) {
    triggeredTransition(machine, state, "自分が傾いた", "送信者候補")
    triggeredTransition(machine, state, "[SN]\"sender\"を受信した", "受信者候補")
    timeoutedTransition(machine, state, 3000, "タイムアウト")
})
// mstate.defineStateDescription("タイムアウト", ["Xの点滅", "__タイムアウト対象:__", "相手待ち ～ 受信完了 | 送信完了"], function (STATE) {
mstate.defineState(StateMachines.M0, "タイムアウト", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        点滅 = 0
        basic.showIcon(IconNames.No)
    })
    mstate.declareDo(machine, state, 200, function () {
        if (0 == 点滅) {
            点滅 = 1
            led.setBrightness(100)
        } else {
            点滅 = 0
            led.setBrightness(255)
        }
    })
    mstate.declareTransition(machine, state, "", ["アイドル"], function (args) {
        if (mstate.isTimeouted(machine, 2000)) {
            mstate.transitTo(machine, 0)
            // exit
            led.setBrightness(255)
            basic.showIcon(IconNames.Happy)
        }
    })
})
// mstate.defineStateDescription("アイドル", ["水量の表示"], function (STATE) {
mstate.defineState(StateMachines.M0, "アイドル", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        showNum(水量)
    })
    mstate.declareDo(machine, state, 100, function () {
        if (1200 < input.acceleration(Dimension.Strength)) {
            mstate.fire(StateMachines.M0, "自分が動いた", [])
        }
    })
    triggeredTransition(machine, state, "自分が動いた", "相手待ち")
})
// mstate.defineStateDescription("送信者候補", ["[SN]\"sender\"の送信", "送信の表示"], function (STATE) {
mstate.defineState(StateMachines.M0, "送信者候補", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("sender")
        basic.showLeds(`
            . . # . .
            . # # # .
            # . # . #
            . . # . .
            . . # . .
            `)
    })
    triggeredTransition(machine, state, "[SN]\"receiver\"を受信した", "送信待ち")
    triggeredTransition(machine, state, "[SN]\"sender\"を受信した", "送信者衝突")
    triggeredTransition(machine, state, "[SN]\"NAK\"を受信した", "送信者衝突表示")
    timeoutedTransition(machine, state, 3000, "タイムアウト")
})
// mstate.defineStateDescription("受信待ち", ["[SN]\"free\"=(空き容量)の送信"], function (STATE) {
mstate.defineState(StateMachines.M0, "受信待ち", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        空き容量 = 容量 - 水量
        radio.sendValue("free", 空き容量)
    })
    // mstate.declareTransitionSelectable(STATE, ["?受信完了"], "[SN]\"share\"=(受け渡し量)を受信した", function () {
    mstate.declareTransition(machine, state, "[SN]\"share\"=(受け渡し量)を受信した", ["受信完了"], function (args) {
        if (args[0] == 相手のSN) {
            受け渡し量 = args[1]
            mstate.transitTo(machine, 0)
        }
    })
    timeoutedTransition(machine, state, 3000, "タイムアウト")
})
let 点滅 = 0
let 今回の値 = 0
let 前回の値 = 0
let 容量 = 0
let 空き容量 = 0
let 相手のSN = 0
let 受け渡し量 = 0
let 水量 = 0
radio.setGroup(1)
radio.setTransmitSerialNumber(true)
// mstate.exportUml("初期化", true, function (line) {
// console.log(line)
// })
mstate.start(StateMachines.M0, "初期化")
