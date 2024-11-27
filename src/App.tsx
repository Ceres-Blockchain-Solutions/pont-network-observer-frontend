import { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import "./App.css";
import ShipList from "./components/ShipList";
import ViewData from "./components/ViewData";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// Default styles that can be overridden by your app
import "@solana/wallet-adapter-react-ui/styles.css";
import ShipMap from "./components/ShipMap";
import ViewShipTable from "./components/ViewShipTable";

function App() {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;
  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => "http://127.0.0.1:8899", []);

  const wallets = useMemo(
    () => [
      // if desired, manually define specific/custom wallets here (normally not required)
      // otherwise, the wallet-adapter will auto detect the wallets a user's browser has available
    ],
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Router>
            <header>
              <img src="/logo.png" alt="Veles" />
              <img className="logo-mobile" src="/logo_sm.png" alt="Veles" />
              <WalletMultiButton />
            </header>
            <Routes>
              <Route path="/" element={<ShipList />} />
              <Route path="/view-map" element={<ShipMap />} />
              <Route path="/view-data" element={<ViewData />} />
              <Route path="/view-ship-table/:id" element={<ViewShipTable />} />
            </Routes>
          </Router>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
