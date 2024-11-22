import { useEffect, useState } from "react";
import { program } from "../anchor/setup";
import { web3 } from "@coral-xyz/anchor";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";

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
  const [stakeOrUnstakeAmount, setStakeOrUnstakeAmount] = useState<number>(0);
  const [availableTokens, setAvailableTokens] = useState<number>(0);
  const [stakedTokens, setStakedTokens] = useState<number>(0);
  const { connection } = useConnection();

  useEffect(() => {
    if (publicKey) {
      calculateClaimableAmount();
      fetchAvailableTokens();
      fetchStakedTokens();
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
        (userInfo) => userInfo.key.toBase58() == publicKey?.toBase58()
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

  const fetchAvailableTokens = async () => {
    const seed = Buffer.from("mint");

    const [mintPDA] = web3.PublicKey.findProgramAddressSync(
      [seed],
      program.programId
    );

    const selfAssociatedTokenAccount = await getAssociatedTokenAddress(
      mintPDA,
      publicKey!
    );

    const tokenAccount = await connection.getTokenAccountBalance(selfAssociatedTokenAccount);
    setAvailableTokens(tokenAccount.value.uiAmount || 0);
  };

  const fetchStakedTokens = async () => {
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

    if (!userInfo) {
      console.log("No matching userStakingInfo found.");
      return;
    }

    setStakedTokens(userInfo.amountStaked.toNumber());
  }

  const stake = async () => {
    const tx = await program.methods.stake(stakeOrUnstakeAmount).accounts({
      sender: publicKey!,
    })
      .transaction();

    const txSignature = await sendTransaction(tx, connection, {
      skipPreflight: true,
    });

    fetchStakedTokens();
  };

  const unstake = async () => {
    const tx = await program.methods.unstake(stakeOrUnstakeAmount).accounts({
      recipient: publicKey!,
    })
      .transaction();

    const txSignature = await sendTransaction(tx, connection, {
      skipPreflight: true,
    });

    fetchStakedTokens();
  };
  const claimRewards = async () => {
    const tx = await program.methods.claimRewards().accounts({
      user: publicKey!,
    })
      .transaction();

    const txSignature = await sendTransaction(tx, connection, {
      skipPreflight: true,
    });
  };

  return (
    <div className="main-container">
      <div>
        <label htmlFor="stake-unstake-amount" style={{ color: "black" }}>Amount to stake/unstake:</label>
        <input
          id="stake-unstake-amount"
          type="number"
          value={stakeOrUnstakeAmount}
          onChange={(e) => setStakeOrUnstakeAmount(Number(e.target.value))}
          placeholder="Enter amount to stake/unstake"
        />
      </div>
      <button onClick={stake}>Stake</button>
      <button onClick={unstake}>Unstake</button>
      <div>
        <label style={{ color: "black" }}>Claimable Rewards: {claim}</label>
        <button onClick={claimRewards}>Claim rewards</button>
      </div>
    </div>
  );
}
