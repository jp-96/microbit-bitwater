mstate.defineState(StateMachines.M0, "分配減算:ACK送信", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("ACK")
        水量 += -1 * 受け渡し量
    })
    mstate.declareSimpleTransition(machine, state, "", "置き待ち")
})
mstate.defineState(StateMachines.M0, "分配待ち:ACK送信", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("ACK")
    })
    mstate.declareCustomTransition(machine, state, "free=", ["分配完了"], function (args) {
        if (args[0] == 相手のSN) {
            mstate.transitTo(machine, 0)
            // effect/
            空き容量 = args[1]
        }
    })
    mstate.declareTimeoutedTransition(machine, state, 1000, "時間切れ::>1s")
})
mstate.defineState(StateMachines.M0, "容量水量", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        resetBitWater()
    })
    mstate.declareDo(machine, state, 200, function () {
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
    mstate.declareExit(machine, state, function () {
        showNum(容量)
    })
    mstate.declareCustomTransition(machine, state, "", ["置き待ち:決定"], function (args) {
        if (0 < 今回の値 && 前回の値 == 今回の値) {
            mstate.transitTo(machine, 0)
            if (1 == 今回の値) {
                容量 = 3
                水量 = 0
            } else if (10 == 今回の値) {
                容量 = 7
                水量 = 0
            } else {
                容量 = 10
                水量 = 容量
            }
        }
    })
})
mstate.defineState(StateMachines.M0, "相手待ち:moved送信", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("moved")
        相手のSN = 0
        空き容量 = 0
        受け渡し量 = 0
        resetBitWater()
    })
    mstate.declareCustomTransition(machine, state, "moved", ["ペア確定"], function (args) {
        mstate.transitTo(machine, 0)
        // effect/
        相手のSN = args[0]
    })
    mstate.declareTimeoutedTransition(machine, state, 2000, "時間切れ::>2s")
})
mstate.defineState(StateMachines.M0, "傾き待ち:アニメーション", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendValue("pair", 相手のSN)
    })
    mstate.declareDo(machine, state, 100, function () {
        waveBitWater()
    })
    mstate.declareSimpleTransition(machine, state, "tilt", "分配候補")
    mstate.declareSimpleTransition(machine, state, "sender", "受取候補")
    mstate.declareTimeoutedTransition(machine, state, 5000, "時間切れ::>5s")
})
// 右に傾いたときに、トリガー(tilt)
input.onGesture(Gesture.TiltRight, function () {
    mstate.fire(StateMachines.M0, "tilt", [])
})
mstate.defineState(StateMachines.M0, "受取待ち:free送信", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        空き容量 = 容量 - 水量
        radio.sendValue("free", 空き容量)
    })
    mstate.declareCustomTransition(machine, state, "share=", ["受取完了"], function (args) {
        if (args[0] == 相手のSN) {
            mstate.transitTo(machine, 0)
            // effect/
            受け渡し量 = args[1]
        }
    })
    mstate.declareTimeoutedTransition(machine, state, 1000, "時間切れ::>1s")
})
mstate.defineState(StateMachines.M0, "アイドル:[動いた]lift送信", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        静止カウント = 0
        showNum(水量)
    })
    mstate.declareDo(machine, state, 100, function () {
        if (加速度差閾値 > diffStrength()) {
            静止カウント = 0
        } else {
            静止カウント += 1
            if (3 < 静止カウント) {
                mstate.fire(StateMachines.M0, "lift", [])
            }
        }
    })
    mstate.declareSimpleTransition(machine, state, "lift", "相手待ち")
})
// 左に傾いたときに、トリガー(tilt)
input.onGesture(Gesture.TiltLeft, function () {
    mstate.fire(StateMachines.M0, "tilt", [])
})
mstate.defineState(StateMachines.M0, "ペア確定:moved送信\\npair送信", function (machine, state) {
    mstate.declareDo(machine, state, 200, function () {
        radio.sendString("moved")
        radio.sendValue("pair", 相手のSN)
    })
    mstate.declareCustomTransition(machine, state, "pair=", ["傾き待ち"], function (args) {
        if (args[0] == 相手のSN && args[1] == control.deviceSerialNumber()) {
            mstate.transitTo(machine, 0)
        }
    })
    mstate.declareTimeoutedTransition(machine, state, 2000, "時間切れ::>2s")
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
mstate.defineState(StateMachines.M0, "分配完了:share送信", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        受け渡し量 = Math.min(空き容量, 水量)
        radio.sendValue("share", 受け渡し量)
    })
    mstate.declareSimpleTransition(machine, state, "ACK", "分配減算")
    mstate.declareTimeoutedTransition(machine, state, 1000, "時間切れ::>1s")
})
mstate.defineState(StateMachines.M0, "時間切れ", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        resetBlink()
        basic.showIcon(IconNames.No)
    })
    mstate.declareDo(machine, state, 200, function () {
        toggleBlink()
    })
    mstate.declareExit(machine, state, function () {
        resetBlink()
    })
    mstate.declareTimeoutedTransition(machine, state, 500, "置き待ち:>500ms")
})
function resetBlink () {
    blink = 0
    led.setBrightness(255)
}
// シミュレーターでA+Bを同時に押す為に配置（デバッグ用）
input.onButtonPressed(Button.AB, function () {
	
})
function resetBitWater () {
    bitwater_brightness = 200
    led.setBrightness(255)
    basic.showLeds(`
        # # # # .
        # # . . #
        # # # # .
        # # . . #
        # # # # .
        `)
    bitwater_pos = 5
    bitwater_pos2 = 7
}
// 無線で文字列を受信したときに、トリガー
radio.onReceivedString(function (receivedString) {
    if ("moved" == receivedString) {
        mstate.fire(StateMachines.M0, "moved", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("sender" == receivedString) {
        mstate.fire(StateMachines.M0, "sender", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("receiver" == receivedString) {
        mstate.fire(StateMachines.M0, "receiver", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("NAK" == receivedString) {
        mstate.fire(StateMachines.M0, "NAK", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("ACK" == receivedString) {
        mstate.fire(StateMachines.M0, "ACK", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else {
    	
    }
})
function diffStrength () {
    前回の値 = 今回の値
    今回の値 = input.acceleration(Dimension.Strength)
    return Math.abs(今回の値 - 前回の値)
}
// 無線でキーと値を受信したときに、トリガー（引数あり）
radio.onReceivedValue(function (name, value) {
    if ("pair" == name) {
        mstate.fire(StateMachines.M0, "pair=", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else if ("free" == name) {
        mstate.fire(StateMachines.M0, "free=", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else if ("share" == name) {
        mstate.fire(StateMachines.M0, "share=", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else {
    	
    }
})
mstate.defineState(StateMachines.M0, "受取候補:receiver送信", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("receiver")
        basic.showIcon(IconNames.SmallHeart)
    })
    mstate.declareSimpleTransition(machine, state, "ACK", "受取待ち")
    mstate.declareTimeoutedTransition(machine, state, 1000, "時間切れ::>1s")
})
mstate.defineState(StateMachines.M0, "受取加算", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        水量 += 受け渡し量
    })
    mstate.declareSimpleTransition(machine, state, "", "置き待ち")
})
mstate.defineState(StateMachines.M0, "分配候補:sender送信", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("sender")
        basic.showIcon(IconNames.Heart)
    })
    mstate.declareSimpleTransition(machine, state, "receiver", "分配待ち")
    mstate.declareTimeoutedTransition(machine, state, 1000, "時間切れ::>1s")
})
function toggleBlink () {
    if (0 == blink) {
        blink = 1
        led.setBrightness(100)
    } else {
        blink = 0
        led.setBrightness(255)
    }
}
mstate.defineState(StateMachines.M0, "受取完了:ACK送信", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        radio.sendString("ACK")
    })
    mstate.declareSimpleTransition(machine, state, "ACK", "受取加算")
    mstate.declareTimeoutedTransition(machine, state, 1000, "時間切れ::>1s")
})
mstate.defineState(StateMachines.M0, "置き待ち:↓表示", function (machine, state) {
    mstate.declareEntry(machine, state, function () {
        resetBlink()
        basic.showLeds(`
            . . # . .
            . . # . .
            # . # . #
            . # # # .
            . . # . .
            `)
        静止カウント = 0
    })
    mstate.declareDo(machine, state, 200, function () {
        toggleBlink()
        if (加速度差閾値 > diffStrength()) {
            静止カウント += 1
        } else {
            静止カウント = 0
        }
    })
    mstate.declareExit(machine, state, function () {
        resetBlink()
    })
    mstate.declareCustomTransition(machine, state, "", ["アイドル"], function (args) {
        if (5 < 静止カウント) {
            mstate.transitTo(machine, 0)
        }
    })
})
let blink = 0
let bitwater_pos2 = 0
let bitwater_brightness = 0
let bitwater_pos = 0
let bitwater_y = 0
let 静止カウント = 0
let 容量 = 0
let 今回の値 = 0
let 前回の値 = 0
let 空き容量 = 0
let 相手のSN = 0
let 受け渡し量 = 0
let 水量 = 0
let 加速度差閾値 = 0
加速度差閾値 = 17
pins.setPull(DigitalPin.P1, PinPullMode.PullUp)
pins.setPull(DigitalPin.P2, PinPullMode.PullUp)
radio.setGroup(1)
radio.setTransmitSerialNumber(true)
resetBlink()
mstate.start(StateMachines.M0, "容量水量")
mstate.exportUml(StateMachines.M0, "容量水量")
