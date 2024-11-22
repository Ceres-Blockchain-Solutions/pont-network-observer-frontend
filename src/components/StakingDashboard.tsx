import { useEffect, useState } from "react";
import { program } from "../anchor/setup";
import { web3 } from "@coral-xyz/anchor";
import { useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";

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

export default function StakingDashboard() {
  const { publicKey, signMessage, sendTransaction } = useWallet();
  const [claim, setClaim] = useState<BN>();

  useEffect(() => {
    if (publicKey) {
      calculateClaimableAmount();
    }
  }, [publicKey]);

  const calculateClaimableAmount = async () => {
    const seed = Buffer.from("fundraising");

    const [fundRaisingPDA] = web3.PublicKey.findProgramAddressSync(
      [seed],
      program.programId
    );

    const fundRaisingAccount: FundraisingAccount =
      await program.account.fundraisingAccount.fetch(fundRaisingPDA);

    const userInfo: UserAccount | undefined =
      fundRaisingAccount.userStakingInfo.find(
        (userInfo) => userInfo.key == publicKey
      );

    if (!userInfo) {
      console.log("No matching userStakingInfo found.");
      return;
    }

    let claim =
      userInfo.amountStaked /
      (fundRaisingAccount.totalStaked *
        (fundRaisingAccount.totalFeesCollected -
          userInfo.totalFeesWhenLastClaimed));

    setClaim(claim);
  };

  const stake = async () => {};
  const unstake = async () => {};
  const claimRewards = async () => {};

  return (
    <div className="main-container">
      <button onClick={stake}>Stake</button>
      <button onClick={unstake}>Unstake</button>
      <div>
        <label style={{ color: "black" }}>Claimable Rewards: {claim}</label>
        <button onClick={claimRewards}>Claim rewards</button>
      </div>
    </div>
  );
}
