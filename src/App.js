/* eslint-disable */
import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";
import TextField from '@material-ui/core/TextField';

export default function App() {
  // Store the user's account as a state variable
  const [currAccount, setCurrentAccount] = React.useState("");
  const [currWaveCount, setCurrentWaveCount] = React.useState(0);
  const [allWaves, setAllWaves] = React.useState([]);
  const [message, setMessage] = React.useState("");

  const contractAddress = "0x4260566c959ac89891A7D3AC053d1772303f51c3";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = () => {
    // First make sure we have access to window.ethereum
    const { ethereum } = window;
    if(!ethereum) {
      console.log("Make sure you have Metamask!");
      return
    } else {
      console.log("We have the ethereum object!", ethereum)
    }

    // ** Try to get access to the user's wallet
    ethereum.request({ method: 'eth_accounts' })
    .then((accounts) => {
      // ** There could be multiple accounts
      if(accounts.length !== 0) {
        // ** Get the first account
        const account = accounts[0];
        console.log("Using the first authorized account:", account);

        // ** Store the account
        setCurrentAccount(account);

        // ** Get all the waves
        getAllWaves();

        // ** Get the wave count
        getWaveCount();
      } else {
        console.log("No authorized account found!");
      }
    })
  }

  const connectWallet = () => {
    const { ethereum } = window;

    if(!ethereum) {
      alert("Get Metamask!");
    }

    ethereum.request({ method: 'eth_requestAccounts' })
    .then((accounts) => {
      console.log("Connected:", accounts[0]);
      setCurrentAccount(accounts[0]);
    })
    .catch((e) => console.log(e))
  }

  const wave = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);

    let count = await waveportalContract.getTotalWaves();
    setCurrentWaveCount(count.toNumber());
    console.log("Retrieved total wave count...", count.toNumber());

    const waveTxn = await waveportalContract.wave(message, { gasLimit: 300000 });
    console.log("Mining...", waveTxn.hash);
    try {
      await waveTxn.wait();
      console.log("Mined --", waveTxn.hash);
    } catch (e) {
      console.error(e);
      alert("Your transaction failed!!");
    }

    count = await waveportalContract.getTotalWaves();
    setCurrentWaveCount(count.toNumber());
    console.log("Retrieved total wave count...", count.toNumber());
  }

  const getWaveCount = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);
    let count = await waveportalContract.getTotalWaves();
    setCurrentWaveCount(count.toNumber());
  }

  const getAllWaves = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const waveportalContract = new ethers.Contract(contractAddress, contractABI, signer);

    let waves = await waveportalContract.getAllWaves();

    let wavesCleaned = [];
    waves.forEach((wave) => {
      wavesCleaned.push({
        address: wave.waver,
        timestamp: new Date(wave.timestamp * 1000),
        message: wave.message
      })
    })

    setAllWaves(wavesCleaned);

    waveportalContract.on("NewWave", (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message)
      setAllWaves(oldArray => [...oldArray, {
        address: from,
        timestamp: new Date(timestamp * 1000),
        message: message
      }])
    })
  }

  React.useEffect(() => {
    checkIfWalletIsConnected();
    // eslint-disable-next-line
  }, [])

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        <span role="img" aria-label="wave">👋</span> Hey there!
        </div>

        <div className="bio">
        I am Andreas and I'm an undergraduate at USC majoring in computer science! Connect your Ethereum wallet and wave at me!
        </div>

        <div className="bio">
        Current Waves: {currWaveCount}
        </div>

        <TextField
          id="filled-full-width"
          label="Message"
          style={{ margin: 8 }}
          placeholder="Enter your message here..."
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
          variant="filled"
          onBlur={(e) => setMessage(e.target.value)}
        />

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {currAccount ? null : (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
            <div key={Object.entries(wave).toString() + index.toString()} style={{backgroundColor: "OldLace", marginTop: "16px", padding: "8px"}}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
