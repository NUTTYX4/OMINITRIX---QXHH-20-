export default function WiringTab() {
  const esp32Wiring = [
    { from: "WS", to: "GPIO 25", color: "#3b82f6" },
    { from: "SCK", to: "GPIO 26", color: "#8b5cf6" },
    { from: "SD", to: "GPIO 27", color: "#10b981" },
    { from: "L/R", to: "GND", color: "#64748b" },
    { from: "VDD", to: "3.3V", color: "#ef4444" },
    { from: "GND", to: "GND", color: "#1e293b" },
  ];

  const arduinoSections = [
    {
      title: "IR Sensors",
      icon: "🔴",
      pins: [
        { from: "IR Left", to: "D12", purpose: "Line following (left)" },
        { from: "IR Right", to: "D13", purpose: "Line following (right)" },
        { from: "IR Side", to: "D8", purpose: "Room marker detection" },
      ],
    },
    {
      title: "L298N Motor Driver",
      icon: "⚡",
      pins: [
        { from: "ENA", to: "D9 (PWM)", purpose: "Left motor speed" },
        { from: "IN1", to: "D4", purpose: "Left motor dir" },
        { from: "IN2", to: "D5", purpose: "Left motor dir" },
        { from: "IN3", to: "D6", purpose: "Right motor dir" },
        { from: "IN4", to: "D7", purpose: "Right motor dir" },
        { from: "ENB", to: "D10 (PWM)", purpose: "Right motor speed" },
      ],
    },
    {
      title: "HC-SR04 Ultrasonic",
      icon: "📏",
      pins: [
        { from: "Trig", to: "A0", purpose: "Trigger pulse" },
        { from: "Echo", to: "A1", purpose: "Echo return" },
        { from: "VCC", to: "5V", purpose: "Power" },
        { from: "GND", to: "GND", purpose: "Ground" },
      ],
    },
    {
      title: "Buzzer & LED",
      icon: "🔔",
      pins: [
        { from: "Buzzer +", to: "D2", purpose: "Room alert (active-LOW)" },
        { from: "LED Red", to: "A2", purpose: "No request indicator" },
        { from: "LED Green", to: "A3", purpose: "Request indicator" },
        { from: "LED Blue", to: "A4", purpose: "Listening indicator" },
      ],
    },
  ];

  const communication = [
    { from: "ESP32 TX", to: "Arduino RX (D0)", purpose: "Clap signal ('1')", baud: "115200" },
  ];

  return (
    <div className="wiring-tab">
      {/* Communication Link */}
      <div className="wiring-section wiring-section--highlight">
        <h3 className="wiring-section__title">
          <span>🔗</span> ESP32 ↔ Arduino Communication
        </h3>
        <div className="comm-card">
          <div className="comm-flow">
            <div className="comm-node comm-node--esp32">
              <span className="comm-node__icon">📡</span>
              <span className="comm-node__label">ESP32</span>
              <span className="comm-node__pin">TX</span>
            </div>
            <div className="comm-arrow">
              <div className="comm-arrow__line"></div>
              <div className="comm-arrow__label">Serial '1' @ 115200 baud</div>
            </div>
            <div className="comm-node comm-node--arduino">
              <span className="comm-node__icon">🤖</span>
              <span className="comm-node__label">Arduino</span>
              <span className="comm-node__pin">RX (D0)</span>
            </div>
          </div>
          <p className="comm-note">
            ⚠️ Disconnect Arduino RX when uploading code via USB
          </p>
        </div>
      </div>

      <div className="wiring-grid">
        {/* ESP32 + INMP441 */}
        <div className="wiring-section">
          <h3 className="wiring-section__title">
            <span>📡</span> ESP32 + INMP441 Microphone
          </h3>
          <div className="wiring-table">
            <div className="wiring-table__head">
              <span>INMP441 Pin</span>
              <span>ESP32 Pin</span>
            </div>
            {esp32Wiring.map((w, i) => (
              <div className="wiring-table__row" key={i}>
                <span className="wiring-table__pin">{w.from}</span>
                <span className="wiring-wire" style={{ background: w.color }}></span>
                <span className="wiring-table__pin wiring-table__pin--target">{w.to}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Arduino sections */}
        {arduinoSections.map((section) => (
          <div className="wiring-section" key={section.title}>
            <h3 className="wiring-section__title">
              <span>{section.icon}</span> {section.title}
            </h3>
            <div className="wiring-table">
              <div className="wiring-table__head wiring-table__head--3col">
                <span>Component</span>
                <span>Arduino Pin</span>
                <span>Purpose</span>
              </div>
              {section.pins.map((p, i) => (
                <div className="wiring-table__row wiring-table__row--3col" key={i}>
                  <span className="wiring-table__pin">{p.from}</span>
                  <span className="wiring-table__pin wiring-table__pin--target">{p.to}</span>
                  <span className="wiring-table__purpose">{p.purpose}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Calibration Cheat Sheet */}
      <div className="wiring-section">
        <h3 className="wiring-section__title">
          <span>🎛️</span> Calibration Cheat Sheet
        </h3>
        <div className="cal-grid">
          {[
            { var: "baseSpeed", val: "150", range: "80–255", desc: "Start low, increase until it moves smoothly" },
            { var: "turnSpeed", val: "100", range: "60–200", desc: "Too fast = overshoot, too slow = sluggish" },
            { var: "STOP_DISTANCE", val: "8 cm", range: "5–12 cm", desc: "Obstacle stop threshold" },
            { var: "roomExitTime", val: "800 ms", range: "600–1200 ms", desc: "Must clear the room marker" },
            { var: "CLAP_THRESHOLD", val: "2500", range: "1500–5000", desc: "Lower = more sensitive mic" },
          ].map((c) => (
            <div className="cal-card" key={c.var}>
              <code className="cal-card__var">{c.var}</code>
              <div className="cal-card__val">{c.val}</div>
              <div className="cal-card__range">{c.range}</div>
              <p className="cal-card__desc">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
