const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const SHA256 = require('crypto-js/sha256');
const secp = require("@noble/secp256k1");

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());


let privateKey1 = secp.utils.randomPrivateKey();
let privateKey2 = secp.utils.randomPrivateKey();
let privateKey3 = secp.utils.randomPrivateKey();

privateKey1 = Buffer.from(privateKey1).toString('hex');
privateKey2 = Buffer.from(privateKey2).toString('hex');
privateKey3 = Buffer.from(privateKey3).toString('hex');

let publicKey1 = secp.getPublicKey(privateKey1);
let publicKey2 = secp.getPublicKey(privateKey2);
let publicKey3 = secp.getPublicKey(privateKey3);

publicKey1 = Buffer.from(publicKey1).toString('hex');
publicKey2 = Buffer.from(publicKey2).toString('hex');
publicKey3 = Buffer.from(publicKey3).toString('hex');

publicKey1 = "0x" + publicKey1.slice(publicKey1.length - 40);
publicKey2 = "0x" + publicKey2.slice(publicKey2.length - 40);
publicKey3 = "0x" + publicKey3.slice(publicKey3.length - 40);

const balances = {
  [publicKey1]: 100,
  [publicKey2]: 100,
  [publicKey3]: 100,
}
console.log(balances)
app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {signature, recipient, amount} = req.body;

  const message = JSON.stringify({
    to: recipient,
    amount: parseInt(amount)
  })
  const messageHash = SHA256(message).toString();
  let senderPublicKey;
  let recoveredPublicKey;
  const recoveredPublicKey1 = secp.recoverPublicKey(messageHash, signature, 0).toString('hex');
  const recoveredPublicKey2 = secp.recoverPublicKey(messageHash, signature, 1).toString('hex');
  const senderPublicKey1 = "0x" + recoveredPublicKey1.slice(recoveredPublicKey1.length - 40);
  const senderPublicKey2 = "0x" + recoveredPublicKey2.slice(recoveredPublicKey2.length - 40);

  let publicKeyMatch = true;

  if(!balances[senderPublicKey1] && !balances[senderPublicKey2]) {
    console.error("Public key does not match! Make sure you are passing in the correct values!");
    publicKeyMatch = false;
  } else if (!balances[senderPublicKey1] && balances[senderPublicKey2]) {
    senderPublicKey = senderPublicKey2;
    recoveredPublicKey = recoveredPublicKey2;
  } else if (!balances[senderPublicKey2] && balances[senderPublicKey1]) {
    senderPublicKey = senderPublicKey1;
    recoveredPublicKey = recoveredPublicKey1;
  }

  console.log(senderPublicKey + " is attempting to send " + amount + " to " + recipient);


  if(publicKeyMatch) {
    balances[senderPublicKey] -= amount;
    balances[recipient] = (balances[recipient] || 0) + +amount;
    res.send({ balance: balances[senderPublicKey] });
    console.log(senderPublicKey + " has successfully sent " + amount + " to " + recipient);
    logBalances();
  } else {
    console.error("Something seems off! Make sure you are passing in the correct values!");
    logBalances();
  }
});

function logBalances() {
  console.log();
  console.log("================================== ACCOUNTS ==================================");
  console.log();
  console.log("Public Key #1: " + publicKey1 + " has a balance of " + balances[publicKey1]);
  console.log("Acct #1 Private Key: " + privateKey1);
  console.log();
  console.log("Public Key #2: " + publicKey2 + " has a balance of " + balances[publicKey2]);
  console.log("Acct #2 Private Key: " + privateKey2);
  console.log();
  console.log("Public Key #3: " + publicKey3 + " has a balance of " + balances[publicKey3]);
  console.log("Acct #3 Private Key: " + privateKey3);
  console.log();
  console.log("==============================================================================");
}


//   balances[sender] -= amount;
//   balances[recipient] = (balances[recipient] || 0) + +amount;
//   res.send({ balance: balances[sender] });
// });

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
