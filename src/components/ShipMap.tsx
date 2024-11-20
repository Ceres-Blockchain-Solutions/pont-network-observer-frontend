import "../styles/ShipList.css";
import "../styles/ShipMap.css";
//  @ts-ignore
import crypt from "crypto-browserify";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";

export default function ShipMap() {
	return (
			<div className="map-container">
        <MapContainer style={ {width: "100%", height: "100%"}} center={[0, 0]} zoom={3} scrollWheelZoom={true}>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>
					<Marker position={[60, 30]}>
						<Popup>
							A pretty CSS3 popup. <br /> Easily customizable.
						</Popup>
					</Marker>
				</MapContainer>
			</div>
	);
}