import { useState } from "react";

const ESP32_CODE = `/*
 * ═══════════════════════════════════════════════════════
 * ESP32 CLAP DETECTION — INMP441 I2S Microphone
 * Omnitrix Healthcare Delivery Robot (Stealth Mode)
 * ═══════════════════════════════════════════════════════
 *
 * Wiring:
 * INMP441    →  ESP32
 * ────────────────────
 * WS         →  GPIO 25
 * SCK        →  GPIO 26
 * SD         →  GPIO 27
 * L/R        →  GND (left channel)
 * VDD        →  3.3V  (CRITICAL: DO NOT USE 5V)
 * GND        →  GND
 *
 * Output:
 * Sends '1' via Serial (115200) when clap detected.
 * All debug text is commented out for final hardware integration.
 */

#include <driver/i2s.h>

// ── CONFIGURABLE PARAMETERS ──
#define CLAP_THRESHOLD    2500
#define DEBOUNCE_MS       1500
#define SAMPLE_RATE       16000
#define BUFFER_SIZE       512
#define I2S_PORT          I2S_NUM_0

// ── I2S PINS ──
#define I2S_WS   25
#define I2S_SCK  26
#define I2S_SD   27

int32_t sampleBuffer[BUFFER_SIZE];
unsigned long lastClapTime = 0;

void setupI2S() {
  const i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT,
    .channel_format = I2S_CHANNEL_FMT_ONLY_LEFT,
    .communication_format = I2S_COMM_FORMAT_STAND_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 4,
    .dma_buf_len = BUFFER_SIZE
  };

  const i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_SCK,
    .ws_io_num  = I2S_WS,
    .data_in_num = I2S_SD
  };

  i2s_driver_install(I2S_PORT, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_PORT, &pin_config);
  i2s_zero_dma_buffer(I2S_PORT);
  delay(500);
}

int32_t getPeakAmplitude() {
  size_t bytesRead = 0;
  i2s_read(I2S_PORT, (void*)sampleBuffer, sizeof(sampleBuffer), &bytesRead, portMAX_DELAY);
  
  int32_t peak = 0;
  for (int i = 0; i < bytesRead / sizeof(int32_t); i++) {
    int32_t sample = abs(sampleBuffer[i] >> 8);
    if (sample > peak) peak = sample;
  }
  return peak;
}

void setup() {
  Serial.begin(115200);
  setupI2S();
}

void loop() {
  int32_t amplitude = getPeakAmplitude();
  
  if (amplitude > CLAP_THRESHOLD) {
    if (millis() - lastClapTime > DEBOUNCE_MS) {
      lastClapTime = millis();
      Serial.print('1');
    }
  }
}`;

const ARDUINO_CODE = `/*
 * ═══════════════════════════════════════════════════════════════
 * ARDUINO UNO — Line Following Healthcare Delivery Robot
 * Omnitrix: Room Patrol + Clap Request + Pharmacy Dispensing
 * ═══════════════════════════════════════════════════════════════
 */

int baseSpeed      = 150;    
int turnSpeed      = 100;    
int slowSpeed      = 90;     
int TURN_DISTANCE  = 15;     
int STOP_DISTANCE  = 8;      
int roomExitTime   = 800;    
int clapWaitTime   = 5000;   
int buzzerDuration = 2000;   

#define IR_LEFT       12    
#define IR_RIGHT      13    
#define IR_SIDE       8     

#define ENA           9     
#define IN1           4     
#define IN2           5     
#define IN3           6     
#define IN4           7     
#define ENB           10    

#define TRIG_PIN      A0
#define ECHO_PIN      A1

#define BUZZER_PIN    2

#define LED_RED       A2
#define LED_GREEN     A3
#define LED_BLUE      A4

int requests[5] = {0, 0, 0, 0, 0};  
int roomCount   = 0;                  
bool patrolDone = false;              
int irLeftVal, irRightVal, irSideVal;

void setMotorSpeed(int left, int right) {
  analogWrite(ENA, constrain(left, 0, 255));
  analogWrite(ENB, constrain(right, 0, 255));
}

void moveForward(int speed) {
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  setMotorSpeed(speed, speed);
}

void turnLeft(int speed) {
  digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH); digitalWrite(IN4, LOW);
  setMotorSpeed(0, speed);
}

void turnRight(int speed) {
  digitalWrite(IN1, HIGH); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
  setMotorSpeed(speed, 0);
}

void stopMotors() {
  digitalWrite(IN1, LOW); digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW); digitalWrite(IN4, LOW);
  setMotorSpeed(0, 0);
}

long getDistance() {
  digitalWrite(TRIG_PIN, LOW); delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long dur = pulseIn(ECHO_PIN, HIGH, 30000);
  return dur == 0 ? 999 : dur * 0.034 / 2;
}

void readIRSensors() {
  irLeftVal  = digitalRead(IR_LEFT);
  irRightVal = digitalRead(IR_RIGHT);
  irSideVal  = digitalRead(IR_SIDE);
}

void followLine() {
  readIRSensors();
  long dist = getDistance();

  if (dist < STOP_DISTANCE) {
    stopMotors();
    while (getDistance() < STOP_DISTANCE) { delay(100); }
    delay(200); 
    return;
  }

  int spd = (dist < TURN_DISTANCE) ? slowSpeed : baseSpeed;

  if (irLeftVal == HIGH && irRightVal == HIGH) { moveForward(spd); }
  else if (irLeftVal == LOW && irRightVal == HIGH) { turnLeft(turnSpeed); }
  else if (irLeftVal == HIGH && irRightVal == LOW) { turnRight(turnSpeed); }
  else { moveForward(slowSpeed); }
}

void buzzerOn()  { digitalWrite(BUZZER_PIN, LOW); }
void buzzerOff() { digitalWrite(BUZZER_PIN, HIGH); }
void buzzerBeep(int dur) { buzzerOn(); delay(dur); buzzerOff(); }

void ledOff()   { digitalWrite(LED_RED,LOW); digitalWrite(LED_GREEN,LOW); digitalWrite(LED_BLUE,LOW); }
void ledGreen() { ledOff(); digitalWrite(LED_GREEN, HIGH); }
void ledRed()   { ledOff(); digitalWrite(LED_RED, HIGH); }
void ledBlue()  { ledOff(); digitalWrite(LED_BLUE, HIGH); }

bool listenForClap() {
  while (Serial.available()) { Serial.read(); }
  unsigned long start = millis();
  while (millis() - start < (unsigned long)clapWaitTime) {
    if (Serial.available()) {
      if (Serial.read() == '1') return true;
    }
    delay(10);
  }
  return false;
}

void handleRoom() {
  stopMotors(); delay(300);
  buzzerBeep(buzzerDuration); delay(300);

  ledBlue();
  bool clap = listenForClap();

  if (clap) { requests[roomCount] = 1; ledGreen(); buzzerBeep(200); }
  else      { requests[roomCount] = 0; ledRed(); }

  delay(1000); ledOff(); roomCount++;
  moveForward(baseSpeed); delay(roomExitTime);
}

void handlePharmacy() {
  stopMotors(); delay(500);
  for (int i = 0; i < 5; i++) { buzzerBeep(300); delay(200); }
  delay(500);

  int total = 0;
  for (int i = 0; i < 5; i++) { total += requests[i]; }

  for (int i = 0; i < 5; i++) {
    if (requests[i] == 1) { ledGreen(); buzzerBeep(100); }
    else { ledRed(); }
    delay(1500); ledOff(); delay(300);
  }

  for (int i = 0; i < total; i++) {
    ledGreen(); buzzerBeep(400); delay(400); ledOff(); delay(300);
  }

  ledBlue(); delay(2000); ledOff();
  patrolDone = true;
}

void setup() {
  Serial.begin(115200);
  pinMode(IR_LEFT, INPUT); pinMode(IR_RIGHT, INPUT); pinMode(IR_SIDE, INPUT);
  pinMode(ENA, OUTPUT); pinMode(IN1, OUTPUT); pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT); pinMode(IN4, OUTPUT); pinMode(ENB, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT); pinMode(ECHO_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, HIGH);
  pinMode(LED_RED, OUTPUT); pinMode(LED_GREEN, OUTPUT); pinMode(LED_BLUE, OUTPUT);
  ledOff();
  ledGreen(); buzzerBeep(500); delay(500); ledOff();
  delay(1000);
}

void loop() {
  if (patrolDone) { stopMotors(); delay(5000); return; }
  readIRSensors();
  if (irSideVal == LOW && roomCount < 5) {
    handleRoom();
    if (roomCount >= 5) {
      moveForward(baseSpeed); delay(2000);
      handlePharmacy(); return;
    }
  }
  followLine();
}`;

const CONFIG_DATA = {
  esp32: [
    { name: "CLAP_THRESHOLD", value: "2500", range: "1500–5000", desc: "Mic sensitivity for clap detection" },
    { name: "DEBOUNCE_MS", value: "1500", range: "500–3000", desc: "Cooldown after clap" },
    { name: "SAMPLE_RATE", value: "16000", range: "8000–44100", desc: "I2S sampling rate" },
    { name: "BUFFER_SIZE", value: "512", range: "256–1024", desc: "Audio buffer size" },
  ],
  arduino: [
    { name: "baseSpeed", value: "150", range: "80–255", desc: "Normal forward speed" },
    { name: "turnSpeed", value: "100", range: "60–200", desc: "Turning correction speed" },
    { name: "slowSpeed", value: "90", range: "50–120", desc: "Near-wall speed" },
    { name: "TURN_DISTANCE", value: "15", range: "10–20 cm", desc: "Slow down threshold" },
    { name: "STOP_DISTANCE", value: "8", range: "5–15 cm", desc: "Obstacle stop threshold" },
    { name: "roomExitTime", value: "800", range: "600–1200 ms", desc: "Drive time to clear marker" },
    { name: "clapWaitTime", value: "5000", range: "3000–8000 ms", desc: "Listen duration for clap" },
  ],
};

export default function FirmwareTab() {
  const [activeBoard, setActiveBoard] = useState("esp32");
  const [copied, setCopied] = useState(false);

  const code = activeBoard === "esp32" ? ESP32_CODE : ARDUINO_CODE;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="firmware-tab">
      {/* Board Selector */}
      <div className="board-selector">
        <button
          className={`board-btn ${activeBoard === "esp32" ? "board-btn--active" : ""}`}
          onClick={() => setActiveBoard("esp32")}
        >
          <span className="board-btn__icon">📡</span>
          <div>
            <div className="board-btn__title">ESP32</div>
            <div className="board-btn__subtitle">Clap Detection (INMP441)</div>
          </div>
        </button>
        <button
          className={`board-btn ${activeBoard === "arduino" ? "board-btn--active" : ""}`}
          onClick={() => setActiveBoard("arduino")}
        >
          <span className="board-btn__icon">🤖</span>
          <div>
            <div className="board-btn__title">Arduino UNO</div>
            <div className="board-btn__subtitle">Robot Controller</div>
          </div>
        </button>
      </div>

      <div className="firmware-grid">
        {/* Code Viewer */}
        <div className="code-panel">
          <div className="code-panel__header">
            <span className="code-panel__title">
              {activeBoard === "esp32" ? "esp32_clap_detection.ino" : "arduino_robot_control.ino"}
            </span>
            <button className="copy-btn" onClick={handleCopy}>
              {copied ? "✅ Copied!" : "📋 Copy Code"}
            </button>
          </div>
          <pre className="code-block">
            <code>{code}</code>
          </pre>
        </div>

        {/* Config Panel */}
        <div className="config-panel">
          <h3 className="config-panel__title">
            ⚙️ Calibration Variables
          </h3>
          <p className="config-panel__desc">
            Tune these values for your specific hardware
          </p>
          <div className="config-list">
            {CONFIG_DATA[activeBoard].map((item) => (
              <div className="config-item" key={item.name}>
                <div className="config-item__header">
                  <code className="config-item__name">{item.name}</code>
                  <span className="config-item__value">{item.value}</span>
                </div>
                <div className="config-item__meta">
                  <span className="config-item__range">Range: {item.range}</span>
                </div>
                <p className="config-item__desc">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* System Flow */}
          <div className="flow-card">
            <h4 className="flow-card__title">📋 System Flow</h4>
            {activeBoard === "esp32" ? (
              <div className="flow-steps">
                <div className="flow-step">
                  <span className="flow-step__num">1</span>
                  <span>I2S reads audio from INMP441</span>
                </div>
                <div className="flow-step">
                  <span className="flow-step__num">2</span>
                  <span>Calculate peak amplitude from buffer</span>
                </div>
                <div className="flow-step">
                  <span className="flow-step__num">3</span>
                  <span>Compare against threshold (2500)</span>
                </div>
                <div className="flow-step">
                  <span className="flow-step__num">4</span>
                  <span>If clap → Send '1' via Serial</span>
                </div>
                <div className="flow-step">
                  <span className="flow-step__num">5</span>
                  <span>Debounce for 1.5 seconds</span>
                </div>
              </div>
            ) : (
              <div className="flow-steps">
                <div className="flow-step">
                  <span className="flow-step__num">1</span>
                  <span>Follow line using straddle logic</span>
                </div>
                <div className="flow-step">
                  <span className="flow-step__num">2</span>
                  <span>Side IR detects room → Stop + Buzzer</span>
                </div>
                <div className="flow-step">
                  <span className="flow-step__num">3</span>
                  <span>Listen 5s for ESP32 clap signal</span>
                </div>
                <div className="flow-step">
                  <span className="flow-step__num">4</span>
                  <span>Record request (1) or no request (0)</span>
                </div>
                <div className="flow-step">
                  <span className="flow-step__num">5</span>
                  <span>After 5 rooms → Pharmacy → LED blinks</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
