# MedBot — Wiring Guide

## ESP32 + INMP441 I2S Microphone

| INMP441 Pin | ESP32 Pin | Notes            |
|-------------|-----------|------------------|
| WS          | GPIO 25   | Word Select      |
| SCK         | GPIO 26   | Serial Clock     |
| SD          | GPIO 27   | Serial Data      |
| L/R         | GND       | Left channel     |
| VDD         | 3.3V      |                  |
| GND         | GND       |                  |

**ESP32 TX → Arduino RX** (Serial communication for clap signal)

---

## Arduino UNO — Full Wiring

### IR Sensors
| Sensor      | Arduino Pin | Purpose                |
|-------------|-------------|------------------------|
| IR Left     | A0          | Line following (left)  |
| IR Right    | A1          | Line following (right) |
| IR Side     | A2          | Room marker detection  |

### L298N Motor Driver
| L298N Pin | Arduino Pin | Purpose              |
|-----------|-------------|----------------------|
| ENA       | D5 (PWM)    | Left motor speed     |
| IN1       | D2          | Left motor dir       |
| IN2       | D3          | Left motor dir       |
| IN3       | D4          | Right motor dir      |
| IN4       | D7          | Right motor dir      |
| ENB       | D6 (PWM)    | Right motor speed    |

### HC-SR04 Ultrasonic
| HC-SR04 Pin | Arduino Pin | Purpose    |
|-------------|-------------|------------|
| Trig        | D8          | Trigger    |
| Echo        | D9          | Echo       |
| VCC         | 5V          |            |
| GND         | GND         |            |

### Buzzer
| Buzzer | Arduino Pin |
|--------|-------------|
| +      | D10         |
| -      | GND         |

### RGB LED
| LED Pin | Arduino Pin |
|---------|-------------|
| Red     | D11         |
| Green   | D12         |
| Blue    | D13         |
| Common  | GND (common cathode) |

---

## Calibration Cheat Sheet

| Variable       | Default | Range       | What It Does                         |
|----------------|---------|-------------|--------------------------------------|
| `baseSpeed`    | 150     | 80–255      | Normal forward speed                 |
| `turnSpeed`    | 100     | 60–200      | Speed during turning corrections     |
| `slowSpeed`    | 90      | 50–120      | Speed near walls                     |
| `TURN_DISTANCE`| 15      | 10–20 cm    | Start slowing down at this distance  |
| `STOP_DISTANCE`| 8       | 5–12 cm     | Full stop at this distance           |
| `roomExitTime` | 800     | 600–1200 ms | Drive time to clear room marker      |
| `CLAP_THRESHOLD`| 2500   | 1500–5000   | Mic sensitivity (ESP32)              |
