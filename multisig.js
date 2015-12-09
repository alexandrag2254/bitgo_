var privateKeys = [];
var publicKeys = [];
var privKeysStr = [];

for (var i = 0; i < 3; i++) {
  var privateKey = new bitcore.PrivateKey();
  privKeysStr.push(privateKey.toString());
  privateKeys.push(privateKey);
}

_.forEach(privateKeys, function(key) {
  var address = new bitcore.PublicKey(key).toString();
  publicKeys.push(address);
});

var p2shAddress = new bitcore.Address(publicKeys, 2);
var multiSigAddress = p2shAddress.toString(); // Multisig address
var build = bitcore.Script.buildMultisigOut(publicKeys, 2);
var redeemScript = build.toScriptHashOut().toString(); // redeemScript



//----------------------------------------------------------------------------------

# P2SH Multisig

https://bitcoin.org/en/developer-examples#offline-signing

In this subsection we will create a P2SH multisig address, spend satoshis to it and then spend those satoshis from it to another address. 

Creating a multisig address is easy. Multisig outputs have two parameters, the minimum number of signatures required (m) and the number
of public keys to use to validate those signatures. This is called m-of-n and in this case we'll be using 2-of-3.

   > bitcoin-cli -regtest getnewaddress
   mhAXF4Eq7iRyvbYk1mpDVBiGdLP3YbY6Dm
   > bitcoin-cli -regtest getnewaddress
    moaCrnRfP5zzyhW8k65f6Rf2z5QpvJzSKe
   > bitcoin-cli -regtest getnewaddress
    mk2QpYatsKicvFVuTAQLBryyccRXMUaGHP
    
   > NEW_ADDRESS1=mhAXF4Eq7iRyvbYk1mpDVBiGdLP3YbY6Dm
   > NEW_ADDRESS2=moaCrnRfP5zzyhW8k65f6Rf2z5QpvJzSKe
   > NEW_ADDRESS3=mk2QpYatsKicvFVuTAQLBryyccRXMUaGHP
   
Generate three new P2PKH addresses. P2PKH addresses cannot be used with the multisig redeem script created below. (Hashing each public key
script is unnecessary anyway - all the public keys are protected by a hash when the redeem script is hashed.) However, Bitcoin Core uses
addresses as a way to reference the underlying full (unhashed) public keys it knows about, so we get the three new addresses above in order
to use their public keys.

Recall from the Guide that the hashed public keys used in addresses obfuscate the full public key, so you cannot give an address to another
person or device as part of creating a typical multisig output or P2SH multisig redeem script. You must give them a full public key.

> bitcoin-cli -regtest validateaddress $NEW_ADDRESS3
{
    "isvalid" : true,
    "address" : "mk2QpYatsKicvFVuTAQLBryyccRXMUaGHP",
    "ismine" : true,
    "isscript" : false,
    "pubkey" : "029e03a901b85534ff1e92c43c74431f7ce72046060fcf7a\
                95c37e148f78c77255",
    "iscompressed" : true,
    "account" : ""
}
 
> NEW_ADDRESS3_PUBLIC_KEY=029e03a901b85534ff1e92c43c74431f7ce720[...]

Use the validateaddress RPC to display the full (unhashed) public key for one of the addresses. This is the information which will actually be included in the multisig redeem script. This is also the information you would give another person or device as part of creating a multisig output or P2SH multisig redeem script.

We save the address returned to a shell variable.

> bitcoin-cli -regtest createmultisig 2 '''
    [
      "'$NEW_ADDRESS1'",
      "'$NEW_ADDRESS2'", 
      "'$NEW_ADDRESS3_PUBLIC_KEY'"
    ]'''
{
    "address" : "2N7NaqSKYQUeM8VNgBy8D9xQQbiA8yiJayk",
    "redeemScript" : "522103310188e911026cf18c3ce274e0ebb5f95b00\
    7f230d8cb7d09879d96dbeab1aff210243930746e6ed6552e03359db521b\
    088134652905bd2d1541fa9124303a41e95621029e03a901b85534ff1e92\
    c43c74431f7ce72046060fcf7a95c37e148f78c7725553ae"
}
 
> P2SH_ADDRESS=2N7NaqSKYQUeM8VNgBy8D9xQQbiA8yiJayk
> P2SH_REDEEM_SCRIPT=522103310188e911026cf18c3ce274e0ebb5f95b007[...]
Use the createmultisig RPC with two arguments, the number (n) of signatures required and a list of addresses or public keys. Because P2PKH addresses can’t be used in the multisig redeem script created by this RPC, the only addresses which can be provided are those belonging to a public key in the wallet. In this case, we provide two addresses and one public key—all of which will be converted to public keys in the redeem script.

The P2SH address is returned along with the redeem script which must be provided when we spend satoshis sent to the P2SH address.

Warning icon Warning: You must not lose the redeem script, especially if you don’t have a record of which public keys you used to create the P2SH multisig address. You need the redeem script to spend any bitcoins sent to the P2SH address. If you lose the redeem script, you can recreate it by running the same command above, with the public keys listed in the same order. However, if you lose both the redeem script and even one of the public keys, you will never be able to spend satoshis sent to that P2SH address.

Neither the address nor the redeem script are stored in the wallet when you use createmultisig. To store them in the wallet, use the addmultisigaddress RPC instead. If you add an address to the wallet, you should also make a new backup.

> bitcoin-cli -regtest sendtoaddress $P2SH_ADDRESS 10.00
7278d7d030f042ebe633732b512bcb31fff14a697675a1fe1884db139876e175

> UTXO_TXID=7278d7d030f042ebe633732b512bcb31fff14a697675a1fe1884[...]
Paying the P2SH multisig address with Bitcoin Core is as simple as paying a more common P2PKH address. Here we use the same command (but different variable) we used in the Simple Spending subsection. As before, this command automatically selects an UTXO, creates a change output to a new one of our P2PKH addresses if necessary, and pays a transaction fee if necessary.

We save that txid to a shell variable as the txid of the UTXO we plan to spend next.

> bitcoin-cli -regtest getrawtransaction $UTXO_TXID 1
{
    "hex" : "0100000001f0ede03d75050f20801d50358829ae02c058e8677\
             d2cc74df51f738285013c26010000006a47304402203c375959\
             2bf608ab79c01596c4a417f3110dd6eb776270337e575cdafc6\
             99af20220317ef140d596cc255a4067df8125db7f349ad94521\
             2e9264a87fa8d777151937012102a92913b70f9fb15a7ea5c42\
             df44637f0de26e2dad97d6d54957690b94cf2cd05ffffffff01\
             00ca9a3b0000000017a9149af61346ce0aa2dffcf697352b4b7\
             04c84dcbaff8700000000",
    "txid" : "7278d7d030f042ebe633732b512bcb31fff14a697675a1fe18\
              84db139876e175",
    "version" : 1,
    "locktime" : 0,
    "vin" : [
        {
            "txid" : "263c018582731ff54dc72c7d67e858c002ae298835\
                      501d80200f05753de0edf0",
            "vout" : 1,
            "scriptSig" : {
                "asm" : "304402203c3759592bf608ab79c01596c4a417f\
                         3110dd6eb776270337e575cdafc699af2022031\
                         7ef140d596cc255a4067df8125db7f349ad9452\
                         12e9264a87fa8d77715193701
                         02a92913b70f9fb15a7ea5c42df44637f0de26e\
                         2dad97d6d54957690b94cf2cd05",
                "hex" : "47304402203c3759592bf608ab79c01596c4a41\
                         7f3110dd6eb776270337e575cdafc699af20220\
                         317ef140d596cc255a4067df8125db7f349ad94\
                         5212e9264a87fa8d777151937012102a92913b7\
                         0f9fb15a7ea5c42df44637f0de26e2dad97d6d5\
                         4957690b94cf2cd05"
            },
            "sequence" : 4294967295
        }
    ],
    "vout" : [
        {
            "value" : 10.00000000,
            "n" : 0,
            "scriptPubKey" : {
                "asm" : "OP_HASH160 9af61346ce0aa2dffcf697352b4b\
                704c84dcbaff OP_EQUAL",
                "hex" : "a9149af61346ce0aa2dffcf697352b4b704c84d\
                         cbaff87",
                "reqSigs" : 1,
                "type" : "scripthash",
                "addresses" : [
                    "2N7NaqSKYQUeM8VNgBy8D9xQQbiA8yiJayk"
                ]
            }
        }
    ]
}
 
> UTXO_VOUT=0
> UTXO_OUTPUT_SCRIPT=a9149af61346ce0aa2dffcf697352b4b704c84dcbaff87
We use the getrawtransaction RPC with the optional second argument (true) to get the decoded transaction we just created with spendtoaddress. We choose one of the outputs to be our UTXO and get its output index number (vout) and pubkey script (scriptPubKey).

> bitcoin-cli -regtest getnewaddress
mxCNLtKxzgjg8yyNHeuFSXvxCvagkWdfGU

> NEW_ADDRESS4=mxCNLtKxzgjg8yyNHeuFSXvxCvagkWdfGU
We generate a new P2PKH address to use in the output we’re about to create.

## Outputs - inputs = transaction fee, so always double-check your math!
> bitcoin-cli -regtest createrawtransaction '''
    [
      {
        "txid": "'$UTXO_TXID'",
        "vout": '$UTXO_VOUT'
      }
   ]
   ''' '''
   {
     "'$NEW_ADDRESS4'": 9.998
   }'''

010000000175e1769813db8418fea17576694af1ff31cb2b512b7333e6eb42f0\
30d0d778720000000000ffffffff01c0bc973b000000001976a914b6f64f5bf3\
e38f25ead28817df7929c06fe847ee88ac00000000

> RAW_TX=010000000175e1769813db8418fea17576694af1ff31cb2b512b733[...]
We generate the raw transaction the same way we did in the Simple Raw Transaction subsection.

> bitcoin-cli -regtest dumpprivkey $NEW_ADDRESS1
cVinshabsALz5Wg4tGDiBuqEGq4i6WCKWXRQdM8RFxLbALvNSHw7
> bitcoin-cli -regtest dumpprivkey $NEW_ADDRESS3
cNmbnwwGzEghMMe1vBwH34DFHShEj5bcXD1QpFRPHgG9Mj1xc5hq

> NEW_ADDRESS1_PRIVATE_KEY=cVinshabsALz5Wg4tGDiBuqEGq4i6WCKWXRQd[...]
> NEW_ADDRESS3_PRIVATE_KEY=cNmbnwwGzEghMMe1vBwH34DFHShEj5bcXD1Qp[...]
We get the private keys for two of the public keys we used to create the transaction, the same way we got private keys in the Complex Raw Transaction subsection. Recall that we created a 2-of-3 multisig pubkey script, so signatures from two private keys are needed.

Warning icon Reminder: Users should never manually manage private keys on mainnet. See the warning in the complex raw transaction section.

> bitcoin-cli -regtest signrawtransaction $RAW_TX '''
    [
      {
        "txid": "'$UTXO_TXID'", 
        "vout": '$UTXO_VOUT', 
        "scriptPubKey": "'$UTXO_OUTPUT_SCRIPT'", 
        "redeemScript": "'$P2SH_REDEEM_SCRIPT'"
      }
    ]
    ''' '''
    [
      "'$NEW_ADDRESS1_PRIVATE_KEY'"
    ]'''
{
    "hex" : "010000000175e1769813db8418fea17576694af1ff31cb2b512\
             b7333e6eb42f030d0d7787200000000b5004830450221008d5e\
             c57d362ff6ef6602e4e756ef1bdeee12bd5c5c72697ef1455b3\
             79c90531002202ef3ea04dfbeda043395e5bc701e4878c15baa\
             b9c6ba5808eb3d04c91f641a0c014c69522103310188e911026\
             cf18c3ce274e0ebb5f95b007f230d8cb7d09879d96dbeab1aff\
             210243930746e6ed6552e03359db521b088134652905bd2d154\
             1fa9124303a41e95621029e03a901b85534ff1e92c43c74431f\
             7ce72046060fcf7a95c37e148f78c7725553aeffffffff01c0b\
             c973b000000001976a914b6f64f5bf3e38f25ead28817df7929\
             c06fe847ee88ac00000000",
    "complete" : false
}
 
> PARTLY_SIGNED_RAW_TX=010000000175e1769813db8418fea17576694af1f[...]
We make the first signature. The input argument (JSON object) takes the additional redeem script parameter so that it can append the redeem script to the signature script after the two signatures.

> bitcoin-cli -regtest signrawtransaction $PARTLY_SIGNED_RAW_TX '''
    [
      {
        "txid": "'$UTXO_TXID'",
        "vout": '$UTXO_VOUT',
        "scriptPubKey": "'$UTXO_OUTPUT_SCRIPT'", 
        "redeemScript": "'$P2SH_REDEEM_SCRIPT'"
      }
    ]
    ''' '''
    [
      "'$NEW_ADDRESS3_PRIVATE_KEY'"
    ]'''
{
    "hex" : "010000000175e1769813db8418fea17576694af1ff31cb2b512\
             b7333e6eb42f030d0d7787200000000fdfd0000483045022100\
             8d5ec57d362ff6ef6602e4e756ef1bdeee12bd5c5c72697ef14\
             55b379c90531002202ef3ea04dfbeda043395e5bc701e4878c1\
             5baab9c6ba5808eb3d04c91f641a0c0147304402200bd8c62b9\
             38e02094021e481b149fd5e366a212cb823187149799a68cfa7\
             652002203b52120c5cf25ceab5f0a6b5cdb8eca0fd2f386316c\
             9721177b75ddca82a4ae8014c69522103310188e911026cf18c\
             3ce274e0ebb5f95b007f230d8cb7d09879d96dbeab1aff21024\
             3930746e6ed6552e03359db521b088134652905bd2d1541fa91\
             24303a41e95621029e03a901b85534ff1e92c43c74431f7ce72\
             046060fcf7a95c37e148f78c7725553aeffffffff01c0bc973b\
             000000001976a914b6f64f5bf3e38f25ead28817df7929c06fe\
             847ee88ac00000000",
    "complete" : true
}
 
> SIGNED_RAW_TX=010000000175e1769813db8418fea17576694af1ff31cb2b[...]
The signrawtransaction call used here is nearly identical to the one used above. The only difference is the private key used. Now that the two required signatures have been provided, the transaction is marked as complete.

> bitcoin-cli -regtest sendrawtransaction $SIGNED_RAW_TX
430a4cee3a55efb04cbb8718713cab18dea7f2521039aa660ffb5aae14ff3f50
We send the transaction spending the P2SH multisig output to the local node, which accepts it.