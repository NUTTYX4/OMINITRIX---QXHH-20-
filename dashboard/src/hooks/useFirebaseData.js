import { useState, useEffect } from "react";
import { db, ref, onValue } from "../firebase";

// Demo data matching the actual robot system
const DEMO_DATA = {
  robot: {
    position: "room2", // start, room1-5, pharmacy, moving
    isMoving: false,
    totalRequests: 0,
    patrolActive: true,
    currentRound: 1,
  },
  rooms: {
    room1: { request: 0, visited: true, clapDetected: false },
    room2: { request: 1, visited: true, clapDetected: true },
    room3: { request: 0, visited: false, clapDetected: false },
    room4: { request: 0, visited: false, clapDetected: false },
    room5: { request: 0, visited: false, clapDetected: false },
  },
  pharmacy: {
    ledBlinks: 0,
    buzzerActive: false,
    dispensing: false,
  },
};

// Simulates a full robot patrol cycle in demo mode
const DEMO_SEQUENCE = [
  { position: "start", rooms: { room1: { request: 0, visited: false, clapDetected: false }, room2: { request: 0, visited: false, clapDetected: false }, room3: { request: 0, visited: false, clapDetected: false }, room4: { request: 0, visited: false, clapDetected: false }, room5: { request: 0, visited: false, clapDetected: false } }, totalRequests: 0, pharmacy: { ledBlinks: 0, buzzerActive: false, dispensing: false } },
  { position: "moving", label: "→ Room 1" },
  { position: "room1", buzzer: true },
  { position: "room1", rooms: { room1: { request: 1, visited: true, clapDetected: true } }, clap: true },
  { position: "moving", label: "→ Room 2" },
  { position: "room2", buzzer: true },
  { position: "room2", rooms: { room2: { request: 0, visited: true, clapDetected: false } } },
  { position: "moving", label: "→ Room 3" },
  { position: "room3", buzzer: true },
  { position: "room3", rooms: { room3: { request: 1, visited: true, clapDetected: true } }, clap: true },
  { position: "moving", label: "→ Room 4" },
  { position: "room4", buzzer: true },
  { position: "room4", rooms: { room4: { request: 0, visited: true, clapDetected: false } } },
  { position: "moving", label: "→ Room 5" },
  { position: "room5", buzzer: true },
  { position: "room5", rooms: { room5: { request: 1, visited: true, clapDetected: true } }, clap: true },
  { position: "moving", label: "→ Pharmacy" },
  { position: "pharmacy", pharmacy: { ledBlinks: 3, buzzerActive: false, dispensing: true } },
  // Reset after pharmacy
];

export function useFirebaseData() {
  const [data, setData] = useState(DEMO_DATA);
  const [isConnected, setIsConnected] = useState(false);
  const [isDemo, setIsDemo] = useState(true);

  useEffect(() => {
    try {
      const dbRef = ref(db, "/");
      const unsubscribe = onValue(
        dbRef,
        (snapshot) => {
          const val = snapshot.val();
          if (val) {
            setData(val);
            setIsConnected(true);
            setIsDemo(false);
          }
        },
        (error) => {
          console.warn("Firebase not connected, using demo:", error.message);
          setIsConnected(false);
          setIsDemo(true);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firebase not configured, using demo");
      setIsConnected(false);
      setIsDemo(true);
    }
  }, []);

  // Simulate the robot patrol in demo mode
  useEffect(() => {
    if (!isDemo) return;

    let step = 0;
    let accumulatedRooms = {
      room1: { request: 0, visited: false, clapDetected: false },
      room2: { request: 0, visited: false, clapDetected: false },
      room3: { request: 0, visited: false, clapDetected: false },
      room4: { request: 0, visited: false, clapDetected: false },
      room5: { request: 0, visited: false, clapDetected: false },
    };

    const interval = setInterval(() => {
      const seq = DEMO_SEQUENCE[step];
      if (!seq) {
        // Reset
        step = 0;
        accumulatedRooms = {
          room1: { request: 0, visited: false, clapDetected: false },
          room2: { request: 0, visited: false, clapDetected: false },
          room3: { request: 0, visited: false, clapDetected: false },
          room4: { request: 0, visited: false, clapDetected: false },
          room5: { request: 0, visited: false, clapDetected: false },
        };
        return;
      }

      // Merge room updates
      if (seq.rooms) {
        accumulatedRooms = { ...accumulatedRooms, ...seq.rooms };
      }

      const totalRequests = Object.values(accumulatedRooms).filter(r => r.request === 1).length;

      setData((prev) => ({
        robot: {
          position: seq.position,
          isMoving: seq.position === "moving",
          totalRequests,
          patrolActive: true,
          currentRound: prev.robot?.currentRound || 1,
          movingLabel: seq.label || "",
          buzzerActive: seq.buzzer || false,
          clapDetected: seq.clap || false,
        },
        rooms: { ...accumulatedRooms },
        pharmacy: seq.pharmacy || prev.pharmacy || { ledBlinks: 0, buzzerActive: false, dispensing: false },
      }));

      step++;
    }, 2500);

    return () => clearInterval(interval);
  }, [isDemo]);

  return { data, isConnected, isDemo };
}
