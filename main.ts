mstate.defineState(StateMachines.M0, "置き待ち", function () {
    mstate.descriptionUml("↓表示")
    mstate.declareEntry(function () {
        led.setBrightness(255)
        静止カウント = 0
        basic.showIcon(IconNames.Sword)
    })
    mstate.declareDoActivity(200, function (counter) {
        if (加速度差閾値 > diffStrength()) {
            静止カウント += 1
        } else {
            静止カウント = 0
        }
    })
    mstate.descriptionUml("静止1s")
    mstate.declareStateTransition("", ["アイドル"], function () {
        if (5 < 静止カウント) {
            mstate.traverse(StateMachines.M0, 0)
        }
    })
})
mstate.defineState(StateMachines.M0, "分配候補", function () {
    mstate.descriptionUml("sender送信")
    mstate.declareEntry(function () {
        radio.sendString("sender")
        basic.showIcon(IconNames.Yes)
    })
    mstate.descriptionUml("期待する相手のSN/share送信と水量の減算")
    mstate.declareStateTransition("free", ["置き待ち"], function () {
        if (mstate.getTriggerArgs(StateMachines.M0)[0] == 相手のSN) {
            mstate.traverse(StateMachines.M0, 0)
            受け渡し量 = Math.min(mstate.getTriggerArgs(StateMachines.M0)[1], 水量)
            radio.sendValue("share", 受け渡し量)
            水量 += -1 * 受け渡し量
        }
    })
    transitionAfter(1000, "置き待ち")
})
mstate.defineState(StateMachines.M0, "相手待ち", function () {
    mstate.descriptionUml("moved送信")
    mstate.declareEntry(function () {
        radio.sendString("moved")
        resetBitWater()
    })
    mstate.descriptionUml("moved受信で相手のSNを保持し、movedの再送とpairの送信")
    mstate.declareStateTransition("moved", [], function () {
        // effect/
        相手のSN = mstate.getTriggerArgs(StateMachines.M0)[0]
        radio.sendString("moved")
        radio.sendValue("pair", 相手のSN)
    })
    mstate.descriptionUml("互いのSNが一致")
    mstate.declareStateTransition("pair", ["傾き待ち"], function () {
        if (mstate.getTriggerArgs(StateMachines.M0)[0] == 相手のSN && mstate.getTriggerArgs(StateMachines.M0)[1] == control.deviceSerialNumber()) {
            mstate.traverse(StateMachines.M0, 0)
        }
    })
    transitionAfter(2000, "置き待ち")
})
// 右に傾いたときに、トリガー(tilt)
input.onGesture(Gesture.TiltRight, function () {
    mstate.sendTrigger(StateMachines.M0, "tilt")
})
function transitionAfter (ms: number, target: string) {
    mstate.declareDoActivity(ms, function (counter) {
        timeouted = counter
    })
    if ("置き待ち" == target) {
        mstate.descriptionUml(":" + "after " + ms + "ms")
    } else {
        mstate.descriptionUml("after " + ms + "ms")
    }
    mstate.declareStateTransition("", [target], function () {
        if (0 < timeouted) {
            mstate.traverse(StateMachines.M0, 0)
        }
    })
}
mstate.defineState(StateMachines.M0, "傾き待ち", function () {
    mstate.declareEntry(function () {
        radio.sendValue("pair", 相手のSN)
    })
    mstate.descriptionUml("アニメーション")
    mstate.declareDoActivity(100, function (counter) {
        waveBitWater()
    })
    mstate.declareSimpleTransition("tilt", "分配候補")
    mstate.declareSimpleTransition("sender", "受取待ち")
    transitionAfter(5000, "置き待ち")
})
mstate.defineState(StateMachines.M0, "容量水量", function () {
    mstate.descriptionUml("容量の選択")
    mstate.declareEntry(function () {
        resetBitWater()
    })
    mstate.declareDoActivity(200, function (counter) {
        waveBitWater()
        前回の値 = 今回の値
        今回の値 = 0
        if (input.buttonIsPressed(Button.A) || 0 == pins.digitalReadPin(DigitalPin.P1)) {
            今回の値 += 10
        }
        if (input.buttonIsPressed(Button.B) || 0 == pins.digitalReadPin(DigitalPin.P2)) {
            今回の値 += 1
        }
    })
    mstate.descriptionUml("選択/容量と水量の初期化")
    mstate.declareStateTransition("", ["置き待ち"], function () {
        if (0 < 今回の値 && 前回の値 == 今回の値) {
            mstate.traverse(StateMachines.M0, 0)
            if (1 == 今回の値) {
                initBitWater(3, 0)
            } else if (10 == 今回の値) {
                initBitWater(7, 0)
            } else {
                initBitWater(10, 10)
            }
        }
    })
})
// 左に傾いたときに、トリガー(tilt)
input.onGesture(Gesture.TiltLeft, function () {
    mstate.sendTrigger(StateMachines.M0, "tilt")
})
mstate.defineState(StateMachines.M0, "アイドル", function () {
    mstate.descriptionUml("水量を表示して待つ")
    mstate.declareEntry(function () {
        静止カウント = 0
        showNum(水量)
    })
    mstate.declareDoActivity(100, function (counter) {
        if (加速度差閾値 > diffStrength()) {
            静止カウント = 0
        } else {
            静止カウント += 1
        }
    })
    mstate.descriptionUml("動いた")
    mstate.declareStateTransition("", ["相手待ち"], function () {
        if (3 < 静止カウント) {
            mstate.traverse(StateMachines.M0, 0)
        }
    })
})
// 0～10までの数字を一文字で表示
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
function waveBitWater () {
    for (let bitwater_x = 0; bitwater_x <= 4; bitwater_x++) {
        bitwater_y = bitwater_pos
        if (led.point(bitwater_x, bitwater_y)) {
            led.plotBrightness(bitwater_x, bitwater_y, bitwater_brightness)
        }
    }
    for (let bitwater_x2 = 0; bitwater_x2 <= 4; bitwater_x2++) {
        bitwater_y = bitwater_pos2
        if (led.point(bitwater_x2, bitwater_y)) {
            led.plotBrightness(bitwater_x2, bitwater_y, 255)
        }
    }
    bitwater_pos = (bitwater_pos + 1) % 8
    bitwater_pos2 = (bitwater_pos2 + 1) % 8
}
// シミュレーターでA+Bを同時に押す為に配置（デバッグ用）
input.onButtonPressed(Button.AB, function () {
	
})
function resetBitWater () {
    bitwater_brightness = 200
    bitwater_pos = 5
    bitwater_pos2 = 7
    led.setBrightness(255)
    basic.showString("B")
}
// 無線で文字列を受信したときに、トリガー
radio.onReceivedString(function (receivedString) {
    mstate.sendTriggerArgs(StateMachines.M0, receivedString, [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
})
function diffStrength () {
    前回の値 = 今回の値
    今回の値 = input.acceleration(Dimension.Strength)
    return Math.abs(今回の値 - 前回の値)
}
function initBitWater (設定容量: number, 設定水量: number) {
    容量 = 設定容量
    水量 = 設定水量
    showNum(容量)
}
// 無線でキーと値を受信したときに、トリガー（引数あり）
radio.onReceivedValue(function (name, value) {
    mstate.sendTriggerArgs(StateMachines.M0, name, [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
})
mstate.defineState(StateMachines.M0, "受取待ち", function () {
    mstate.descriptionUml("free送信")
    mstate.declareEntry(function () {
        radio.sendValue("free", 容量 - 水量)
        basic.showIcon(IconNames.Diamond)
    })
    mstate.descriptionUml("期待する相手のSN/水量の加算")
    mstate.declareStateTransition("share", ["置き待ち"], function () {
        if (mstate.getTriggerArgs(StateMachines.M0)[0] == 相手のSN) {
            mstate.traverse(StateMachines.M0, 0)
            水量 += mstate.getTriggerArgs(StateMachines.M0)[1]
        }
    })
    transitionAfter(1000, "置き待ち")
})
let 容量 = 0
let bitwater_pos2 = 0
let bitwater_brightness = 0
let bitwater_pos = 0
let bitwater_y = 0
let 今回の値 = 0
let 前回の値 = 0
let timeouted = 0
let 水量 = 0
let 受け渡し量 = 0
let 相手のSN = 0
let 静止カウント = 0
let 加速度差閾値 = 0
加速度差閾値 = 17
pins.setPull(DigitalPin.P1, PinPullMode.PullUp)
pins.setPull(DigitalPin.P2, PinPullMode.PullUp)
radio.setGroup(1)
radio.setTransmitSerialNumber(true)
mstate.start(StateMachines.M0, "容量水量")
mstate.exportUml(StateMachines.M0, "容量水量", false)
radio.sendString("hello")
