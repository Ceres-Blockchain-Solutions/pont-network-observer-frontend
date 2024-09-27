import { useEffect, useState } from "react";
import "../styles/ShipList.css";
import { useLocation } from "react-router-dom";
//  @ts-ignore
import crypt from "crypto-browserify";
import { Buffer } from "buffer";
import { blake3 } from "hash-wasm";
import { Address } from "@coral-xyz/anchor";
import { program } from "../anchor/setup";

interface SensorData {
	lat: number;
	long: number;
	mileage: number;
	engineLoad: number;
	fuelLevel: number;
	seaState: string;
	seaSurfaceTemperature: number;
	airTemp: number;
	humidity: number;
	barometricPressure: number;
	cargoStatus: string;
	time: number;
}

interface DataItem {
	event: string;
	ship: string;
	fingerprint: string;
	ciphertext: string;
	tag: string;
	iv: string;
	data_account: string;
	ciphertext_timestamp_unix: number;
	ciphertext_timestamp_date: {
		$date: string;
	};
}

// Decrypt data AES-256-GCM
export const decrypt = (
	ciphertext: string,
	tag: string,
	iv: string,
	key: crypt.CipherKey
) => {
	const decipher = crypt.createDecipheriv(
		"aes-256-gcm",
		key,
		Buffer.from(iv, "hex")
	);
	decipher.setAuthTag(Buffer.from(tag, "hex")); // Set the authentication tag
	let decrypted = decipher.update(ciphertext, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
};

export default function ViewData() {
	const location = useLocation();
	const [encryptedData, setEncryptedData] = useState<DataItem[]>([]);
	const [decryptedData, setDecryptedData] = useState<SensorData[]>([]);
	const { ship, masterKeyDecrypted, dataAccountAddreses, dataAccountTimestamps } = location.state as {
		ship: string;
		masterKeyDecrypted: Uint8Array;
		dataAccountAddreses: string[];
		dataAccountTimestamps: number[];
	};
	const [timestamps, setTimestamps] = useState<number[]>(dataAccountTimestamps);
	const [selectedSailingIndex, setSelectedSailingIndex] = useState<number>(dataAccountTimestamps.length - 1);
	const [differences, setDifferences] = useState<boolean[]>([]);
    const [blockchainFingerprints, setBlockchainFingerprints] = useState<string[]>([]);

	// MOCK
	// const [decryptedData, setDecryptedData] = useState<SensorData[]>([
	//   {
	//     lat: 37.7749,
	//     long: -122.4194,
	//     mileage: 1200,
	//     engineLoad: 75,
	//     fuelLevel: 50,
	//     seaState: "Calm",
	//     seaSurfaceTemperature: 15,
	//     airTemp: 20,
	//     humidity: 60,
	//     barometricPressure: 1013,
	//     cargoStatus: "Loaded",
	//     time: Date.now(),
	//   },
	//   {
	//     lat: 34.0522,
	//     long: -118.2437,
	//     mileage: 1500,
	//     engineLoad: 80,
	//     fuelLevel: 60,
	//     seaState: "Moderate",
	//     seaSurfaceTemperature: 18,
	//     airTemp: 22,
	//     humidity: 55,
	//     barometricPressure: 1015,
	//     cargoStatus: "Unloaded",
	//     time: Date.now(),
	//   },
	//   {
	//     lat: 40.7128,
	//     long: -74.006,
	//     mileage: 1800,
	//     engineLoad: 70,
	//     fuelLevel: 40,
	//     seaState: "Rough",
	//     seaSurfaceTemperature: 12,
	//     airTemp: 18,
	//     humidity: 65,
	//     barometricPressure: 1010,
	//     cargoStatus: "Loaded",
	//     time: Date.now(),
	//   },
	// ]);

	useEffect(() => {
        const fetchFingerprints = async () => {
            try {
				console.log("TEST: ", selectedSailingIndex);
                const fingerprints = await getFingerprints(dataAccountAddreses[selectedSailingIndex]);
                console.log('Fingerprints:', fingerprints);
                setBlockchainFingerprints(fingerprints);
            } catch (error) {
                console.error('Error fetching fingerprints:', error);
            }
        };

        const compareFingerprints = async () => {
            const diffs = [];
            for (let i = 0; i < encryptedData.length; i++) {
                diffs[i] = await isDifferent(encryptedData[i].ciphertext, i);
            }
            console.log('Diffs:', diffs);
            setDifferences(diffs);
        };

        fetchFingerprints();
        compareFingerprints();
    }, [encryptedData]);

	const fetchData = async () => {
		try {
			const response = await fetch("http://localhost:5000/api/data");
			const result = await response.json();
			// TODO: New Collection for each ship on backend to remove this filter
			console.log("dataAccountAddreses:", dataAccountAddreses);
			console.log("selectedSailingIndex:", selectedSailingIndex);
			const resultFiltered = result.filter(
				(item: DataItem) => item.data_account === dataAccountAddreses[selectedSailingIndex]
			);
			setEncryptedData(resultFiltered);

			// Decrypt data
			const _decryptedData: SensorData[] = resultFiltered.map(
				(item: DataItem) => {
					console.log(
						"Decrypting data: ",
						item.ciphertext,
						item.tag,
						item.iv,
						masterKeyDecrypted
					);
					const decrypted = decrypt(
						item.ciphertext,
						item.tag,
						item.iv,
						masterKeyDecrypted
					);
					return JSON.parse(decrypted);
				}
			);
			console.log("Decrypted data:", _decryptedData);
			setDecryptedData(_decryptedData);
		} catch (error) {
			console.error("Error fetching data:", error);
		}
	};

	useEffect(() => {
		fetchData();
		const intervalId = setInterval(fetchData, 2000); // Fetch data every 2 seconds
		console.log("Timestamps: ", timestamps);

		return () => clearInterval(intervalId); // Clear interval on component unmount
	}, [selectedSailingIndex]);

	const handleSailingChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedSailingIndex(Number(event.target.value));
	};

	const truncate = (str: string) => {
		if (str.length <= 8) return str;
		return `${str.slice(0, 4)}...${str.slice(-4)}`;
	};

	const getFingerprints = async (dataAccountAddress: Address) => {
        const dataAccount = await program.account.dataAccount.fetch(dataAccountAddress);
        const fingerprints = dataAccount.fingerprints;
        return fingerprints.map((fingerprint) => Buffer.from(fingerprint[0]).toString('hex'));
    };
	
	const isDifferent = async (ciphertext: string, index: number) => {
        const hash = await blake3(Buffer.from(ciphertext, 'hex'));
        console.log('Hash:', hash, 'Blockchain fingerprint:', blockchainFingerprints[index]);
        return hash !== blockchainFingerprints[index];
    };

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
			<div className="table-container table-container-lg">
				{decryptedData.length > 0 && (
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
							{decryptedData.map((data, index) => (
								<tr key={index} className={differences[index] ? 'red-row' : ''}>
									<td>{data.lat}</td>
									<td>{data.long}</td>
									<td>{data.mileage}</td>
									<td>{data.engineLoad}</td>
									<td>{data.fuelLevel}</td>
									<td>{data.seaState}</td>
									<td>{data.seaSurfaceTemperature}</td>
									<td>{data.airTemp}</td>
									<td>{data.humidity}</td>
									<td>{data.barometricPressure}</td>
									<td>{data.cargoStatus}</td>
									<td>{new Date(data.time).toLocaleString()}</td>
								</tr>
							))}
						</tbody>
					</table>
				)}
			</div>
		</div>
	);
}
