export default function RobotBanner({ robot }) {
  const position = robot.position || "start";
  const isMoving = position === "moving";
  const isBuzzer = robot.buzzerActive;
  const isClap = robot.clapDetected;

  const getPositionLabel = () => {
    if (isMoving) return robot.movingLabel || "Moving...";
    if (position === "start") return "At Start Position";
    if (position === "pharmacy") return "At Pharmacy 🏥";
    return `At ${position.replace("room", "Room ")}`;
  };

  const getDetail = () => {
    if (isMoving) return "Robot is moving to next stop...";
    if (isBuzzer) return "🔊 Buzzer sounding — Announcing arrival";
    if (isClap) return "👏 Clap detected! — Request recorded";
    if (position === "start") return "Ready to begin patrol";
    if (position === "pharmacy") return "Dispensing — LED blinking for requests";
    return "Listening for clap sound...";
  };

  const bannerClass = [
    "robot-banner",
    isMoving && "robot-banner--moving",
    isBuzzer && "robot-banner--buzzer",
    isClap && "robot-banner--clap",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={bannerClass} id="robot-banner">
      <div className="robot-banner__icon">
        {isMoving ? "🚗" : isBuzzer ? "🔔" : isClap ? "👏" : position === "pharmacy" ? "💊" : "🤖"}
      </div>
      <div className="robot-banner__info">
        <div className="robot-banner__position">{getPositionLabel()}</div>
        <div className="robot-banner__detail">{getDetail()}</div>
      </div>
      <div className="robot-banner__requests">
        <div className="robot-banner__requests-label">Total Requests</div>
        <div className="robot-banner__requests-value">{robot.totalRequests || 0}</div>
      </div>
    </div>
  );
}
