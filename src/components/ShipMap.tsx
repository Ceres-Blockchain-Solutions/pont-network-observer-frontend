import "../styles/ShipList.css";
import "../styles/ShipMap.css";
//  @ts-ignore
import crypt from "crypto-browserify";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";

export default function ShipMap() {
  const [shipData, setShipData] = useState<any | null>();
  const navigate = useNavigate();

  const bounds = L.latLngBounds(
    [-90, -180], // Southwest corner (min lat, min lng)
    [90, 180] // Northeast corner (max lat, max lng)
  );

	// // Custom icon with your desired shape/image
	// const customIcon = L.icon({
	// 	iconUrl: "/arrow.png", // Replace with your custom image URL
	// 	iconSize: [25, 25], // Size of the icon
	// 	iconAnchor: [12.5, 12.5], // Anchor point of the icon (centered in this case)
	// 	popupAnchor: [0, -12.5], // Position of the popup relative to the icon

	// });

  const shipColors: { [id: string]: string } = {
    "11111111111111111111111111111111111": "red",
    "22222222222222222222222222222222222": "blue",
    "33333333333333333333333333333333333": "green",
  };

    // Create a dynamic icon based on ship ID
    
  const getCustomIcon = (id: string) => {
    const color = shipColors[id] || "black";
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="background-color:${color}; width: 20px; height: 20px; border-radius: 50%;"></div>`,
      iconSize: [5, 5],
      iconAnchor: [10, 10],
    });
  };

  async function fetchData() {
    try {
      const response = await axios.get("http://localhost:3000/ship/get-all-ships-decrypted");
      const latestShipData = response.data.reduce((uniqueShips: any[], ship: any) => {
        // Ensure only the latest data for each ship ID is included
        const existingIndex = uniqueShips.findIndex((s: any) => s.id === ship.id);
        if (existingIndex >= 0) {
          uniqueShips[existingIndex] = ship; // Update existing entry
        } else {
          uniqueShips.push(ship); // Add new entry
        }
        return uniqueShips;
      }, []);
      setShipData(latestShipData);
    } catch (error) {
      console.error("Error fetching ship data:", error);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 1000); // Fetch every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="map-container">
      <MapContainer
        style={{ width: "100%", height: "100%" }}
        center={[20, 0]}
        zoom={3}
        minZoom={2}
        maxZoom={10}
        scrollWheelZoom={true}
        worldCopyJump={true}
        maxBounds={bounds}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {shipData &&
          shipData.map((ship: any) => (
            <Marker
              key={ship.id} // Ensure each marker has a unique key based on ship ID
              position={[ship.gps.lat, ship.gps.long]}
              // icon={customIcon}
              icon={getCustomIcon(ship.id)}
            >
              <Popup>
                <div style={{ textAlign: "center" }}>
                <strong>
                  {ship.id.length > 10
                    ? `${ship.id.slice(0, 4)}...${ship.id.slice(-4)}`
                    : ship.id}
                </strong>
                  <br />
                  Coordinates: {ship.gps.lat.toFixed(2)}, {ship.gps.long.toFixed(2)}
                  <br />
                  <button
                    onClick={() => navigate(`/view-ship-table/${ship.id}`)} // Pass the ship ID to the info page
                    style={{
                      padding: "5px 10px",
                      backgroundColor: "#6dbddc",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    View Info
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
