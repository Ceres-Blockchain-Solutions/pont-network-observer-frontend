import "../styles/ShipList.css";
import "../styles/ShipMap.css";
//  @ts-ignore
import crypt from "crypto-browserify";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import { FaLocationArrow } from "react-icons/fa";
import ReactDOMServer from "react-dom/server";



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
    "44444444444444444444444444444444444": "yellow",
    "55555555555555555555555555555555555": "orange",
    "66666666666666666666666666666666666": "purple",
    "77777777777777777777777777777777777": "pink",
    "88888888888888888888888888888888888": "cyan",
    "99999999999999999999999999999999999": "brown",
    "10101010101010101010101010101010101": "magenta",
    "11111111111111111111111111111111112": "lime",
    "12121212121212121212121212121212121": "teal",
    "13131313131313131313131313131313131": "olive",
    "14141414141414141414141414141414141": "navy",
    "15151515151515151515151515151515151": "maroon",
    "16161616161616161616161616161616161": "aqua",
    "17171717171717171717171717171717171": "silver",
    "18181818181818181818181818181818181": "gold",
    "19191919191919191919191919191919191": "black",
    "20202020202020202020202020202020202": "white",
  };

  const rotationMap: { [id: string]: number } = {
    "11111111111111111111111111111111111": 45,
    "22222222222222222222222222222222222": 120,
    "33333333333333333333333333333333333": 210,
    "44444444444444444444444444444444444": 330,
    "55555555555555555555555555555555555": 60,
    "66666666666666666666666666666666666": 15,
    "77777777777777777777777777777777777": 300,
    "88888888888888888888888888888888888": 240,
    "99999999999999999999999999999999999": 90,
    "10101010101010101010101010101010101": 135,
    "12121212121212121212121212121212121": 180,
    "13131313131313131313131313131313131": 225,
    "14141414141414141414141414141414141": 270,
    "15151515151515151515151515151515151": 315,
    "16161616161616161616161616161616161": 10,
    "17171717171717171717171717171717171": 50,
    "18181818181818181818181818181818181": 100,
    "19191919191919191919191919191919191": 250,
    "20202020202020202020202020202020202": 290,
    "21212121212121212121212121212121212": 340,
  };

  const getCustomIcon = (id: string) => {
    const color = shipColors[id] || "black";
  
    // If rotation for this ID doesn't exist, generate and store it
    if (!rotationMap[id]) {
      rotationMap[id] = Math.floor(Math.random() * 360);
    }
    const rotation = rotationMap[id];
  
    const iconHtml = ReactDOMServer.renderToString(
      <FaLocationArrow
        style={{
          color: color,
          fontSize: "16px",
          transform: `rotate(${rotation}deg)`,
        }}
      />
    );
  
    return L.divIcon({
      className: "custom-marker",
      html: iconHtml,
      iconSize: [12, 12],
      iconAnchor: [12, 12], // Centers the icon
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
