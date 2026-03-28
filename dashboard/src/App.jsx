import { useState } from "react";
import "./index.css";
import { useFirebaseData } from "./hooks/useFirebaseData";
import Header from "./components/Header";
import RobotBanner from "./components/RobotBanner";
import StatsRow from "./components/StatsRow";
import ArenaMap from "./components/ArenaMap";
import RoomList from "./components/RoomList";
import PharmacyCard from "./components/PharmacyCard";
import ActivityLog from "./components/ActivityLog";
import FirmwareTab from "./components/FirmwareTab";
import WiringTab from "./components/WiringTab";

function App() {
  const { data, isConnected, isDemo } = useFirebaseData();
  const [activeTab, setActiveTab] = useState("dashboard");

  const robot = data.robot || {};
  const rooms = data.rooms || {};
  const pharmacy = data.pharmacy || {};

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "firmware", label: "Firmware", icon: "💻" },
    { id: "wiring", label: "Wiring", icon: "🔌" },
  ];

  return (
    <div className="dashboard" id="dashboard-root">
      {isDemo && (
        <div className="demo-banner" id="demo-banner">
          ✨ Demo Mode — <span>Connect Firebase & ESP32 for live data</span>
        </div>
      )}

      <Header isConnected={isConnected} isDemo={isDemo} />

      {/* Tab Navigation */}
      <nav className="tab-nav" id="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? "tab-btn--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
            id={`tab-${tab.id}`}
          >
            <span className="tab-btn__icon">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Dashboard Tab */}
      {activeTab === "dashboard" && (
        <div className="tab-content" id="tab-content-dashboard">
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
      )}

      {/* Firmware Tab */}
      {activeTab === "firmware" && (
        <div className="tab-content" id="tab-content-firmware">
          <FirmwareTab />
        </div>
      )}

      {/* Wiring Tab */}
      {activeTab === "wiring" && (
        <div className="tab-content" id="tab-content-wiring">
          <WiringTab />
        </div>
      )}
    </div>
  );
}

export default App;
