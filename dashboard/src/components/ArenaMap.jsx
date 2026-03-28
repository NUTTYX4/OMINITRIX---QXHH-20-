export default function ArenaMap({ rooms, robot }) {
  const position = robot.position || "start";
  const roomKeys = ["room1", "room2", "room3", "room4", "room5"];

  const getRoomNodeClass = (key) => {
    const room = rooms[key] || {};
    if (position === key) return "arena-room__node arena-room__node--active";
    if (room.visited && room.request === 1) return "arena-room__node arena-room__node--requested";
    if (room.visited) return "arena-room__node arena-room__node--no-request arena-room__node--visited";
    return "arena-room__node arena-room__node--waiting";
  };

  const getRoomStatus = (key) => {
    const room = rooms[key] || {};
    if (position === key) return { text: "Robot Here", cls: "active" };
    if (room.visited && room.request === 1) return { text: "Request ✓", cls: "request" };
    if (room.visited) return { text: "No Request", cls: "no-request" };
    return { text: "Waiting", cls: "waiting" };
  };

  // Robot position on the map (percentage-based)
  const getMarkerStyle = () => {
    const positions = {
      start: { left: "5%", bottom: "0%", top: "auto" },
      room1: { left: "12%", top: "2%", bottom: "auto" },
      room2: { left: "30%", top: "2%", bottom: "auto" },
      room3: { left: "48%", top: "2%", bottom: "auto" },
      room4: { left: "66%", top: "2%", bottom: "auto" },
      room5: { left: "84%", top: "2%", bottom: "auto" },
      pharmacy: { right: "5%", bottom: "0%", top: "auto", left: "auto" },
      moving: { left: "45%", top: "45%", bottom: "auto" },
    };
    return positions[position] || positions.start;
  };

  return (
    <div className="arena-section">
      <div className="arena-section__title">
        <span>🗺️</span> Arena Map — Live Robot Position
      </div>
      <div className="arena-map" id="arena-map">
        <div className="arena-track">
          <div className="arena-track__path"></div>

          {/* Rooms along the top */}
          <div className="arena-rooms">
            {roomKeys.map((key, i) => {
              const status = getRoomStatus(key);
              const room = rooms[key] || {};
              return (
                <div className="arena-room" key={key}>
                  <div className={getRoomNodeClass(key)}>
                    🏠
                    {room.visited && (
                      <span
                        className={`arena-room__badge arena-room__badge--${
                          room.request === 1 ? "request" : "none"
                        }`}
                      >
                        {room.request === 1 ? "✓" : "—"}
                      </span>
                    )}
                  </div>
                  <span className="arena-room__label">Room {i + 1}</span>
                  <span className={`arena-room__status arena-room__status--${status.cls}`}>
                    {status.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Start and Pharmacy endpoints */}
          <div className="arena-endpoints">
            <div className="arena-endpoint">
              <div
                className={`arena-endpoint__node ${
                  position === "start" ? "arena-endpoint__node--start-active" : ""
                }`}
              >
                🚩
              </div>
              <span className="arena-endpoint__label">Start</span>
            </div>
            <div className="arena-endpoint">
              <div
                className={`arena-endpoint__node ${
                  position === "pharmacy" ? "arena-endpoint__node--pharmacy-active" : ""
                }`}
              >
                💊 ✚
              </div>
              <span className="arena-endpoint__label">Pharmacy</span>
            </div>
          </div>

          {/* Robot marker */}
          <div
            className={`arena-robot ${position === "moving" ? "arena-robot--moving" : ""}`}
            style={getMarkerStyle()}
          >
            <div className="arena-robot__marker">🤖</div>
          </div>
        </div>
      </div>
    </div>
  );
}
