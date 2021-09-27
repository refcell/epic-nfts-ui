/* eslint-disable */
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/TheEpics.json";
import contractSVG from './assets/contract.svg';
import { ToastContainer, toast } from 'material-react-toastify';
import 'material-react-toastify/dist/ReactToastify.css';

// ** Immutables
const BUILDSPACE_TWITTER_HANDLE = "_buildspace";
const BUILDSPACE_TWITTER_LINK = `https://twitter.com/${BUILDSPACE_TWITTER_HANDLE}`;
const TWITTER_HANDLE = 'andreasbigger';
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;
const CONTRACT_ADDRESS = "0x0a2315A245c0E9d3F0275e0733892Ed76Aa2d6d6";
const CONTRACT_ABI = abi.abi;

export default function App() {
  const [currAccount, setCurrentAccount] = useState("");
  const [currMintCount, setCurrMintCount] = useState(0);
  const [maxMintCount, setMaxMintCount] = useState(1337);
  const [myEpicNfts, setMyEpicNfts] = useState([]);

  // ** Try to connect to wallet
  const checkIfWalletIsConnected = () => {
    const { ethereum } = window;
    if(!ethereum) {
      console.error("Make sure you have Metamask!");
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

        // ** Store the account
        setCurrentAccount(account);

        // ** Get the contract mint count info
        getMintCounts();

        // ** Set up our event listener
        setupEventListener();
      } else {
        console.error("No authorized account found!");
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

  const askContractToMintNft = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFT();

        console.log("Mining...please wait.")
        await nftTxn.wait();

        console.log(`Mined, see transaction: https://rinkeby.etherscan.io/tx/${nftTxn.hash}`);

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  // ** Refactor logic to fetch the MAX_MINT_COUNT and the current tokenId
  const getMintCounts = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const eContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    let max_count = await eContract.getMaxMintCount();
    setMaxMintCount(max_count.toNumber());
    let curr_count = await eContract.currentMintCount();
    setCurrMintCount(curr_count.toNumber());
  }

  // ** Setup our listener
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        connectedContract.on("EpicMinted", (id, from) => {
          let tokenId = id.toNumber();
          let sender = from;

          // ** Update the current minted count
          setCurrMintCount(currMintCount + 1);

          console.log("Inside Event listener - sender:", sender);
          console.log(currAccount);
          console.log("Inside Event Listener - currAccount:", currAccount);
          console.log("Inside Event Listener - tokenId:", tokenId);
          if (currAccount === sender) {
            setMyEpicNfts(oldArray => [...oldArray, {
              address: sender,
              tokenId: tokenId,
              opensea: `https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId}`
            }])
          }

          toast.success(`🦄 NFT Minted! View at: https://testnets.opensea.io/assets/${CONTRACT_ADDRESS}/${tokenId}`, {
            position: "top-left",
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            });
        });

        console.log("Setup event listener!")

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="App">
      <ToastContainer />
      <div className="container">
        <div className="header-container">
          <p className="header">
            <span role="img" aria-label="wave">⚡</span>
            <span className="gradient-text">The Epics</span>
            <img alt="Contract Logo" className="contract-logo" src={contractSVG} />
          </p>
          <p className="sub-text">
            Unique, Beautiful <span className="rainbow bg-clip-text text-transparent font-bold">Dinosaurs and Caves</span> inspired by {" "}
            <span className="loot-gradient-text">
              <a
                className="no-decoration"
                href="https://lootproject.com"
                target="_blank"
                rel="noreferrer"
              >
                Loot
              </a>
            </span>
          </p>
          <div className="bio">
            <span className="bio-text">{currMintCount}/{maxMintCount}</span> Epics have been minted!
          </div>
          {currAccount ? (
            <button
              disabled={currMintCount >= maxMintCount ? true : false}
              className="waveButton cta-button connect-wallet-button"
              onClick={askContractToMintNft}
              style={{
                opacity: currMintCount >= maxMintCount ? 0.5 : 1,
              }}
              >
              Mint an Epic!
            </button>
          ) : null}
          {currAccount ? null : (
            <button className="waveButton cta-button connect-wallet-button" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}

          {myEpicNfts.length > 0 ? (
            <p className="sub-text">
              You just minted these Epics!
            </p>
          ) : (
            currAccount ?
            (<div>
            <p className="sub-text">
              Wallet{" "}
              <a
                className="no-decoration"
                href={`https://etherscan.io/${currAccount}`}
                target="_blank"
                rel="noreferrer"
              >
                {currAccount.substring(0, 4)}..{currAccount.substring(currAccount.length - 2)}
              </a>
              {" "}hasn't minted any Epics recently!
            </p>
            <p className="sub-text">
              Mint some, and they'll show up here!
            </p>
            </div>) : null
          )}
          {myEpicNfts.map((epic, index) => {
            return (
              <div key={Object.entries(epic).toString() + index.toString()} style={{backgroundColor: "OldLace", marginTop: "16px", padding: "8px"}}>
                <div>Address: {epic.address}</div>
                <div>TokenId: {epic.tokenId.toString()}</div>
                <div><a href={epic.opensea}>View on Opensea</a></div>
              </div>
            )
          })}

        {/*
        // TODO: Gallery view using getBalance ?
        */}
        </div>
        <div className="footer-wrapper">
          <div className="footer-container text-sm">
            <p className="white-text">
              Built with ❤️️ by{" "}
              <a
                className="footer-text"
                href={TWITTER_LINK}
                target="_blank"
                rel="noreferrer"
              >
                {`@${TWITTER_HANDLE}`}
              </a>
            </p>
          </div>
          <div className="footer-container text-sm">
            {/* <img alt="Unicorn Logo" className="uni-logo" src={twitterLogo} /> */}
            <p className="white-text">
              🦄 h/t{" "}
              <a
                className="footer-text"
                href={BUILDSPACE_TWITTER_LINK}
                target="_blank"
                rel="noreferrer"
              >
                {`@${BUILDSPACE_TWITTER_HANDLE}`}
              </a>
              {" "} for the amazing course!
            </p>
          </div>
          <div className="text-sm p-5 md:p-16 white-text">
            <A href={`https://rinkeby.etherscan.io/address/${CONTRACT_ADDRESS}`}>Etherscan</A> &bull;{" "}
            <A href="https://opensea.io/collection/theepics">OpenSea</A> &bull;{" "}
            <A href="https://github.com/abigger87/epic-nfts">Contract Source</A> &bull;{" "}
            <A href="https://github.com/abigger87/epic-nfts-ui">UI Source</A> &bull;{" "}
            <A href="https://twitter.com/andreasbigger">Twitter</A> &bull;{" "}
            <span className="white-text">There's no Discord</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const A = (props) => <a className="text-blue-500 no-decoration" {...props} />;