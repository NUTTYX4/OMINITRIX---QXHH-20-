/*
 * ═══════════════════════════════════════════════════════════════
 *  ARDUINO UNO — Line Following Healthcare Delivery Robot
 *  MedBot: Room Patrol + Clap Request + Pharmacy Dispensing
 * ═══════════════════════════════════════════════════════════════
 *
 *  System Flow:
 *    START → Room1 → Room2 → Room3 → Room4 → Room5 → PHARMACY
 *
 *  At each room:
 *    1. Side IR detects room marker → Robot stops
 *    2. Buzzer sounds for 2 seconds
 *    3. ESP32 listens for clap (5 seconds)
 *    4. If clap → request[room] = 1, LED green
 *    5. If no clap → request[room] = 0, LED red
 *    6. Robot resumes line following
 *
 *  At Pharmacy:
 *    - Buzzer beeps 5 times
 *    - LED shows each room result (green=request, red=no request)
 *
 *  Hardware:
 *    - 2x IR sensors (line following: front left, front right)
 *    - 1x IR sensor (side: room marker detection)
 *    - L298N motor driver
 *    - HC-SR04 ultrasonic sensor
 *    - Buzzer
 *    - RGB LED
 *    - Serial RX from ESP32
 */

// ═══════════════════════════════════════════════════════
//  CALIBRATION VARIABLES — TUNE THESE FIRST!
// ═══════════════════════════════════════════════════════

int baseSpeed      = 150;    // Normal forward speed (80–255). Start low, increase.
int turnSpeed      = 100;    // Speed for turning corrections (60–200)
int slowSpeed      = 90;     // Reduced speed near walls (50–120)

int TURN_DISTANCE  = 15;     // cm — slow down within this distance
int STOP_DISTANCE  = 8;      // cm — stop if obstacle closer than this

int roomExitTime   = 800;    // ms — how long to drive forward after room marker
                              //       to clear the marker. Tune: 600–1200

int clapWaitTime   = 5000;   // ms — how long to listen for clap at each room
int buzzerDuration = 2000;   // ms — buzzer beep duration at room arrival

// ═══════════════════════════════════════════════════════
//  PIN DEFINITIONS
// ═══════════════════════════════════════════════════════

// ── IR Sensors (line following) ──
#define IR_LEFT       A0    // Front left IR sensor
#define IR_RIGHT      A1    // Front right IR sensor
#define IR_SIDE       A2    // Side IR sensor (room marker)

// ── L298N Motor Driver ──
#define ENA           5     // Left motor speed (PWM)
#define IN1           2     // Left motor direction
#define IN2           3     // Left motor direction
#define IN3           4     // Right motor direction
#define IN4           7     // Right motor direction
#define ENB           6     // Right motor speed (PWM)

// ── HC-SR04 Ultrasonic ──
#define TRIG_PIN      8
#define ECHO_PIN      9

// ── Buzzer ──
#define BUZZER_PIN    10

// ── RGB LED ──
#define LED_RED       11
#define LED_GREEN     12
#define LED_BLUE      13

// ═══════════════════════════════════════════════════════
//  GLOBAL VARIABLES
// ═══════════════════════════════════════════════════════

int requests[5] = {0, 0, 0, 0, 0};  // Store clap results per room
int roomCount   = 0;                  // Current room (0–4)
bool patrolDone = false;              // Set true after 5 rooms

// IR sensor readings (HIGH = white surface, LOW = black line)
// Adjust these comments if your sensors are inverted
int irLeftVal, irRightVal, irSideVal;

// ═══════════════════════════════════════════════════════
//  MOTOR CONTROL FUNCTIONS
// ═══════════════════════════════════════════════════════

/*
 * Set individual motor speeds
 * leftSpeed:  0–255, rightSpeed: 0–255
 */
void setMotorSpeed(int leftSpeed, int rightSpeed) {
  analogWrite(ENA, constrain(leftSpeed, 0, 255));
  analogWrite(ENB, constrain(rightSpeed, 0, 255));
}

/*
 * Move forward at given speed
 */
void moveForward(int speed) {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  setMotorSpeed(speed, speed);
}

/*
 * Turn left — reduce left motor, keep right motor
 */
void turnLeft(int speed) {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);
  setMotorSpeed(0, speed);
}

/*
 * Turn right — keep left motor, reduce right motor
 */
void turnRight(int speed) {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  setMotorSpeed(speed, 0);
}

/*
 * Stop both motors immediately
 */
void stopMotors() {
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
  setMotorSpeed(0, 0);
}

// ═══════════════════════════════════════════════════════
//  ULTRASONIC SENSOR
// ═══════════════════════════════════════════════════════

/*
 * Get distance in cm from HC-SR04
 * Returns 999 if no echo (open space)
 */
long getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // 30ms timeout

  if (duration == 0) return 999;  // No echo — clear path

  long distance = duration * 0.034 / 2;
  return distance;
}

// ═══════════════════════════════════════════════════════
//  IR SENSOR READING
// ═══════════════════════════════════════════════════════

/*
 * Read all IR sensors
 * Returns: HIGH (1) = white surface, LOW (0) = black line
 * NOTE: If your sensors are inverted, flip the logic below
 */
void readIRSensors() {
  irLeftVal  = digitalRead(IR_LEFT);
  irRightVal = digitalRead(IR_RIGHT);
  irSideVal  = digitalRead(IR_SIDE);
}

// ═══════════════════════════════════════════════════════
//  LINE FOLLOWING — STRADDLE LOGIC
// ═══════════════════════════════════════════════════════

/*
 * Straddle method: Robot straddles the line
 * Both sensors on white (HIGH) → line is between sensors → go straight
 * Left sensor on black (LOW)  → drifting right → turn left
 * Right sensor on black (LOW) → drifting left  → turn right
 * Both on black               → on a junction/intersection → go straight (slow)
 */
void followLine() {
  readIRSensors();

  // Check for obstacle first
  long dist = getDistance();

  if (dist < STOP_DISTANCE) {
    // ── OBSTACLE DETECTED — Stop and wait ──
    stopMotors();
    while (getDistance() < STOP_DISTANCE) {
      delay(100);  // Wait until clear
    }
    delay(200);  // Small settling delay
    return;
  }

  // Determine speed based on proximity
  int currentSpeed = baseSpeed;
  if (dist < TURN_DISTANCE) {
    currentSpeed = slowSpeed;  // Slow down near walls
  }

  // ── Line following logic ──
  if (irLeftVal == HIGH && irRightVal == HIGH) {
    // Both on white → line is between → go straight
    moveForward(currentSpeed);
  }
  else if (irLeftVal == LOW && irRightVal == HIGH) {
    // Left sees black → robot drifted right → correct left
    turnLeft(turnSpeed);
  }
  else if (irLeftVal == HIGH && irRightVal == LOW) {
    // Right sees black → robot drifted left → correct right
    turnRight(turnSpeed);
  }
  else {
    // Both on black → junction/wide line → go forward slowly
    moveForward(slowSpeed);
  }
}

// ═══════════════════════════════════════════════════════
//  BUZZER FUNCTIONS
// ═══════════════════════════════════════════════════════

void buzzerOn() {
  digitalWrite(BUZZER_PIN, HIGH);
}

void buzzerOff() {
  digitalWrite(BUZZER_PIN, LOW);
}

void buzzerBeep(int duration) {
  buzzerOn();
  delay(duration);
  buzzerOff();
}

void buzzerBeepMultiple(int times, int onDuration, int offDuration) {
  for (int i = 0; i < times; i++) {
    buzzerBeep(onDuration);
    delay(offDuration);
  }
}

// ═══════════════════════════════════════════════════════
//  LED FUNCTIONS
// ═══════════════════════════════════════════════════════

void ledOff() {
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_BLUE, LOW);
}

void ledGreen() {
  ledOff();
  digitalWrite(LED_GREEN, HIGH);
}

void ledRed() {
  ledOff();
  digitalWrite(LED_RED, HIGH);
}

void ledBlue() {
  ledOff();
  digitalWrite(LED_BLUE, HIGH);
}

// ═══════════════════════════════════════════════════════
//  CLAP DETECTION (via ESP32 Serial)
// ═══════════════════════════════════════════════════════

/*
 * Listen for clap signal from ESP32 for specified duration
 * ESP32 sends '1' when clap is detected
 * Returns: true if clap detected, false if timeout
 */
bool listenForClap() {
  // Flush any stale serial data
  while (Serial.available()) {
    Serial.read();
  }

  unsigned long startTime = millis();

  while (millis() - startTime < (unsigned long)clapWaitTime) {
    if (Serial.available()) {
      char received = Serial.read();
      if (received == '1') {
        return true;  // Clap detected!
      }
    }
    delay(10);  // Small delay to prevent tight loop
  }

  return false;  // Timeout — no clap
}

// ═══════════════════════════════════════════════════════
//  ROOM HANDLING
// ═══════════════════════════════════════════════════════

/*
 * Called when side IR sensor detects a room marker
 * Handles the full room interaction sequence
 */
void handleRoom() {
  // ── Step 1: Stop the robot ──
  stopMotors();
  delay(300);  // Settling time

  // ── Step 2: Sound buzzer to announce arrival ──
  buzzerBeep(buzzerDuration);
  delay(300);

  // ── Step 3: Listen for clap from ESP32 ──
  ledBlue();  // Blue LED = listening
  bool clapDetected = listenForClap();

  // ── Step 4: Record result ──
  if (clapDetected) {
    requests[roomCount] = 1;
    ledGreen();   // Green = request registered
    buzzerBeep(200);  // Short confirmation beep
  } else {
    requests[roomCount] = 0;
    ledRed();     // Red = no request
  }

  delay(1000);  // Show LED result for 1 second
  ledOff();

  // ── Step 5: Increment room counter ──
  roomCount++;

  // ── Step 6: Move forward to clear the room marker ──
  moveForward(baseSpeed);
  delay(roomExitTime);
}

// ═══════════════════════════════════════════════════════
//  PHARMACY HANDLING
// ═══════════════════════════════════════════════════════

/*
 * Called after all 5 rooms have been visited
 * Displays results and signals pharmacy
 */
void handlePharmacy() {
  stopMotors();
  delay(500);

  // ── Buzzer alert: 5 beeps ──
  buzzerBeepMultiple(5, 300, 200);
  delay(500);

  // ── Count total requests ──
  int totalRequests = 0;
  for (int i = 0; i < 5; i++) {
    totalRequests += requests[i];
  }

  // ── Display each room result with LED ──
  for (int i = 0; i < 5; i++) {
    if (requests[i] == 1) {
      ledGreen();   // Green = medicine request
      buzzerBeep(100);
    } else {
      ledRed();     // Red = no request
    }
    delay(1500);    // Show each result for 1.5 seconds
    ledOff();
    delay(300);     // Gap between results
  }

  // ── Final summary: Blink green LED for total requests ──
  delay(500);
  for (int i = 0; i < totalRequests; i++) {
    ledGreen();
    buzzerBeep(400);
    delay(400);
    ledOff();
    delay(300);
  }

  // ── Signal completion ──
  ledBlue();
  delay(2000);
  ledOff();

  // ── Debug: Print results to Serial ──
  Serial.println("═══ PATROL COMPLETE ═══");
  for (int i = 0; i < 5; i++) {
    Serial.print("Room ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.println(requests[i] == 1 ? "REQUEST" : "No Request");
  }
  Serial.print("Total Requests: ");
  Serial.println(totalRequests);
  Serial.println("═══════════════════════");

  patrolDone = true;
}

// ═══════════════════════════════════════════════════════
//  SETUP
// ═══════════════════════════════════════════════════════

void setup() {
  // ── Serial communication with ESP32 ──
  Serial.begin(115200);

  // ── IR Sensor pins ──
  pinMode(IR_LEFT, INPUT);
  pinMode(IR_RIGHT, INPUT);
  pinMode(IR_SIDE, INPUT);

  // ── Motor driver pins ──
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);
  pinMode(ENB, OUTPUT);

  // ── Ultrasonic sensor ──
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // ── Buzzer ──
  pinMode(BUZZER_PIN, OUTPUT);
  buzzerOff();

  // ── RGB LED ──
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  ledOff();

  // ── Startup sequence ──
  Serial.println("═══════════════════════════════════════");
  Serial.println("  MedBot — Healthcare Delivery Robot");
  Serial.println("  Arduino UNO Controller");
  Serial.println("═══════════════════════════════════════");
  Serial.print("  Base Speed:     "); Serial.println(baseSpeed);
  Serial.print("  Turn Speed:     "); Serial.println(turnSpeed);
  Serial.print("  Stop Distance:  "); Serial.print(STOP_DISTANCE); Serial.println(" cm");
  Serial.print("  Turn Distance:  "); Serial.print(TURN_DISTANCE); Serial.println(" cm");
  Serial.print("  Room Exit Time: "); Serial.print(roomExitTime); Serial.println(" ms");
  Serial.println("═══════════════════════════════════════");

  // ── Startup indication ──
  ledGreen();
  buzzerBeep(500);
  delay(500);
  ledOff();

  Serial.println("[READY] Starting patrol...");
  delay(1000);
}

// ═══════════════════════════════════════════════════════
//  MAIN LOOP
// ═══════════════════════════════════════════════════════

void loop() {
  // ── Patrol complete? Stop everything. ──
  if (patrolDone) {
    stopMotors();
    delay(5000);
    return;
  }

  // ── Read side IR for room detection ──
  readIRSensors();

  // ── Check for room marker (side IR sees black) ──
  if (irSideVal == LOW && roomCount < 5) {
    handleRoom();

    // After 5 rooms, go to pharmacy
    if (roomCount >= 5) {
      // Follow line until pharmacy (or use a marker)
      // For now: drive forward briefly then handle pharmacy
      moveForward(baseSpeed);
      delay(2000);  // Tune: time to reach pharmacy from room 5
      handlePharmacy();
      return;
    }
  }

  // ── Normal operation: Follow the line ──
  followLine();
}
