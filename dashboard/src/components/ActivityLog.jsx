import { useState, useEffect, useRef } from "react";

export default function ActivityLog({ robot, rooms }) {
  const [logs, setLogs] = useState([]);
  const prevPositionRef = useRef(robot.position);

  useEffect(() => {
    const prevPos = prevPositionRef.current;
    const curPos = robot.position;

    if (prevPos === curPos) return;
    prevPositionRef.current = curPos;

    const now = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    let newLog = null;

    if (curPos === "moving") {
      newLog = { icon: "🚗", text: `Robot moving ${robot.movingLabel || ""}`, time: now };
    } else if (curPos === "start") {
      newLog = { icon: "🚩", text: "Robot at START position", time: now };
    } else if (curPos === "pharmacy") {
      const blinks = Object.values(rooms).filter((r) => r.request === 1).length;
      newLog = { icon: "💊", text: `Pharmacy reached — LED blinks: ${blinks}`, time: now };
    } else if (curPos.startsWith("room")) {
      const roomNum = curPos.replace("room", "");
      if (robot.buzzerActive) {
        newLog = { icon: "🔔", text: `Buzzer at Room ${roomNum}`, time: now };
      } else if (robot.clapDetected) {
        newLog = { icon: "👏", text: `Clap detected in Room ${roomNum} — Request!`, time: now };
      } else {
        const room = rooms[curPos];
        if (room && room.visited && !room.clapDetected) {
          newLog = { icon: "✋", text: `No clap in Room ${roomNum} — No request`, time: now };
        } else {
          newLog = { icon: "📍", text: `Robot arrived at Room ${roomNum}`, time: now };
        }
      }
    }

    if (newLog) {
      setLogs((prev) => [{ ...newLog, id: Date.now() }, ...prev].slice(0, 15));
    }
  }, [robot.position, robot.buzzerActive, robot.clapDetected, rooms]);

  return (
    <div className="log-card" id="activity-log">
      <div className="log-card__title">
        <span>📜</span> Activity Log
      </div>
      <div className="log-list">
        {logs.length === 0 ? (
          <div className="log-item">
            <span className="log-item__icon">⏳</span>
            <span className="log-item__text">Waiting for robot activity...</span>
          </div>
        ) : (
          logs.map((log) => (
            <div className="log-item" key={log.id}>
              <span className="log-item__icon">{log.icon}</span>
              <span className="log-item__text">{log.text}</span>
              <span className="log-item__time">{log.time}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
