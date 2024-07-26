# Compatibility Example
## Getting Started
This repository showcases how to integrate Tensor's new SDKs with web3.js-legacy (<v2.0.0). 
The short example script in `main.ts` will initialize a margin account for a wallet if it doesn't already exist and log the margin account details afterwards.

### Install Dependencies
To get started, clone this repository, navigate to it and install all dependencies with the package manager of your choice by running
```shell
cd web3.js-compatibility-example
npm install
```
### Fill in your private key
For executing the margin account initialization, you can either replace the string in line 9 of `main.ts` with your private key or create an `.env` file like:
```env
PRIVATE_KEY=B827AFF9sv7283CBA21HD27fhSawDCTAAM
```

### Run the script
Afterwards you can simply run the example by executing
```shell
npx ts-node main.ts
```

## Compat Cheatsheet

If you see any new argument types required in our new SDKs, there is a simple way to get all of them with web3.js-legacy:

| next type | legacy type | legacy => next | next => legacy
|-|-|-|-|
| Address/ProgramDerivedAddress | PublicKey | fromLegacyPublicKey(publickey) | new PublicKey(address) |
| Rpc | Connection | fromConnectionToRpc(connection) | - |
| KeyPairSigner/CryptoKeyPair/TransactionSigner | Keypair | fromLegacyKeypair(keypair) | - |
| bigint | BN/Number | BigInt(number) | Number(bigint) |
| IInstruction | TransactionInstruction | fromTransactionInstructionToIInstruction(transactionInstruction) | fromIInstructionToTransactionInstruction(iinstruction) |
