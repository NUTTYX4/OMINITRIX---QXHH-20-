/*
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

void setMotorSpeed(int leftSpeed, int rightSpeed) {
  analogWrite(ENA, constrain(leftSpeed, 0, 255));
  analogWrite(ENB, constrain(rightSpeed, 0, 255));
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
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);  
  if (duration == 0) return 999;  
  return duration * 0.034 / 2;
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

  int currentSpeed = (dist < TURN_DISTANCE) ? slowSpeed : baseSpeed;

  if (irLeftVal == HIGH && irRightVal == HIGH) { moveForward(currentSpeed); }
  else if (irLeftVal == LOW && irRightVal == HIGH) { turnLeft(turnSpeed); }
  else if (irLeftVal == HIGH && irRightVal == LOW) { turnRight(turnSpeed); }
  else { moveForward(slowSpeed); }
}

void buzzerOn() { digitalWrite(BUZZER_PIN, LOW); }
void buzzerOff() { digitalWrite(BUZZER_PIN, HIGH); }
void buzzerBeep(int duration) { buzzerOn(); delay(duration); buzzerOff(); }
void buzzerBeepMultiple(int times, int onDuration, int offDuration) {
  for (int i = 0; i < times; i++) {
    buzzerBeep(onDuration); delay(offDuration);
  }
}

void ledOff() { digitalWrite(LED_RED, LOW); digitalWrite(LED_GREEN, LOW); digitalWrite(LED_BLUE, LOW); }
void ledGreen() { ledOff(); digitalWrite(LED_GREEN, HIGH); }
void ledRed() { ledOff(); digitalWrite(LED_RED, HIGH); }
void ledBlue() { ledOff(); digitalWrite(LED_BLUE, HIGH); }

bool listenForClap() {
  while (Serial.available()) { Serial.read(); }
  unsigned long startTime = millis();
  while (millis() - startTime < (unsigned long)clapWaitTime) {
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
  bool clapDetected = listenForClap();

  if (clapDetected) {
    requests[roomCount] = 1;
    ledGreen(); buzzerBeep(200);  
  } else {
    requests[roomCount] = 0;
    ledRed();     
  }

  delay(1000); ledOff();
  roomCount++;
  moveForward(baseSpeed); delay(roomExitTime);
}

void handlePharmacy() {
  stopMotors(); delay(500);
  buzzerBeepMultiple(5, 300, 200); delay(500);

  int totalRequests = 0;
  for (int i = 0; i < 5; i++) { totalRequests += requests[i]; }

  for (int i = 0; i < 5; i++) {
    if (requests[i] == 1) { ledGreen(); buzzerBeep(100); } 
    else { ledRed(); }
    delay(1500); ledOff(); delay(300);     
  }

  delay(500);
  for (int i = 0; i < totalRequests; i++) {
    ledGreen(); buzzerBeep(400); delay(400);
    ledOff(); delay(300);
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
}
