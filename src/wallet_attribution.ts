import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const publicKeyToAnalyze = new PublicKey(
  "8m3vXTD3bVESQoVP896tsTXRsvYb7j7R14PaqXxB4A3z"
);
//7GommU943mhr8t1vVx3L39PMAeLuUrmjMDd9gU47cS3Z
//DroyFg1jFGc6wXg4yKfmNrUrwx5yLz29LwtoX5GdAbL9
//FoptjS9L1JNggnbRFj4zsxunEQ7xubtmhkV9uEEbmvtZ

const connection = new Connection(
  "https://restless-wild-emerald.solana-mainnet.quiknode.pro/9da4d4c2753c970c48309b674ef9ae18a74aab83/"
);
//   https://solitary-wider-hill.solana-devnet.quiknode.pro/784cbce13f7ce74313244cdabe737bf5288c70f0/
//   https://restless-wild-emerald.solana-mainnet.quiknode.pro/9da4d4c2753c970c48309b674ef9ae18a74aab83/

const BATCH_SIZE = 50;

//List of popular program IDs
const popularProgramIds = {
  "Jito Stake pool": new PublicKey(
    "Jito4APyf642JPZPx3hGc6WWJ8zPKtRbRs4P815Awbb"
  ),
  "Jito Governance Token": new PublicKey(
    "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL"
  ),
  "Metaplex Token Metadata": new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  ),
  "Candy Machine v3": new PublicKey(
    "CndyV3LdqHUfDLmE5naZjVN8rBZz4tqhdefbAnjHG3JR"
  ),
  "Raydium Standard AMM ": new PublicKey(
    "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"
  ),
  "Raydium Stable Swap AMM": new PublicKey(
    "5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h"
  ),
  "Solana Program Id": new PublicKey("11111111111111111111111111111111"),
};

const findInteractedContracts = async (
  publicKey: PublicKey
): Promise<{
  interactedContracts: Set<string>;
  hasDeployedProgram: boolean;
}> => {
  let hasDeployedProgram = false;
  const interactedContracts: Set<string> = new Set();
  const bpfLoader = new PublicKey(
    "BPFLoader2111111111111111111111111111111111"
  );

  try {
    const allSignatures: string[] = [];
    const limit = 1000;
    let before: string | undefined = undefined;

    while (true) {
      const signatures = await connection.getSignaturesForAddress(
        publicKey,
        {
          limit,
          before,
        },
        "finalized"
      );

      if (signatures.length === 0) {
        break;
      }

      signatures.forEach((signatureInfo) =>
        allSignatures.push(signatureInfo.signature)
      );

      before = signatures[signatures.length - 1].signature;

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    console.log("there are ", allSignatures.length, " signatures in total");

    const arrayOfArrayOfSignatures = [];

    //Group signatures into array of 50 signatures each

    console.log("starting grouping....");
    for (let i = 0; i < allSignatures.length; i += BATCH_SIZE) {
      const batch = allSignatures
        .slice(i, i + BATCH_SIZE)
        .map((signature) => signature);
      arrayOfArrayOfSignatures.push(batch);
    }

    console.log(`we have ${arrayOfArrayOfSignatures.length} batches`);

    // Loop through each batch of 50 signatures and get the transaction details

    for (const batch of arrayOfArrayOfSignatures) {
      console.log("geting batched transaction");
      const transactions = await connection.getParsedTransactions(batch, {
        maxSupportedTransactionVersion: 0,
        commitment: "finalized",
      });

      console.log(`${transactions.length} full transactions`);

      transactions.forEach((transaction) => {
        if (
          transaction &&
          transaction.transaction &&
          transaction.transaction.message &&
          transaction.transaction.message.instructions
        ) {
          for (const instruction of transaction.transaction.message
            .instructions) {
            if ("programId" in instruction) {
              const programId = instruction.programId.toBase58();

              if (!hasDeployedProgram) {
                if (programId === bpfLoader.toBase58()) {
                  hasDeployedProgram = true;
                }
              }

              for (const [name, publicKey] of Object.entries(
                popularProgramIds
              )) {
                if (publicKey.toBase58() === programId) {
                  interactedContracts.add(name);
                }
              }
            }
          }
        }
      });
    }
    console.log("getting results....");
  } catch (error) {
    console.log("error fetching transaction history");
    console.log(error);
  }
  return { interactedContracts, hasDeployedProgram };
};

const checkWhaleness = async (
  publicKey: PublicKey
): Promise<{ whalness: string; balance: number }> => {
  const lamports = await connection.getBalance(publicKey);
  const balance = lamports / LAMPORTS_PER_SOL;

  let category = "";

  switch (true) {
    case balance <= 1:
      category = "Plankton";
      break;
    case balance > 1 && balance <= 10:
      category = "Shrimp";
      break;
    case balance > 10 && balance <= 100:
      category = "Crab";
      break;
    case balance > 100 && balance <= 500:
      category = "Fish";
      break;
    case balance > 500 && balance <= 1000:
      category = "Dolphin";
      break;
    case balance > 1000 && balance <= 5000:
      category = "Shark";
      break;
    case balance > 5000 && balance <= 25000:
      category = "Orca";
      break;
    case balance > 25000 && balance <= 100000:
      category = "Whale";
      break;

    default:
      category = "God of Sol";
      break;
  }
  return { whalness: category, balance };
};

const start = async () => {
  const interactions = await findInteractedContracts(publicKeyToAnalyze);
  const whaleness = await checkWhaleness(publicKeyToAnalyze);

  console.log({
    interactedContracts: interactions.interactedContracts,
    hasDeployed: interactions.hasDeployedProgram,
    whaleness: whaleness.whalness,
    balance: whaleness.balance,
  });
};

start();
