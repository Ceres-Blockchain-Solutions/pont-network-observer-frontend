import "../styles/ShipListCards.css";
// import "../styles/ShipMap.css";
//  @ts-ignore
import crypt from "crypto-browserify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";


export default function AllShips() {
  const [shipData, setShipData] = useState<any | null>();
  const navigate = useNavigate();

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
    <div className="ship-list-container">
      <h1>All Ships</h1>
      <div className="ship-card-grid">
      {shipData ? (
        shipData.map((ship: any, index: number) => (
          <div className="ship-card" key={ship.id} onClick={() => navigate(`/ship/${ship.id}`)}>
            <div className="ship-card-header">
              <h2>Ship ID: {ship.id.slice(0, 4)}...{ship.id.slice(-4)}</h2>
            </div>
            <div className="ship-card-image">
              <img
                src={`./public/images/ship${index + 1}.png`} // Assuming ship images are named ship1.png, ship2.png, etc.
                alt={`Ship ${index + 1}`}
                className="ship-image"
              />
            </div>
            <div className="ship-card-footer">
              <button onClick={(e) => {
                e.stopPropagation(); 
                navigate(`/ship/${ship.id}`);
              }}>
                View Details
              </button>
            </div>
          </div>
        ))
      ) : (
        <p>Loading ships...</p>
      )}
      </div>
    </div>
  );
}