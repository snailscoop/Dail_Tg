// Script to generate a Verida private key
const { ethers } = require('ethers');

function generateVeridaKey() {
  const wallet = ethers.Wallet.createRandom();
  console.log('--------------------------------');
  console.log('Generated Verida/Ethereum private key:');
  console.log(wallet.privateKey);
  console.log('--------------------------------');
  console.log('Public address:');
  console.log(wallet.address);
  console.log('--------------------------------');
  console.log('Add this private key to your .env file:');
  console.log('REACT_APP_VERIDA_PRIVATE_KEY=' + wallet.privateKey);
  console.log('--------------------------------');
}

generateVeridaKey(); 