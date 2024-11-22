import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { encode } from "bs58";
import { blake3 } from "hash-wasm";
import { program, ShipAccount } from "../anchor/setup";
import { ProgramAccount } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Buffer } from "buffer";
import { x25519 } from "@noble/curves/ed25519";
import { useNavigate } from "react-router-dom";
import "../styles/ShipList.css";
import * as ecies25519 from "ecies-25519";

export default function ShipList() {
  const { connection } = useConnection();
  const { publicKey, signMessage, sendTransaction } = useWallet();
  const navigate = useNavigate();
  const [masterKeyEncrypted, setMasterKeyEncrypted] = useState<number[] | null>(
    null
  );
  const [shipAccounts, setShipAccounts] = useState<
    ProgramAccount<ShipAccount>[] | null
  >(null);
  const [hasAccess, setHasAccess] = useState<boolean[]>([]);
  const [unapprovedExternalObservers, setUnapprovedExternalObservers] =
    useState<boolean[]>([]);

  // MOCK DATA
  //   const [shipAccounts, setShipAccounts] = useState([
  //     {
  //       publicKey: "mockPublicKey1",
  //       account: {
  //         ship: "mockShip1",
  //         shipManagement: "mockShipManagement1",
  //         dataAccounts: ["mockDataAccount1"],
  //       },
  //     },
  //     {
  //       publicKey: "mockPublicKey2",
  //       account: {
  //         ship: "mockShip2",
  //         shipManagement: "mockShipManagement2",
  //         dataAccounts: ["mockDataAccount1"],
  //       },
  //     },
  //   ]);
  //   const [hasAccess, setHasAccess] = useState([true, true]);
  //   const [unapprovedExternalObservers, setUnapprovedExternalObservers] =
  //     useState([false, false]);

  const fetchAllShipAccounts = async () => {
    try {
      if (!publicKey) {
        console.error("Wallet not connected");
        return;
      }

      // Fetch initial account data
      let shipAccounts = await program.account.shipAccount.all();
      console.log("Ship Accounts:", JSON.stringify(shipAccounts, null, 2));

      // TODO:
      shipAccounts = shipAccounts.filter(
        (shipAccount) => shipAccount.account.dataAccounts.length > 0
      );

      setShipAccounts(shipAccounts);

      const accessArray = new Array(shipAccounts.length).fill(false);
      const unapprovedArray = new Array(shipAccounts.length).fill(false);

      await Promise.all(
        shipAccounts.map(async (shipAccount, shipIndex) => {
          if (shipAccount.account.dataAccounts.length === 0) {
            accessArray[shipIndex] = false;
            unapprovedArray[shipIndex] = false;
          }

          await Promise.all(
            shipAccount.account.dataAccounts.map(async (dataAccount) => {
              const [externalObserversAccountAddr, _] =
                PublicKey.findProgramAddressSync(
                  [
                    Buffer.from("external_observers_account"),
                    dataAccount.toBuffer(),
                  ],
                  program.programId
                );

              const externalObserversAccountData =
                await program.account.externalObserversAccount.fetch(
                  externalObserversAccountAddr
                );

              console.log(
                "External Observers Account Data:",
                JSON.stringify(externalObserversAccountData, null, 2)
              );

              const hasAccess =
                externalObserversAccountData.externalObservers.some(
                  (observer) => observer.equals(publicKey)
                );
              const isUnapproved =
                externalObserversAccountData.unapprovedExternalObservers.some(
                  (unapprovedObserver) => unapprovedObserver.equals(publicKey)
                );

              if (hasAccess) {
                accessArray[shipIndex] = true;
                const index =
                  externalObserversAccountData.externalObservers.findIndex(
                    (observer) => observer.equals(publicKey)
                  );
                const masterKeyEncrypted =
                  externalObserversAccountData.externalObserversMasterKeys[
                    index
                  ];
                setMasterKeyEncrypted(masterKeyEncrypted);
              }

              if (isUnapproved) {
                unapprovedArray[shipIndex] = true;
              }

              console.log("Has Access:", accessArray);
              console.log("Unapproved External Observers:", unapprovedArray);
            })
          );
        })
      );

      setHasAccess([...accessArray]);
      setUnapprovedExternalObservers([...unapprovedArray]);
    } catch (error) {
      console.error("Error fetching counter data:", error);
    }
  };

  useEffect(() => {
    fetchAllShipAccounts();
  }, [program, connection, publicKey]);

  const handleRequestAccess = async (index: number) => {
    console.log(`Requesting access for ship account at index ${index}`);

    // // MOCK IMPLEMENTATION
    // navigate("/view-data", {
    //   state: {
    //     ship: shipAccounts[index].account.ship,
    //     masterKeyDecrypted: new Uint8Array([1, 2, 3, 4]),
    //   },
    // });
    // return;

    const message = "SIGN THIS MESSAGE TO GET SEED FOR25199 KEYPAIR";
    const encodedMessage = new TextEncoder().encode(message);
    try {
      if (!signMessage) {
        console.error("signMessage is undefined");
        return;
      }
      const signature = await signMessage(encodedMessage);
      const encodedSignature = encode(signature);
      const sk = await blake3(signature);
      console.log("Signature:", encodedSignature);
      console.log("Message signed successfully! Your sk: " + sk);

      const x25519_pk = x25519.getPublicKey(sk);

      console.log("Your x25519 public key:", encode(x25519_pk));

      const shipAccountPublicKey = shipAccounts![index].publicKey;

      console.log("Ship account address:", shipAccountPublicKey);
      const shipAccount = await program.account.shipAccount.fetch(
        shipAccountPublicKey
      );

      console.log("Ship account:", shipAccount);

      const lastDataAccount = shipAccount.dataAccounts.at(-1)!;

      const [externalObserversAccount] = PublicKey.findProgramAddressSync(
        [Buffer.from("external_observers_account"), lastDataAccount.toBuffer()],
        program.programId
      );

      // Call the externalObserverRequest instruction with x25519_pk
      const tx = await program.methods
        .externalObserverRequest(new PublicKey(x25519_pk))
        .accountsStrict({
          dataAccount: lastDataAccount.toString(),
          externalObserversAccount: externalObserversAccount.toString(),
          externalObserver: publicKey!.toString(),
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const txSignature = await sendTransaction(tx, connection, {
        skipPreflight: true,
      });

      console.log("Transaction sent with signature: ", txSignature);
      fetchAllShipAccounts();
    } catch (error) {
      console.error("Error signing message:", error);
      alert("Failed to sign message.");
    }
  };

  const handleViewData = async (
    ship: string,
    dataAccountAddreses: string[],
    dataAccountTimestamps: number[]
  ) => {
    // // MOCK IMPLEMENTATION
    // navigate("/view-data", {
    //   state: { ship, masterKeyDecrypted: new Uint8Array([1, 2, 3, 4]) },
    // });
    // return;

    const message = "SIGN THIS MESSAGE TO GET SEED FOR25199 KEYPAIR";
    const encodedMessage = new TextEncoder().encode(message);
    let masterKeyDecrypted: Uint8Array | null = null;
    try {
      if (!signMessage) {
        console.error("signMessage is undefined");
        return;
      }
      const signature = await signMessage(encodedMessage);
      const encodedSignature = encode(signature);
      const sk = await blake3(signature);
      console.log("Signature:", encodedSignature);
      console.log("Message signed successfully! Your sk: " + sk);
      console.log("Your x25519 public key:", encode(x25519.getPublicKey(sk)));

      if (masterKeyEncrypted) {
        const masterKeyEncryptedUint8Array = new Uint8Array(masterKeyEncrypted);
        console.log(
          "masterKeyEncryptedUint8Array:",
          masterKeyEncryptedUint8Array
        );
        console.log("skUint8Array:", new Uint8Array(Buffer.from(sk, "hex")));

        console.log(
          "TEST: ",
          await ecies25519.encrypt(new Uint8Array(32), x25519.getPublicKey(sk))
        );
        masterKeyDecrypted = await ecies25519.decrypt(
          masterKeyEncryptedUint8Array,
          new Uint8Array(Buffer.from(sk, "hex"))
        );

        console.log("masterKeyDecrypted: ", masterKeyDecrypted);
      } else {
        console.error("masterKeyEncrypted is null");
      }
    } catch (error) {
      console.error("Error signing message:", error);
      alert("Failed to sign message.");
    }

    console.log(`Viewing data for ship ${ship}`);
    navigate("/view-data", {
      state: {
        ship,
        masterKeyDecrypted,
        dataAccountAddreses,
        dataAccountTimestamps,
      },
    });
  };

  const stakingDashboardNavigate = () => {
    navigate("/staking-dashboard");
  };

  // Render the value of the counter
  return (
    <div className="main-container">
      <button className="dashboard-button" onClick={stakingDashboardNavigate}>
        Stake
      </button>
      <div className="table-container">
        <h1 className="ship-accounts-title">Ship Accounts</h1>
        {shipAccounts && shipAccounts.length > 0 ? (
          <table className="styled-table">
            <tbody>
              {shipAccounts.map((account, index) => (
                <tr key={index}>
                  <td className="align-left">
                    {account.account.ship.toString()}
                  </td>
                  <td className="button-container">
                    {account.account.dataAccounts.length > 0 &&
                      (hasAccess[index] ? (
                        <button
                          onClick={async () =>
                            await handleViewData(
                              account.account.ship.toString(),
                              account.account.dataAccounts.map((pk) =>
                                pk.toString()
                              ),
                              account.account.dataAccountStartingTimestamps.map(
                                (timestamp) => timestamp.toNumber()
                              )
                            )
                          }
                        >
                          View Data
                        </button>
                      ) : unapprovedExternalObservers[index] ? (
                        <span>Already Requested</span>
                      ) : (
                        <button onClick={() => handleRequestAccess(index)}>
                          Request Access
                        </button>
                      ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}
