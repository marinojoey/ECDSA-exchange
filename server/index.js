const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');


// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());


let usersArray = []
let userFactory = (user, pub, pri) => {
  return {user, pub, pri}
}

// Generates key pairs, assigns them to users and then adds the users to usersArray
for (let i=0; i<3; i++) {
  let key = ec.genKeyPair()
  let publicKey = key.getPublic().encode('hex')
  let privateKey = key.getPrivate().toString(16)
  let user = userFactory(i+1, publicKey, privateKey)
  usersArray.push(user)
}
// Assigns userArray index's to corresponding balances
// This could be A LOT better, but i dont understand express enough
const balances = {
  [usersArray[0].user]: 100,
  [usersArray[1].user]: 1,
  [usersArray[2].user]: 750,
}

// Adds balance property to each user object
for (let i=0; i<3; i++) {
  usersArray[i].balance = (Object.values(balances))[i]
}

console.log(usersArray)

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const {sender, recipient, amount} = req.body;
  balances[sender] -= amount;
  balances[recipient] = (balances[recipient] || 0) + +amount;
  res.send({ balance: balances[sender] });
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
