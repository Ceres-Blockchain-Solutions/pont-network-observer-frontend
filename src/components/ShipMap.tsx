import "../styles/ShipList.css";
//  @ts-ignore
import crypt from "crypto-browserify";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export default function ShipMap() {
	return (
		<div className="main-container">
			<div className="combo-box-container">
				<label htmlFor="sailings">Sailing start time:</label>
				<select id="sailings" value={selectedSailingIndex} onChange={handleSailingChange}>
					{timestamps.map((timestamp, index) => (
						<option key={index} value={index}>
							{new Date(timestamp).toLocaleString()}
						</option>
					))}
				</select>
			</div>
			<div>
        <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[51.505, -0.09]}>
            <Popup>
              A pretty CSS3 popup. <br /> Easily customizable.
            </Popup>
          </Marker>
        </MapContainer>
			</div>
		</div>
	);
}