import { useCallback, useEffect, useState } from "react";
import { program } from "../anchor/setup";
import { web3 } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { formatAddress, numberFormat } from "../utils/helpers";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { FaCoins } from "react-icons/fa";
import Modal from "react-modal";
import { useIntl } from "react-intl";

import "../styles/Staking.css";
import { FaXmark } from "react-icons/fa6";
import { showLoadingNotify, updateNotify } from "../utils/toast";
import { SOLSCAN_URL } from "../constants";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from "@solana/spl-token";

export interface FundraisingAccount {
  startTime: BN;
  endTime: BN;
  totalFundsRaised: BN;
  tokenMint: PublicKey;
  totalFeesCollected: BN;
  totalStaked: BN;
  userStakingInfo: UserAccount[];
}

export interface UserAccount {
  key: PublicKey;
  amountStaked: BN;
  totalFeesWhenLastClaimed: BN;
  lastClaimedFeesSlot: BN;
}

const modalStyle = {
  overlay: {
    zIndex: "2",
    background: "#00000090",
  },
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    maxWidth: "480px",
    width: "95%",
    height: "auto",
    background: "#fff",
    border: "none",
    borderRadius: "8px",
    transform: "translate(-50%, -50%)",
  },
};

function StakeModal({
  isOpen,
  closeModal,
  title,
  availableAmount,
  onClick,
}: {
  isOpen: boolean;
  closeModal: () => void;
  title: string;
  availableAmount: number;
  onClick: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const intl = useIntl();

  const clearState = () => {
    setAmount("");
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      style={modalStyle}
      onAfterClose={() => clearState()}
      onRequestClose={closeModal}
    >
      <div className="stake-modal-container">
        <div className="stake-modal-heading-container">
          <h2>{title}</h2>
          <FaXmark size={24} className="x-mark" onClick={() => closeModal()} />
        </div>
        <div className="stake-modal-amount-container">
          <div className="stake-modal-info-container">
            <span className="stake-modal-info-label">AMOUNT</span>
            <span className="stake-modal-info-label">{`AVAILABLE: ${numberFormat(
              intl,
              availableAmount
            )} PONT`}</span>
          </div>
          <div className="stake-modal-info-container">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="stake-input-amount"
            />
            <div className="stake-max-container">
              <button
                onClick={() => setAmount(availableAmount.toString())}
                className="stake-max-button"
              >
                MAX
              </button>
              <img
                src="/sol_logo.webp"
                alt="Solana"
                className="stake-token-icon"
              />
              <span className="stake-token-name">PONT</span>
            </div>
          </div>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            await onClick(Number(amount));
            setLoading(false);
          }}
          disabled={loading || availableAmount === 0 || amount === ""}
        >
          {loading ? "Pending transaction" : title}
        </button>
      </div>
    </Modal>
  );
}

function UnstakeButton({
  totalStaked,
  onStakeCallback,
}: {
  totalStaked: number | undefined;
  onStakeCallback: () => void;
}) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [isOpen, setIsOpen] = useState(false);

  const unstake = useCallback(
    async (amount: number) => {
      const toastId = showLoadingNotify();

      try {
        const tx = await program.methods
          .unstake(new BN(amount * LAMPORTS_PER_SOL))
          .accounts({
            recipient: publicKey!,
          })
          .transaction();

        const txSignature = await sendTransaction(tx, connection, {
          skipPreflight: true,
        });

        onStakeCallback();

        setIsOpen(false);

        updateNotify(
          toastId,
          "Unstaked successfully, click here to check this transaction on Solscan",
          "success",
          () =>
            window.open(
              `${SOLSCAN_URL}/${txSignature}/?cluster=devnet`,
              "_blank"
            )
        );
      } catch {
        updateNotify(toastId, "Transaction failed", "error");
      }
    },
    [connection, publicKey, sendTransaction, onStakeCallback]
  );

  return (
    <>
      <button
        className="my-staking-button-unstake"
        onClick={() => setIsOpen(true)}
      >
        Unstake
      </button>
      <StakeModal
        isOpen={isOpen}
        closeModal={() => setIsOpen(false)}
        title="Unstake"
        availableAmount={totalStaked ?? 0}
        onClick={(amount: number) => unstake(amount)}
      />
    </>
  );
}

function StakeButton({
  availableTokens,
  onStakeCallback,
}: {
  availableTokens: number | undefined;
  onStakeCallback: () => void;
}) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const [isOpen, setIsOpen] = useState(false);

  const stake = useCallback(
    async (amount: number) => {
      const toastId = showLoadingNotify();

      try {
        const tx = await program.methods
          .stake(new BN(amount * LAMPORTS_PER_SOL))
          .accounts({
            sender: publicKey!,
          })
          .transaction();

        const txSignature = await sendTransaction(tx, connection, {
          skipPreflight: true,
        });

        onStakeCallback();

        setIsOpen(false);

        updateNotify(
          toastId,
          "Staked successfully, click here to check this transaction on Solscan",
          "success",
          () =>
            window.open(
              `${SOLSCAN_URL}/${txSignature}/?cluster=devnet`,
              "_blank"
            )
        );
      } catch {
        updateNotify(toastId, "Transaction failed", "error");
      }
    },
    [connection, publicKey, sendTransaction, onStakeCallback]
  );

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Stake</button>
      <StakeModal
        isOpen={isOpen}
        closeModal={() => setIsOpen(false)}
        title="Stake"
        availableAmount={availableTokens ?? 0}
        onClick={(amount: number) => stake(amount)}
      />
    </>
  );
}

export default function StakingDashboard() {
  const { publicKey, connected, wallet, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();
  const [claim, setClaim] = useState<number | undefined>();
  const [availableTokens, setAvailableTokens] = useState<number | undefined>();
  const [stakedTokens, setStakedTokens] = useState<number | undefined>();
  const { connection } = useConnection();

  const intl = useIntl();

  const calculateClaimableAmount = useCallback(async () => {
    const seed = Buffer.from("fundraising");

    const [fundRaisingPDA] = web3.PublicKey.findProgramAddressSync(
      [seed],
      program.programId
    );

    const fundRaisingAccount: FundraisingAccount =
      await program.account.fundraisingAccount.fetch(fundRaisingPDA);

    const userInfo: UserAccount | undefined =
      fundRaisingAccount.userStakingInfo.find(
        (userInfo) => userInfo.key.toBase58() == publicKey?.toBase58()
      );

      if (userInfo) {
        // Convert the values to BigNumber instances
        const amountStaked = userInfo.amountStaked;
        const totalStaked = fundRaisingAccount.totalStaked;
        const totalFeesCollected = fundRaisingAccount.totalFeesCollected;
        const totalFeesWhenLastClaimed = userInfo.totalFeesWhenLastClaimed;
      
        console.log("Amount staked: ", amountStaked.toString());  // Output amount staked as a string for visibility
        console.log("Total staked:", totalStaked.toString());  // Output total staked as a string for visibility
        console.log("Total fees collected: ", totalFeesCollected.toString());  // Output total fees collected as a string for visibility
        console.log("Total Fees when last claimed:", totalFeesWhenLastClaimed.toString());  // Output total fees when last claimed as a string for visibility

        // Calculate the remaining fees
        const totalClaimableFeesOfAllUsers = totalFeesCollected.sub(totalFeesWhenLastClaimed);
      
        // Calculate the denominator: total staked amount multiplied by remaining fees
        // const denominator = totalStaked.mul(totalClaimableFeesOfAllUsers);
      
        // Check if denominator is not zero to prevent division by zero
        if (!totalStaked.isZero()) {

          const claim = amountStaked.mul(totalClaimableFeesOfAllUsers).div(totalStaked);

          const claimUi = claim.toNumber() / LAMPORTS_PER_SOL;
          setClaim(claimUi);
          
          console.log("Claim ui: ", claimUi);  // Output claim as a string for visibility
        } else {
          console.error('Error: Denominator is zero, cannot calculate claim');
        }
      }
      
  }, [publicKey]);

  const fetchAvailableTokens = useCallback(async () => {
    const seed = Buffer.from("mint");

    const [mintPDA] = web3.PublicKey.findProgramAddressSync(
      [seed],
      program.programId
    );

    const selfAssociatedTokenAccount = await getAssociatedTokenAddress(
      mintPDA,
      publicKey!,
      true,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const tokenAccount = await connection.getTokenAccountBalance(
      selfAssociatedTokenAccount
    );
    setAvailableTokens(tokenAccount.value.uiAmount || 0);
  }, [publicKey, connection]);

  const fetchStakedTokens = useCallback(async () => {
    const seed = Buffer.from("fundraising");

    const [fundRaisingPDA] = web3.PublicKey.findProgramAddressSync(
      [seed],
      program.programId
    );

    const fundRaisingAccount: FundraisingAccount =
      await program.account.fundraisingAccount.fetch(fundRaisingPDA);

    const userInfo: UserAccount | undefined =
      fundRaisingAccount.userStakingInfo.find(
        (userInfo) => userInfo.key.toBase58() == publicKey!.toBase58()
      );

    if (userInfo) {
      setStakedTokens(userInfo?.amountStaked.div(new BN(LAMPORTS_PER_SOL)).toNumber());
    }
  }, [publicKey]);

  useEffect(() => {
    (async () => {
      console.log("My sol: ", await connection.getBalance(publicKey!));
      if (publicKey) {
        calculateClaimableAmount();
        fetchAvailableTokens();
        fetchStakedTokens();
      }
    })();
  }, [
    publicKey,
    fetchStakedTokens,
    fetchAvailableTokens,
    calculateClaimableAmount,
  ]);

  const claimRewards = useCallback(async () => {
    const toastId = showLoadingNotify();

    try {
      const tx = await program.methods
        .claimRewards()
        .accounts({
          user: publicKey!,
        })
        .transaction();

      const txSignature = await sendTransaction(tx, connection, {
        skipPreflight: true,
      });

      updateNotify(
        toastId,
        "Claimed successfully, click here to check this transaction on Solscan",
        "success",
        () =>
          window.open(`${SOLSCAN_URL}/${txSignature}/?cluster=devnet`, "_blank")
      );
    } catch {
      updateNotify(toastId, "Transaction failed", "error");
    }
  }, [connection, publicKey, sendTransaction]);

  return (
    <div className="main-container staking-container">
      <div className="grid-container">
        <div className="my-staking-container">
          <h2 className="my-staking-title">My PONT Staking</h2>
          {connected && publicKey && (
            <span className="my-staking-wallet">{`${wallet?.adapter.name ?? ""
              }: ${formatAddress(publicKey.toBase58())}`}</span>
          )}
          <div className="my-staking-info-container">
            <div className="my-staking-info-wrapper">
              <span className="my-staking-info-label">TOTAL STAKED</span>
              <span className="my-staking-info-title">
                {stakedTokens
                  ? `${numberFormat(intl, stakedTokens)} PONT`
                  : "--"}
              </span>
            </div>
            <div className="my-staking-info-wrapper">
              <span className="my-staking-info-label">AVAILABLE IN WALLET</span>
              <span className="my-staking-info-title">
                {availableTokens
                  ? `${numberFormat(intl, availableTokens)} PONT`
                  : "0"}
              </span>
            </div>
          </div>
          {connected && publicKey ? (
            <>
              <div className="my-staking-claim-container">
                <div className="my-staking-claim-info-container">
                  <span className="my-staking-claim-info-label">
                    CLAIMABLE REWARDS
                  </span>
                  <span className="my-staking-claim-info-title ">{`${claim ? numberFormat(intl, claim) : 0
                    } SOL`}</span>
                </div>
                <button
                  onClick={() => claimRewards()}
                  disabled={claim === undefined || claim === 0}
                >
                  Claim
                </button>
              </div>
              <div className="my-staking-actions-container">
                <StakeButton
                  availableTokens={availableTokens}
                  onStakeCallback={() => fetchStakedTokens()}
                />
                <UnstakeButton
                  totalStaked={stakedTokens}
                  onStakeCallback={() => fetchAvailableTokens()}
                />
              </div>
            </>
          ) : (
            <div className="my-staking-actions-container">
              <button onClick={() => setVisible(true)}>Connect wallet</button>
            </div>
          )}
        </div>
        <div className="info-wrapper">
          <div className="stake-container">
            <div className="stake-info-container">
              <span className="stake-label">Total Staked</span>
              <h1 className="stake-title">57,500.25 PONT</h1>
              <span className="stake-subtitle">$1200</span>
            </div>
            <img className="stake-lock" src="/lock.png" alt="Lock" />
          </div>
          <div className="stake-container rewards-container">
            <div className="stake-info-container rewards-info-container">
              <span className="stake-label">Estimated Rewards</span>
              <h1 className="stake-title">30%</h1>
              <span className="stake-subtitle">APR</span>
            </div>
            <FaCoins className="stake-lock" />
          </div>
          <div className="stake-container stats-container">
            <span className="stake-label">PONT Stats</span>
            <div className="stats-info-container">
              <div className="stats-info-wrapper">
                <span className="stats-info-label">PONT PRICE</span>
                <span className="stats-info-title">$245</span>
              </div>
              <div className="stats-info-wrapper">
                <span className="stats-info-label">DAILY REWARDS</span>
                <span className="stats-info-title">5 PONT</span>
              </div>
              <div className="stats-info-wrapper">
                <span className="stats-info-label">CIRCULATING SUPPLY</span>
                <span className="stats-info-title">50,000 PONT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
