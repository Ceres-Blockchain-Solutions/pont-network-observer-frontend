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

  // const positions = [
  // 	{ id: 1, name: "Ship Alpha", lat: 60, lng: 30 },
  // 	{ id: 2, name: "Ship Beta", lat: 40, lng: -20 },
  // 	{ id: 3, name: "Ship Gamma", lat: -10, lng: 50 },
  // 	{ id: 4, name: "Ship Delta", lat: -25, lng: 15 },
  // ];

  const bounds = L.latLngBounds(
    [-90, -180], // Southwest corner (min lat, min lng)
    [90, 180] // Northeast corner (max lat, max lng)
  );

	// Custom icon with your desired shape/image
	const customIcon = L.icon({
		iconUrl: "/arrow.png", // Replace with your custom image URL
		iconSize: [25, 25], // Size of the icon
		iconAnchor: [12.5, 12.5], // Anchor point of the icon (centered in this case)
		popupAnchor: [0, -12.5], // Position of the popup relative to the icon
	});

  async function fetchData() {
    // Fetch data from the backend with axios
    await axios
      .get("http://localhost:3000/ship/get-all-ships-decrypted", {})
      .then((response) => {
				const latest = response.data.length > 0 ? response.data[response.data.length - 1] : null;
				console.log(latest, "latest");
        setShipData(latest);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 5000); // Fetch every 5 seconds
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
        {/* {shipData &&
          shipData?.map((item: any) => (
            <Marker key={item.id} position={[item.gps.lat, item.gps.long]} icon={customIcon}>
              <Popup>
                <div style={{ textAlign: "center" }}>
                  <strong>{item.id}</strong>
                  <br />
                  Coordinates: {item.gps.lat}, {item.gps.long}
                  <br />
                  <button
                    onClick={() => navigate(`/view-data`)}
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
          ))} */}

				{shipData && (
          <Marker
            key={shipData.id}
            position={[shipData.gps.lat, shipData.gps.long]}
            icon={customIcon}
          >
            <Popup>
              <div style={{ textAlign: "center" }}>
                <strong>{shipData.id}</strong>
                <br />
                Coordinates: {shipData.gps.lat}, {shipData.gps.long}
                <br />
                <button
                  onClick={() => navigate(`/view-data`)}
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
        )}
      </MapContainer>
    </div>
  );
}
