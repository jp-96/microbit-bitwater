mstate.defineState(StateMachines.M0, "受取加算", function () {
    mstate.declareEntry(function () {
        水量 += 受け渡し量
    })
    mstate.declareSimpleTransition("", "置き待ち")
})
mstate.defineState(StateMachines.M0, "置き待ち", function () {
    mstate.descriptionUml("↓表示")
    mstate.declareEntry(function () {
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
    mstate.declareDoActivity(200, function (counter) {
        toggleBlink()
        if (加速度差閾値 > diffStrength()) {
            静止カウント += 1
        } else {
            静止カウント = 0
        }
    })
    mstate.declareExit(function () {
        resetBlink()
    })
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
        basic.showIcon(IconNames.Heart)
    })
    mstate.declareSimpleTransition("receiver", "分配待ち")
    transitionAfter(1000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "ペア確定", function () {
    mstate.descriptionUml("moved送信\\npair送信")
    mstate.declareDoActivity(200, function (counter) {
        radio.sendString("moved")
        radio.sendValue("pair", 相手のSN)
    })
    mstate.declareStateTransition("pair=", ["傾き待ち"], function () {
        if (mstate.getTriggerArgs(StateMachines.M0)[0] == 相手のSN && mstate.getTriggerArgs(StateMachines.M0)[1] == control.deviceSerialNumber()) {
            mstate.traverse(StateMachines.M0, 0)
        }
    })
    transitionAfter(2000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "相手待ち", function () {
    mstate.descriptionUml("moved送信")
    mstate.declareEntry(function () {
        radio.sendString("moved")
        相手のSN = 0
        空き容量 = 0
        受け渡し量 = 0
        resetBitWater()
    })
    mstate.declareStateTransition("moved", ["ペア確定"], function () {
        mstate.traverse(StateMachines.M0, 0)
        // effect/
        相手のSN = mstate.getTriggerArgs(StateMachines.M0)[0]
    })
    transitionAfter(2000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "受取候補", function () {
    mstate.descriptionUml("receiver送信")
    mstate.declareEntry(function () {
        radio.sendString("receiver")
        basic.showIcon(IconNames.SmallHeart)
    })
    mstate.declareSimpleTransition("ACK", "受取待ち")
    transitionAfter(1000, "時間切れ")
})
// 右に傾いたときに、トリガー(tilt)
input.onGesture(Gesture.TiltRight, function () {
    mstate.sendTrigger(StateMachines.M0, "tilt")
})
mstate.defineState(StateMachines.M0, "分配完了", function () {
    mstate.descriptionUml("share送信")
    mstate.declareEntry(function () {
        受け渡し量 = Math.min(空き容量, 水量)
        radio.sendValue("share", 受け渡し量)
    })
    mstate.declareSimpleTransition("ACK", "分配減算")
    transitionAfter(1000, "時間切れ")
})
function transitionAfter (ms: number, target: string) {
    mstate.declareDoActivity(ms, function (counter) {
        timeouted = counter
    })
    if ("時間切れ" == target) {
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
    mstate.declareSimpleTransition("sender", "受取候補")
    transitionAfter(5000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "容量水量", function () {
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
    mstate.declareExit(function () {
        showNum(容量)
    })
    mstate.descriptionUml("決定")
    mstate.declareStateTransition("", ["置き待ち"], function () {
        if (0 < 今回の値 && 前回の値 == 今回の値) {
            mstate.traverse(StateMachines.M0, 0)
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
// 左に傾いたときに、トリガー(tilt)
input.onGesture(Gesture.TiltLeft, function () {
    mstate.sendTrigger(StateMachines.M0, "tilt")
})
mstate.defineState(StateMachines.M0, "アイドル", function () {
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
mstate.defineState(StateMachines.M0, "分配減算", function () {
    mstate.descriptionUml("ACK送信")
    mstate.declareEntry(function () {
        radio.sendString("ACK")
        水量 += -1 * 受け渡し量
    })
    mstate.declareSimpleTransition("", "置き待ち")
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
mstate.defineState(StateMachines.M0, "時間切れ", function () {
    mstate.declareEntry(function () {
        resetBlink()
        basic.showIcon(IconNames.No)
    })
    mstate.declareDoActivity(200, function (counter) {
        toggleBlink()
    })
    mstate.declareExit(function () {
        resetBlink()
    })
    transitionAfter(500, "置き待ち")
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
        mstate.sendTriggerArgs(StateMachines.M0, "moved", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("sender" == receivedString) {
        mstate.sendTriggerArgs(StateMachines.M0, "sender", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("receiver" == receivedString) {
        mstate.sendTriggerArgs(StateMachines.M0, "receiver", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("NAK" == receivedString) {
        mstate.sendTriggerArgs(StateMachines.M0, "NAK", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
    } else if ("ACK" == receivedString) {
        mstate.sendTriggerArgs(StateMachines.M0, "ACK", [radio.receivedPacket(RadioPacketProperty.SerialNumber)])
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
        mstate.sendTriggerArgs(StateMachines.M0, "pair=", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else if ("free" == name) {
        mstate.sendTriggerArgs(StateMachines.M0, "free=", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else if ("share" == name) {
        mstate.sendTriggerArgs(StateMachines.M0, "share=", [radio.receivedPacket(RadioPacketProperty.SerialNumber), value])
    } else {
    	
    }
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
mstate.defineState(StateMachines.M0, "受取完了", function () {
    mstate.descriptionUml("ACK送信")
    mstate.declareEntry(function () {
        radio.sendString("ACK")
    })
    mstate.declareSimpleTransition("ACK", "受取加算")
    transitionAfter(1000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "分配待ち", function () {
    mstate.descriptionUml("ACK送信")
    mstate.declareEntry(function () {
        radio.sendString("ACK")
    })
    mstate.declareStateTransition("free=", ["分配完了"], function () {
        if (mstate.getTriggerArgs(StateMachines.M0)[0] == 相手のSN) {
            mstate.traverse(StateMachines.M0, 0)
            // effect/
            空き容量 = mstate.getTriggerArgs(StateMachines.M0)[1]
        }
    })
    transitionAfter(1000, "時間切れ")
})
mstate.defineState(StateMachines.M0, "受取待ち", function () {
    mstate.descriptionUml("free送信")
    mstate.declareEntry(function () {
        空き容量 = 容量 - 水量
        radio.sendValue("free", 空き容量)
    })
    mstate.declareStateTransition("share=", ["受取完了"], function () {
        if (mstate.getTriggerArgs(StateMachines.M0)[0] == 相手のSN) {
            mstate.traverse(StateMachines.M0, 0)
            // effect/
            受け渡し量 = mstate.getTriggerArgs(StateMachines.M0)[1]
        }
    })
    transitionAfter(1000, "時間切れ")
})
let blink = 0
let bitwater_pos2 = 0
let bitwater_brightness = 0
let bitwater_pos = 0
let bitwater_y = 0
let 容量 = 0
let 今回の値 = 0
let 前回の値 = 0
let timeouted = 0
let 空き容量 = 0
let 相手のSN = 0
let 静止カウント = 0
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
