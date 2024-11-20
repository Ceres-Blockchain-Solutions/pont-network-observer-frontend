import "../styles/ShipList.css";
import "../styles/ShipMap.css";
//  @ts-ignore
import crypt from "crypto-browserify";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

export default function ShipMap() {
	const positions = [
		{ id: 1, name: "Ship Alpha", lat: 60, lng: 30 },
		{ id: 2, name: "Ship Beta", lat: 40, lng: -20 },
		{ id: 3, name: "Ship Gamma", lat: -10, lng: 50 },
		{ id: 4, name: "Ship Delta", lat: -25, lng: 15 },
	];

	const bounds = L.latLngBounds(
		[-90, -180], // Southwest corner (min lat, min lng)
		[90, 180]    // Northeast corner (max lat, max lng)
	);

	return (
			<div className="map-container">
        <MapContainer 
					style={ {width: "100%", height: "100%"}} 
					center={[0, 0]} 
					zoom={3} 
					minZoom={3} 
					maxZoom={10} 
					scrollWheelZoom={true} 
					// worldCopyJump={true}
					maxBounds={bounds}
        	maxBoundsViscosity={1.0}
					>
					<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>
					{positions.map((position) => (
					<Marker key={position.id} position={[position.lat, position.lng]}>
						<Popup>
							<strong>{position.name}</strong>
							<br />
							Coordinates: {position.lat}, {position.lng}
						</Popup>
					</Marker>
					))}
				</MapContainer>
			</div>
	);
}