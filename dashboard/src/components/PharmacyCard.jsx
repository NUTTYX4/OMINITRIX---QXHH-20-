export default function PharmacyCard({ pharmacy, robot, rooms }) {
  const ledBlinks = pharmacy.ledBlinks || 0;
  const isActive = robot.position === "pharmacy";
  const totalRequests = Object.values(rooms || {}).filter((r) => r.request === 1).length;

  // Create 5 LED dots - light up the ones matching request count
  const leds = Array.from({ length: 5 }, (_, i) => i < ledBlinks);

  return (
    <div className={`pharmacy-card ${isActive ? "pharmacy-card--active" : ""}`} id="pharmacy-card">
      <div className="pharmacy-card__title">
        <span>🏥</span> Pharmacy Station
      </div>

      <div className="pharmacy-card__led">
        {leds.map((on, i) => (
          <div
            key={i}
            className={`led-dot ${on ? "led-dot--on" : "led-dot--off"}`}
            style={on ? { animationDelay: `${i * 0.2}s` } : {}}
          ></div>
        ))}
      </div>

      <div className="pharmacy-card__count">
        <div className="pharmacy-card__count-value">{ledBlinks}</div>
        <div className="pharmacy-card__count-label">LED Blinks (Requests)</div>
      </div>

      <div className="pharmacy-card__status">
        {isActive
          ? `🟢 Robot at pharmacy — LED blinking ${ledBlinks} time${ledBlinks !== 1 ? "s" : ""}`
          : robot.position === "start"
          ? "⏳ Waiting for robot patrol to start"
          : `🤖 Robot patrolling — ${totalRequests} request${totalRequests !== 1 ? "s" : ""} so far`}
      </div>
    </div>
  );
}
