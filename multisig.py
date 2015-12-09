import logging
import random
import re
import urllib2

import obelisk

# Create new private key:
#
# $ sx newkey > key1
#
# Show private secret:
#
#   $ cat key1 | sx wif-to-secret
#
# Show compressed public key:
#
#   $ cat key1 | sx pubkey
#
# You will need 3 keys for buyer, seller and arbitrer


class Multisig(object):
    def __init__(self, client, number_required, pubkeys):
        if number_required > len(pubkeys):
            raise Exception("number_required > len(pubkeys)")
        self.client = client
        self.number_required = number_required
        self.pubkeys = pubkeys
        self.log = logging.getLogger(self.__class__.__name__)

    @property
    def script(self):
        result = chr(80 + self.number_required)
        for pubkey in self.pubkeys:
            result += chr(33) + pubkey
        result += chr(80 + len(self.pubkeys))
        # checkmultisig
        result += "\xae"
        return result

    @property
    def address(self):

        raw_addr = obelisk.hash_160(self.script)
        return obelisk.hash_160_to_bc_address(raw_addr, addrtype=0x05)

    def create_unsigned_transaction(self, destination, finished_cb):
        def fetched(escrow, history):
            if escrow is not None:
                self.log.error("Error fetching history: %s", escrow)
                return
            self._fetched(history, destination, finished_cb)

        self.client.fetch_history(self.address, fetched)

    def _fetched(self, history, destination, finished_cb):
        unspent = [row[:4] for row in history if row[4] is None]
        transaction = self._build_actual_tx(unspent, destination)
        finished_cb(transaction)

    @staticmethod
    def _build_actual_tx(unspent, destination):

        # Send all unspent outputs (everything in the address) minus the fee
        transaction = obelisk.Transaction()
        total_amount = 0
        for row in unspent:
            assert len(row) == 4
            outpoint = obelisk.OutPoint()
            outpoint.hash = row[0]
            outpoint.index = row[1]
            value = row[3]
            total_amount += value
            add_input(transaction, outpoint)

        # Constrain fee so we don't get negative amount to send
        fee = min(total_amount, 10000)
        send_amount = total_amount - fee
        add_output(transaction, destination, send_amount)
        return transaction

    def sign_all_inputs(self, transaction, secret):
        signatures = []
        key = obelisk.EllipticCurveKey()
        key.set_secret(secret)

        for i, _ in enumerate(transaction.inputs):
            sighash = generate_signature_hash(transaction, i, self.script)
            # Add sighash::all to end of signature.
            signature = key.sign(sighash) + "\x01"
            signatures.append(signature.encode('hex'))
        return signatures

    @staticmethod
    def make_request(*args):
        opener = urllib2.build_opener()
        opener.addheaders = [(
            'User-agent',
            'Mozilla/5.0' + str(random.randrange(1000000))
        )]
        try:
            return opener.open(*args).read().strip()
        except Exception as exc:
            try:
                stripped_exc = exc.read().strip()
            except Exception:
                stripped_exc = exc
            raise Exception(stripped_exc)

    @staticmethod
    def eligius_pushtx(transaction):
        print 'FINAL TRANSACTION: %s' % transaction
        request = Multisig.make_request(
            'http://eligius.st/~wizkid057/newstats/pushtxn.php',
            'transaction=' + transaction + '&send=Push'
        )
        strings = re.findall('string[^"]*"[^"]*"', request)
        for string in strings:
            quote = re.findall('"[^"]*"', string)[0]
            if len(quote) >= 5:
                return quote[1:-1]

    @staticmethod
    def broadcast(transaction):
        raw_tx = transaction.serialize().encode("hex")
        Multisig.eligius_pushtx(raw_tx)
        # gateway_broadcast(raw_tx)
        # bci_pushtx(raw_tx)


def add_input(transaction, prevout):
    tx_input = obelisk.TxIn()
    tx_input.previous_output.hash = prevout.hash
    tx_input.previous_output.index = prevout.index
    transaction.inputs.append(tx_input)


def add_output(transaction, address, value):
    output = obelisk.TxOut()
    output.value = value
    output.script = obelisk.output_script(address)
    transaction.outputs.append(output)


def generate_signature_hash(parent_tx, input_index, script_code):
    transaction = obelisk.copy_tx(parent_tx)
    if input_index >= len(transaction.inputs):
        return None
    for tx_input in transaction.inputs:
        tx_input.script = ""
    transaction.inputs[input_index].script = script_code
    raw_tx = transaction.serialize() + "\x01\x00\x00\x00"
    return obelisk.Hash(raw_tx)


class Escrow(object):
    def __init__(self, client, buyer_pubkey, seller_pubkey, arbit_pubkey):
        pubkeys = (buyer_pubkey, seller_pubkey, arbit_pubkey)
        self.multisig = Multisig(client, 2, pubkeys)

    # 1. BUYER: Deposit funds for seller
    @property
    def deposit_address(self):
        return self.multisig.address

    # 2. BUYER: Send unsigned transaction to seller
    def initiate(self, destination_address, finished_cb):
        self.multisig.create_unsigned_transaction(
            destination_address, finished_cb)

    # ...
    # 3. BUYER: Release funds by sending signature to seller
    def release_funds(self, transaction, secret):
        return self.multisig.sign_all_inputs(transaction, secret)

    # 4. SELLER: Claim your funds by generating a signature.
    def claim_funds(self, transaction, secret, buyer_sigs):
        seller_sigs = self.multisig.sign_all_inputs(transaction, secret)
        return Escrow.complete(transaction, buyer_sigs, seller_sigs,
                               self.multisig.script)

    @staticmethod
    def complete(transaction, buyer_sigs, seller_sigs, script_code):
        for i, _ in enumerate(transaction.inputs):
            sigs = (buyer_sigs[i], seller_sigs[i])
            script = "\x00"
            for sig in sigs:
                script += chr(len(sig)) + sig
            script += "\x4c"
            assert len(script_code) < 255
            script += chr(len(script_code)) + script_code
            transaction.inputs[i].script = script
        return transaction



#################################################################################################



# MULTISIGS - PART ONE - GENERATING A MULTISIG ADDRESS & REDEEM SCRIPT
# wobine code for world bitcoin network blackboard 101
# Educational Purposes only
# Python 2.7.6 and relies on bitcoind & bitcoinrpc & wobine's github connection file
# We had to change the bitcoinrpc 'connection.py' file to add multisig support
# https://github.com/wobine/blackboard101/blob/master/wbn_multisigs_pt1_create-address.py

# from bitcoinrpc.util import *
# from bitcoinrpc.exceptions import *
# from bitcoinrpc.__init__ import *
# from bitcoinrpc.config import *
# from bitcoinrpc.proxy import *
# from bitcoinrpc.data import *
# from bitcoinrpc.connection import *


# bitcoin = connect_to_local() #creates an object called 'bitcoin' that allows for bitcoind calls

# add = dict()
# privkey = dict()
# pubkey = dict()
# mid = "\",\"" #this thing inserts these 3 characters ","


# for i in range(0, 3): #Generate three new addresses (Pub Key & Priv Key)
#     print
#     print "Brand New Address Pair: Number", i+1
    
#     add[i] = bitcoin.getnewaddress()
#     print "Compressed Public Address -",len(add[i]),"chars -", add[i]
    
#     privkey[i] = bitcoin.dumpprivkey(add[i])
#     print "Private Key -", len(privkey[i]),"chars -",privkey[i]

#     validDate = bitcoin.validateaddress(add[i]) # we need a less compressed Public Key so we have to call validateaddress to find it
#     pubkey[i] = validDate["pubkey"]
#     print "Less compressed Public Key/Address -",len(pubkey[i]),"chars -",pubkey[i]

# print
# print "For fun you can paste this into bitcoind to verify multisig address"
# print "%s%s%s%s%s%s%s" % ('bitcoind createmultisig 2 \'["',pubkey[0],mid,pubkey[1],mid,pubkey[2],'"]\'')

# print
# threeaddy = [pubkey[0],pubkey[1],pubkey[2]]
# print "The multisig address is"
# multisigaddy = bitcoin.addmultisigaddress(2,threeaddy)
# multiaddyandredeem = (bitcoin.createmultisig(2,threeaddy))
# print len(multisigaddy),"chars - ", multisigaddy
# print
# print "The redeemScript -", len(multiaddyandredeem["redeemScript"]), "chars -",multiaddyandredeem["redeemScript"]
# print
# print "Now copy all this output text and save it so you'll be ready for part two."
# print "Also, you can send a tiny amt of bitcoins to this multisig address",multisigaddy,"to fund it,"
# print "Next time we'll go through all the steps to spend from your new multisig address."

###############################################################################################

# MULTISIGS - PART TWO - SPENDING FROM A 2-of-3 MULTISIG ADDRESS
# This simple wallet works with bitcoind and will only work with 2-of-3 multisigs
# wobine code for world bitcoin network blackboard 101
# Educational Purposes only
# Python 2.7.6 and relies on bitcoind & bitcoinrpc & wobine's github connection file
# We had to change the bitcoinrpc 'connection.py' file to add multisig support
# you'll need to download our 'connection.py' file from Github & stuff it in your bitcoinrpc folder

# from bitcoinrpc.util import *
# from bitcoinrpc.exceptions import *
# from bitcoinrpc.__init__ import *
# from bitcoinrpc.config import *
# from bitcoinrpc.proxy import *
# from bitcoinrpc.data import *
# from bitcoinrpc.connection import *


# bitcoin = connect_to_local() #creates an object called 'bitcoin' that allows for bitcoind calls

# # YOU NEED AT LEAST TWO OF THE PRIVATE KEYS FROM PART ONE linked to your MULTI-SIG ADDRESS
# multisigprivkeyone = "L2M1uRgdwgCotoP8prWJYYwz2zwWgsMa9TJwqARG7nFxkpdvBSsm" #your key/brother one
# multisigprivkeytwo = "L1M2ZgjoAtDVu9uemahiZBQPwFA5Tyj4GLd1ECkDryviFrGp6m7k" #wallet service/brother two
# multisigprivkeythree = "L5PkVBzR4SdQimMsfHnRqRegJZDFJ22sGjSbfp3SsPSnVoB8vRFE" #safe deposit box/brother three
# ChangeAddress = "35Z3xG92YkW5Xo4ngQw6w5b3Ce6MDw94A8" #!!! Makes Sure to set your own personal Change Address

# SetTxFee = int(0.00005461*100000000) # Lets proper good etiquette & put something aside for our friends the miners

# unspent = bitcoin.listunspent() # Query wallet.dat file for unspent funds to see if we have multisigs to spend from

# print "Your Bitcoin-QT/d has",len(unspent),"unspent outputs"
# for i in range(0, len(unspent)):
#     print
#     print "Output",i+1,"has",unspent[i]["amount"],"bitcoins, or",int(unspent[i]["amount"]*100000000),"satoshis"
#     print "The transaction id for output",i+1,"is"
#     print unspent[i]["txid"]
#     print "The ScriptPubKey is", unspent[i]["scriptPubKey"]
#     print "on Public Address =====>>",unspent[i]["address"]

# print
# totalcoin = int(bitcoin.getbalance()*100000000)
# print "The total value of unspent satoshis is", totalcoin
# print

# WhichTrans = int(raw_input('Spend from which output? '))-1
# if WhichTrans > len(unspent): #Basic idiot check. Clearly a real wallet would do more checks.
#     print "Sorry that's not a valid output" 
# else:
#     tempaddy = str(unspent[WhichTrans]["address"])
#     print
#     if int(tempaddy[0:1]) == 1:
#         print "The public address on that account starts with a '1' - its not multisig."
#     elif int(tempaddy[0:1]) == 3:
#         print "The public address on that account is",tempaddy
#         print "The address starts with the number '3' which makes it a multisig."
#         print
#         print "All multisig transactions need: txid, scriptPubKey and redeemScript"
#         print "Fortunately all of this is right there in the bitcoind 'listunspent' json from before"
#         print
#         print "The txid is:",unspent[WhichTrans]["txid"]
#         print "The ScriptPubKey is:", unspent[WhichTrans]["scriptPubKey"]
#         print
#         print "And only multisigs have redeemScripts."
#         print "The redeemScript is:",unspent[WhichTrans]["redeemScript"]
#         print
        
#         print "You have",int(unspent[WhichTrans]["amount"]*100000000),"satoshis in this output."

#         HowMuch = int(raw_input('How much do you want to spend? '))
#         if HowMuch > int(unspent[WhichTrans]["amount"]*100000000):
#             print "Sorry not enough funds in that account" # check to see if there are enough funds.
#         else:
#             print
#             SendAddress = str(raw_input('Send funds to which bitcoin address? ')) or "1M72Sfpbz1BPpXFHz9m3CdqATR44Jvaydd" #default value Sean's Outpost
#             if SendAddress == "1M72Sfpbz1BPpXFHz9m3CdqATR44Jvaydd":
#                 print "Nice! Your chose to send funds to Sean's Outpost in Pensacola Florida."
#             print
#             Leftover = int(unspent[WhichTrans]["amount"]*100000000)-HowMuch-SetTxFee
#             print "This send to",SendAddress,"will leave", Leftover,"Satoshis in your accounts."
#             print "A tx fee of",SetTxFee,"will be sent to the miners"
#             print
#             print "Creating the raw transaction for User One - Private Key One"
#             print
            
#             rawtransact = bitcoin.createrawtransaction ([{"txid":unspent[WhichTrans]["txid"],
#                     "vout":unspent[WhichTrans]["vout"],
#                     "scriptPubKey":unspent[WhichTrans]["scriptPubKey"],
#                     "redeemScript":unspent[WhichTrans]["redeemScript"]}],{SendAddress:HowMuch/100000000.00,ChangeAddress:Leftover/100000000.00})
#             print "bitcoind decoderawtransaction", rawtransact
#             print
#             print
#             print "And now we'll sign the raw transaction -> The first user gets a 'False'"
#             print "This makes sense because in multisig, no single entity can sign alone"
#             print
#             print "For fun you can paste this FIRST signrawtransaction into bitcoind to verify multisig address"
#             print "%s%s%s%s%s%s%s%s%s%s%s%s%s" % ('bitcoind signrawtransaction \'',rawtransact,'\' \'[{"txid":"',unspent[WhichTrans]["txid"],'","vout":',
#                                       unspent[WhichTrans]["vout"],',"scriptPubKey":"',unspent[WhichTrans]["scriptPubKey"],'","redeemScript":"',
#                                       unspent[WhichTrans]["redeemScript"],'"}]\' \'["',multisigprivkeyone,'"]\'')
#             print
#             signedone = bitcoin.signrawtransaction (rawtransact,
#                     [{"txid":unspent[WhichTrans]["txid"],
#                     "vout":unspent[WhichTrans]["vout"],"scriptPubKey":unspent[WhichTrans]["scriptPubKey"],
#                     "redeemScript":unspent[WhichTrans]["redeemScript"]}],
#                     [multisigprivkeyone])
#             print signedone
#             print
#             print "In a real world situation, the 'hex' part of this thing above would be sent to the second"
#             print "user or the wallet provider. Notice, the private key is not there. It has been signed digitally"
#             print
#             print
#             print "For fun you can paste this SECOND signrawtransaction into bitcoind to verify multisig address"
#             print "%s%s%s%s%s%s%s%s%s%s%s%s%s" % ('bitcoind signrawtransaction \'',signedone["hex"],'\' \'[{"txid":"',unspent[WhichTrans]["txid"],'","vout":',
#                                       unspent[WhichTrans]["vout"],',"scriptPubKey":"',unspent[WhichTrans]["scriptPubKey"],'","redeemScript":"',
#                                       unspent[WhichTrans]["redeemScript"],'"}]\' \'["',multisigprivkeytwo,'"]\'')
#             print
#             doublesignedrawtransaction = bitcoin.signrawtransaction (signedone["hex"],
#                     [{"txid":unspent[WhichTrans]["txid"],
#                     "vout":unspent[WhichTrans]["vout"],"scriptPubKey":unspent[WhichTrans]["scriptPubKey"],
#                     "redeemScript":unspent[WhichTrans]["redeemScript"]}],
#                     [multisigprivkeytwo])
#             print doublesignedrawtransaction
#             print
#             print "You are now ready to send",HowMuch,"Satoshis to",SendAddress
#             print "And",Leftover,"Satoshis will be sent to the change account",ChangeAddress
#             print "Finally, a miner's fee of ",SetTxFee,"Satoshis will be sent to the miners"
#             print

#             ReallyNow = (raw_input('If you hit return now, you will be sending these funds from your multisig account '))
#             ReallyNow2 = (raw_input('No...REally...If you hit return now, you will be sending funds from your multisig account '))
#             print
#             print "SORRY. We won't do this. Don't want anyone to lose money playing with this code"
#             print "But if you really want to send it, just"
#             print "copy the HEX from the big block up above"
#             print "and put it in a 'bitcoind sendrawtransaction' request"
