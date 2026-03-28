export default function RoomList({ rooms, robotPosition }) {
  const roomKeys = ["room1", "room2", "room3", "room4", "room5"];

  const getRowClass = (key) => {
    const room = rooms[key] || {};
    if (robotPosition === key) return "room-row room-row--active";
    if (room.visited && room.request === 1) return "room-row room-row--requested";
    if (room.visited) return "room-row room-row--no-request";
    return "room-row room-row--waiting";
  };

  const getStatusBadge = (key) => {
    const room = rooms[key] || {};
    if (robotPosition === key) return { text: "🤖 Robot Here", cls: "active" };
    if (room.visited && room.request === 1) return { text: "👏 Request", cls: "request" };
    if (room.visited) return { text: "No Clap", cls: "no-request" };
    return { text: "Pending", cls: "waiting" };
  };

  const getDetail = (key) => {
    const room = rooms[key] || {};
    if (robotPosition === key) {
      return "Buzzer sounded • Listening for clap...";
    }
    if (room.visited && room.clapDetected) {
      return "Clap detected → Medicine needed";
    }
    if (room.visited) {
      return "No clap detected → No medicine needed";
    }
    return "Waiting for robot visit";
  };

  return (
    <div>
      <h2 className="rooms-section__title">
        <span>📋</span> Room Status
      </h2>
      <div className="rooms-list">
        {roomKeys.map((key, i) => {
          const status = getStatusBadge(key);
          return (
            <div className={getRowClass(key)} key={key} id={`room-row-${key}`}>
              <div className="room-row__icon">
                {robotPosition === key ? "🤖" : rooms[key]?.request === 1 ? "✅" : rooms[key]?.visited ? "⬜" : "🏠"}
              </div>
              <div className="room-row__info">
                <div className="room-row__name">Room {i + 1}</div>
                <div className="room-row__detail">{getDetail(key)}</div>
              </div>
              <span className={`room-row__status room-row__status--${status.cls}`}>
                {status.text}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
