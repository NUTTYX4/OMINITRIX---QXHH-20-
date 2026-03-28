import { useState, useEffect } from "react";

export default function Header({ isConnected, isDemo }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <header className="header" id="dashboard-header">
      <div className="header__left">
        <div className="header__icon">🤖</div>
        <div>
          <h1 className="header__title">MedBot Command Center</h1>
          <p className="header__subtitle">Hospital Robot Monitoring Dashboard</p>
        </div>
      </div>

      <div className="header__right">
        <div className="header__status" id="connection-status">
          <span
            className={`status-dot ${
              isDemo
                ? "status-dot--demo"
                : isConnected
                ? "status-dot--online"
                : "status-dot--demo"
            }`}
          ></span>
          {isDemo ? "Demo Mode" : isConnected ? "Live — Connected" : "Offline"}
        </div>
        <div className="header__time" id="dashboard-clock">
          <div>{formatTime(time)}</div>
          <div style={{ fontSize: "0.7rem", opacity: 0.6 }}>{formatDate(time)}</div>
        </div>
      </div>
    </header>
  );
}
