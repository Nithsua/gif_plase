import { ChangeEvent, useEffect, useState } from "react";
import twitterLogo from "./assets/twitter-logo.svg";
import {
  Connection,
  PublicKey,
  clusterApiUrl,
  ConfirmOptions,
} from "@solana/web3.js";
import { Idl, Program, Provider, web3 } from "@project-serum/anchor";
import "./App.css";
import idl from "./idl.json";
import keyPair from "./keypair.json";

const TWITTER_HANDLE = "nithsua";
const TWITTER_LINK = `https://twitter.com/${TWITTER_HANDLE}`;

const { SystemProgram } = web3;

const arr = Object.values((keyPair as any)._keypair.secretKey);
// @ts-ignore
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

const programID = new PublicKey(idl.metadata.address);

const network = clusterApiUrl("devnet");

const opts = {
  preflightCommitment: "processed",
};

const App = () => {
  const [walletAddress, setWalletAddress] = useState<string | undefined | null>(
    null
  );
  const [inputValue, setInputValue] = useState("");
  const [gifList, setGifList] = useState<any[] | null>(null);

  const getGifList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl as Idl, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );
      console.log(account.gifList);
      setGifList(account.gifList);
    } catch (error) {
      console.log("Error in getGifList: ", error);
      setGifList(null);
    }
  };

  const checkIfPhantomInstalled = async () => {
    try {
      if ("solana" in window) {
        // @ts-ignore
        const solana = window.solana as any;
        if (solana.isPhantom) {
          console.log("Using Phantom Wallet");
          solana.connect().then((value: any) => {
            console.log("connected with Wallet: ", value.publicKey.toString());
            setWalletAddress(value.publicKey.toString());
            return value;
          });
        }
      } else {
        alert("Phantom Wallet is not Installed");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const onLoad = async () => {
      await checkIfPhantomInstalled();
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (walletAddress) {
      console.log("fetching gif list...");
      getGifList();
    }
  }, [walletAddress]);

  const connectWallet = async () => {};

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const getProvider = () => {
    const connection = new Connection(
      network,
      opts.preflightCommitment as ConfirmOptions
    );
    const provider = new Provider(
      connection,
      // @ts-ignore
      window.solana,
      opts.preflightCommitment as ConfirmOptions
    );

    return provider;
  };

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl as Idl, programID, provider);
      console.log("ping");
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getGifList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  const sendGif = async () => {
    if (inputValue.length) {
      console.log("Gif link: ", inputValue);
      try {
        const provider = getProvider();
        const program = new Program(idl as Idl, programID, provider);

        await program.rpc.addNewGif(inputValue, {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
          },
        });
        console.log("GIF successfully sent to program", inputValue);

        await getGifList();
      } catch (error) {
        console.log("Error sending GIF:", error);
      }
      setInputValue("");
    } else {
      console.log("Field is empty");
    }
  };

  const renderNotConnectedButton = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button
            className="cta-button submit-gif-button"
            onClick={createGifAccount}
          >
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      );
    } else {
      return (
        <div className="connected-container">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              sendGif();
            }}
          >
            <input
              type="text"
              placeholder="Enter gif link!"
              value={inputValue}
              onChange={handleInputChange}
            />
            <button type="submit" className="cta-button submit-gif-button">
              Submit
            </button>
          </form>
          <div className="gif-grid">
            {gifList.map((gif) => (
              <div className="gif-item" key={gif}>
                <img src={gif.gifLink} alt={gif} />
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header">🖼 GIF Portal</p>
          <p className="sub-text">
            View your GIF collection in the metaverse ✨
          </p>
          {!walletAddress && renderNotConnectedButton()}
          {walletAddress && renderConnectedContainer()}
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={TWITTER_LINK}
            target="_blank"
            rel="noreferrer"
          >{`built by @${TWITTER_HANDLE}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;
