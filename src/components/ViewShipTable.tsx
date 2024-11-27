import { useEffect, useState } from "react";
import "../styles/ShipList.css";
import { useLocation, useParams } from "react-router-dom";
//  @ts-ignore
import crypt from "crypto-browserify";
import axios from "axios";

export default function ViewShipTable() {
	const location = useLocation();
	const {id} = useParams();

  const [shipData, setShipData] = useState<any | null>();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [shipsPerPage] = useState<number>(16); // 16 ships per page
  const [totalShips, setTotalShips] = useState<number>(0); // Total number of ships


  async function fetchData() {
    try {
      const response = await axios.get("http://localhost:3000/ship/get-all-ships-decrypted");
      const latestShipData = response.data.filter((ship: any) => ship.id === id);

      setTotalShips(latestShipData.length); // Set total number of ships for pagination
      setShipData(latestShipData.slice((currentPage - 1) * shipsPerPage, currentPage * shipsPerPage));
    } catch (error) {
      console.error("Error fetching ship data:", error);
    }
  }

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 5 * 1000); // Fetch every 5 seconds
    return () => clearInterval(interval); // Cleanup on unmount
  }, [id, currentPage]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Calculate total number of pages
  const totalPages = Math.ceil(totalShips / shipsPerPage);

	return (
		<div className="main-container">
			<div className="table-container table-container-lg">
				{shipData && (
          <>
					<table className="styled-table">
						<thead>
							<tr>
								<th>Latitude</th>
								<th>Longitude</th>
								<th>Mileage</th>
								<th>Engine Load</th>
								<th>Fuel Level</th>
								<th>Sea State</th>
								<th>Sea Surface Temperature</th>
								<th>Air Temperature</th>
								<th>Humidity</th>
								<th>Barometric Pressure</th>
								<th>Cargo Status</th>
								<th>Time</th>
							</tr>
						</thead>
						<tbody>
                  {shipData?.map((ship: any, i:number)=> (<tr key={i}>
                      <td>{ship?.gps.lat.toFixed(2)}</td>
                      <td>{ship?.gps.long.toFixed(2)}</td>
                      <td>{ship?.mil.toFixed(2)}</td>
                      <td>{ship?.eng.toFixed(2)}</td>
                      <td>{ship?.fuel.toFixed(2)}</td>
                      <td>{ship?.sea}</td>
                      <td>{ship?.sst.toFixed(2)}</td>
                      <td>{ship?.air.toFixed(2)}</td>
                      <td>{ship?.hum.toFixed(2)}</td>
                      <td>{ship?.bar.toFixed(2)}</td>
                      <td>{ship?.cargo}</td>
                      <td>{new Date(ship?.time).toLocaleString()}</td>
                  </tr>))}
            </tbody>
					</table>
          <div className="pagination">
          <br />
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
				</>
        )}
			</div>
		</div>
	);
}