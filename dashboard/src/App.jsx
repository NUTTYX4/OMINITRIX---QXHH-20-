import "./index.css";
import { useFirebaseData } from "./hooks/useFirebaseData";
import Header from "./components/Header";
import RobotBanner from "./components/RobotBanner";
import StatsRow from "./components/StatsRow";
import ArenaMap from "./components/ArenaMap";
import RoomList from "./components/RoomList";
import PharmacyCard from "./components/PharmacyCard";
import ActivityLog from "./components/ActivityLog";

function App() {
  const { data, isConnected, isDemo } = useFirebaseData();

  const robot = data.robot || {};
  const rooms = data.rooms || {};
  const pharmacy = data.pharmacy || {};

  return (
    <div className="dashboard" id="dashboard-root">
      {isDemo && (
        <div className="demo-banner" id="demo-banner">
          ✨ Demo Mode — <span>Connect Firebase & ESP32 for live data</span>
        </div>
      )}

      <Header isConnected={isConnected} isDemo={isDemo} />

      <RobotBanner robot={robot} />

      <StatsRow rooms={rooms} robot={robot} pharmacy={pharmacy} />

      <ArenaMap rooms={rooms} robot={robot} />

      <div className="main-grid">
        <div>
          <RoomList rooms={rooms} robotPosition={robot.position} />
        </div>
        <div className="sidebar">
          <PharmacyCard pharmacy={pharmacy} robot={robot} rooms={rooms} />
          <ActivityLog robot={robot} rooms={rooms} />
        </div>
      </div>
    </div>
  );
}

export default App;
