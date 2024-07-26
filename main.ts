import "dotenv/config";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction, TransactionConfirmationStrategy } from "@solana/web3.js";
import { decode } from 'bs58';
import { fromLegacyKeypair, fromLegacyPublicKey } from '@solana/compat';
import { MarginAccount, MarginAccountSeeds, fetchMarginAccount, findMarginAccountPda, getInitMarginAccountInstructionAsync } from '@tensor-foundation/escrow';
import { fromConnectionToRpc, fromIInstructionToTransactionInstruction } from "@tensor-foundation/compat-helpers";

(async () => {
    const PRIV_KEY = process.env.PRIVATE_KEY || "YOUR_BASE58_ENCODED_PRIVATE_KEY";

    // Usual instanciation of legacy classes
    const walletKeypair = Keypair.fromSecretKey(decode(PRIV_KEY));
    const conn = new Connection("https://api.mainnet-beta.solana.com", { commitment: "confirmed" });

    // Derive margin account address
    //
    // findMarginAccountPda wants two parameters of type "Address"
    // the equivalent of that in legacy is PublicKey, so we use 
    // the compat package to convert PublicKeys into Addresses
    const marginAccountSeeds: MarginAccountSeeds = {
        tswap: fromLegacyPublicKey(new PublicKey("4zdNGgAtFsW1cQgHqkiWyRsxaAgxrSRRynnuunxzjxue")),
        owner: fromLegacyPublicKey(walletKeypair.publicKey),
        marginNr: 0
    }

    // findMarginAccountPda would return a ProgramDerivedAddress (new ^2.0.0 class)
    // but we can simply cast that back to a PublicKey for further usage
    // within our legacy context
    const marginPda = await findMarginAccountPda(marginAccountSeeds).then(([marginPda]: any) => new PublicKey(marginPda));

    // Check if margin account already exists via legacy RPC call
    const marginInfo = await conn.getAccountInfo(marginPda);

    // If margin account doesn't exist, we initialize it via the escrow SDK
    if (!marginInfo) {

        // To get the instruction to initialize the margin account, we need to provide the 
        // owner argument as an KeyPairSigner, so we can  make use of the helper
        // function that converts a Keypair (legacy) to a KeypairSigner (next)
        const initEscrowIx = await getInitMarginAccountInstructionAsync({
            owner: fromLegacyKeypair(walletKeypair)
        });

        // To send that instruction, we can use the normal legacy Transaction object by mapping
        // the returned instruction of type IInstruction to a legacy TransactionInstruction
        // with the helper function fromIInstructionToTransactionInstruction
        const legacyInitEscrowInstruction: TransactionInstruction = fromIInstructionToTransactionInstruction(initEscrowIx);
        const tx = new Transaction().add(legacyInitEscrowInstruction);
        const blockhash = await conn.getLatestBlockhash().then((res) => res.blockhash);
        tx.recentBlockhash = blockhash;
        tx.feePayer = walletKeypair.publicKey;
        tx.sign(walletKeypair);

        // Send transaction 
        const signature = await conn.sendRawTransaction(tx.serialize());
        const confirmation = await conn.confirmTransaction({signature: signature} as TransactionConfirmationStrategy);
        console.log(confirmation);
        if(confirmation.value.err){
            console.error('transaction failed with error:' + confirmation.value.err);
        }
    }

    // Log info for the existing margin account of the existing or newly initiated margin account
    // 
    // fetchMarginAccount wants an Rpc as argument, the equivalent of Rpc in legacy is Connection
    // so we use fromConnectionToRpc, imported from @tensor-foundation/compat-helpers
    // and an Address for the marginPda pubkey, for which we use fromLegacyPublicKey again
    const marginAccount: MarginAccount = await fetchMarginAccount(
        fromConnectionToRpc(conn),
        fromLegacyPublicKey(marginPda),
        {
            commitment: "confirmed",
        }
    )
    console.log(marginAccount);
})();