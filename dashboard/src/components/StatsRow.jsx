export default function StatsRow({ rooms, robot, pharmacy }) {
  const roomList = Object.values(rooms || {});
  const totalRooms = roomList.length || 5;
  const visited = roomList.filter((r) => r.visited).length;
  const requests = roomList.filter((r) => r.request === 1).length;
  const remaining = totalRooms - visited;

  return (
    <div className="stats-row" id="stats-overview">
      <div className="stat-card">
        <div className="stat-card__header">
          <span className="stat-card__label">Rooms Visited</span>
          <span className="stat-card__icon">🏠</span>
        </div>
        <div className="stat-card__value stat-card__value--blue">
          {visited}/{totalRooms}
        </div>
        <div className="stat-card__sub">{remaining > 0 ? `${remaining} remaining` : "All visited"}</div>
        <div className="stat-card__glow stat-card__glow--blue"></div>
      </div>

      <div className="stat-card">
        <div className="stat-card__header">
          <span className="stat-card__label">Medicine Requests</span>
          <span className="stat-card__icon">💊</span>
        </div>
        <div className="stat-card__value stat-card__value--green">{requests}</div>
        <div className="stat-card__sub">Claps detected</div>
        <div className="stat-card__glow stat-card__glow--green"></div>
      </div>

      <div className="stat-card">
        <div className="stat-card__header">
          <span className="stat-card__label">No Request</span>
          <span className="stat-card__icon">✋</span>
        </div>
        <div className="stat-card__value stat-card__value--yellow">
          {visited - requests}
        </div>
        <div className="stat-card__sub">No clap detected</div>
        <div className="stat-card__glow stat-card__glow--yellow"></div>
      </div>

      <div className="stat-card">
        <div className="stat-card__header">
          <span className="stat-card__label">LED Blinks</span>
          <span className="stat-card__icon">💡</span>
        </div>
        <div className="stat-card__value stat-card__value--cyan">
          {pharmacy.ledBlinks || 0}
        </div>
        <div className="stat-card__sub">At pharmacy</div>
        <div className="stat-card__glow stat-card__glow--cyan"></div>
      </div>
    </div>
  );
}
