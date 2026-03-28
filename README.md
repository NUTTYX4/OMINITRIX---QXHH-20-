# OMINITRIX---QXHH-20-
NEW HORIZON HARDWARE HACKATHON 
Smart Hospital Request & Alert System

* Problem Statement:
  In many hospitals, communication between patient rooms and staff is inefficient, leading to
  delays  in response and poor prioritization of requests.

 * Proposed Solution

   This project presents a Smart Hospital Request System that:

   Detects patient/service requests using a switch
   Validates requests using motion detection (PIR sensor)
   Uses a line-following robot to visually represent workflow
   Alerts staff using buzzer and LED indicators.

  * System Architecture
   Input Layer:
   Switch (request trigger)
   PIR sensor (presence validation)
   IR sensors (line tracking)
   Ultrasonic sensor (obstacle detection)
   Processing Layer:
   Arduino UNO (central controller)
   Output Layer:
   L298N Motor Driver + DC Motors (robot movement)
   Buzzer (alert system)
   LED (status indication)

 * Working Principle
   Request Detection
   User presses switch
   PIR sensor confirms presence
   Valid request is generated
   Robot Navigation
   Robot follows predefined path using IR sensors
   Ultrasonic sensor prevents collision
   Data Processing
   Arduino counts valid requests
   Stores and processes request logic
   Alert System
   Buzzer beeps based on number of requests
   LED indicates system status

 * Features
   Request validation using motion detection
   Automated guided workflow visualization
   Real-time alert system using buzzer patterns
   Low-cost and easy-to-implement design

  * Components Used
   Arduino UNO
   IR Sensors (Line Following)
   L298N Motor Driver
   DC Motors (4)
   PIR Motion Sensor
   Ultrasonic Sensor (HC-SR04)
   Buzzer
   LED
   Switch
   3.7V Batteries (2x)

 * Expected Output
   Accurate detection of valid requests
   Smooth robot navigation along predefined path
   Real-time alert using buzzer and LED
   Improved efficiency in request handling

* Future Improvements
  Integration with IoT dashboard
  Mobile app notifications
  Multi-room scalable system
  AI-based prioritization

 * Conclusion

  This system demonstrates how simple embedded systems combined with basic automation can          significantly improve hospital communication efficiency and response time
