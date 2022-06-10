import {
  Key,
  Metadata,
  PROGRAM_ID as METAPLEX_PROGRAM_ID,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { Connection, PublicKey } from "@solana/web3.js";
import bs58 = require("bs58");

const MAX_NAME_LENGTH = 32;
const MAX_SYMBOL_LENGTH = 10;
const MAX_URI_LENGTH = 200;

const connection = new Connection(process.env.RPC_URL ?? "");

async function main() {
  // Fetch all TokenStandard.Fungible https://github.com/metaplex-foundation/metaplex-program-library/blob/master/token-metadata/program/src/state.rs#L161

  // To craft the filter we serialize twice while only changing the tokenStandard to identify which byte offset to filter for
  const metadata = Metadata.fromArgs({
    key: Key.MasterEditionV2,
    updateAuthority: PublicKey.default,
    mint: PublicKey.default,
    data: {
      name: "a".repeat(MAX_NAME_LENGTH),
      symbol: "a".repeat(MAX_SYMBOL_LENGTH),
      uri: "a".repeat(MAX_URI_LENGTH),
      sellerFeeBasisPoints: 0,
      creators: null,
    },
    primarySaleHappened: true,
    isMutable: false,
    editionNonce: 0,
    tokenStandard: 0,
    collection: null,
    uses: null,
  });
  const serializedMetadata = metadata.serialize()[0];
  // @ts-ignore
  metadata.tokenStandard = 1;
  const secondSerializedMetadata = metadata.serialize()[0];

  let tokenStandardOffset: number | undefined;
  for (let i = 0; i < serializedMetadata.length; i++) {
    if (serializedMetadata[i] !== secondSerializedMetadata[i]) {
      tokenStandardOffset = i;
      break;
    }
  }
  if (tokenStandardOffset === undefined)
    throw new Error("Cannot find the tokenStandard offset");
  console.log(`TokenStandard index is found at offset: ${tokenStandardOffset}`);

  const programAccounts = await connection.getProgramAccounts(
    METAPLEX_PROGRAM_ID,
    {
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: bs58.encode([Key.MetadataV1]),
          },
        },
        {
          memcmp: {
            offset: tokenStandardOffset,
            bytes: bs58.encode([TokenStandard.Fungible]),
          },
        },
      ],
    }
  );
  console.log(`Found ${programAccounts.length} fungible token metadata`);
}

main();
