import React, { useState, useEffect, useContext } from 'react';
import AirdropImg from '../assets/airdropImage.svg';
import AirdropImg2 from '../assets/airdropImage2.svg';
import { useLocation, useNavigate } from 'react-router-dom';
import { DataContext } from '../context/DataContext';
import { motion } from 'framer-motion';
import ClipLoader from "react-spinners/ClipLoader";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Airdrop() {

  const [twitterAuthCode, setTwitterAuthCode] = useState(null);
  const [user, setUser] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const { search } = useLocation();
  const { connectWallet, signer, accountAddress } = useContext(DataContext);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("search - ", search);
    const query = new URLSearchParams(search);
    const twitterCode = query.get('userId');
    console.log("twitterAuthCode - ", twitterCode);

    if (twitterCode) {
      console.log("setting twitter code");
      setTwitterAuthCode(twitterCode.trim());
    } else {
      setTwitterAuthCode(null);
    }
  }, [search]);

  useEffect(() => {
    if (accountAddress && accountAddress.length > 0) {
      try {
        fetch(`${process.env.REACT_APP_API_URL}user/${accountAddress}`)
          .then(response => response.json())
          .then(data => setUser(data.output))
          .catch(err => console.log(err));

        console.log(user);
      } catch (err) {
        console.log("could not fetch user details")
      }
    }
  }, [accountAddress]);

  const twitterAuth = async () => {
    fetch(`${process.env.REACT_APP_API_URL}twitter-login`)
      .then(response => response.json())
      .then(data => window.open(data.url,"_self"));
  }

  const linkWalletX = async () => {
    setLinkLoading(true);
    if (!twitterAuthCode) {
      toast.error("Please connect twitter first");
      setLinkLoading(false);
      return;
    }
    if (!accountAddress) {
      toast.error("Please connect wallet first");
      setLinkLoading(false);
      return;
    }

    const payload = {
      "address": await signer.getAddress(),
      "signature": await signer.signMessage("Trustdrops login"),
      "userId": twitterAuthCode
    }

    fetch(`${process.env.REACT_APP_API_URL}link-twitter`, {
      method: 'post',
      headers: {'Content-Type':'application/json', 'x-api-key':'token'},
      body: JSON.stringify(payload)
    }).then(async (res) => {
      const resp =  await res.json();
      if (resp.message == "Linked") {
        setUser({approved: true});
        toast("You received 30 MAND", {icon: "🚀"});
      } else if (resp.message) {
        toast.error(resp.message);
      } else {
        navigate("/airdrop", { replace: true });
        toast.error("Could not link twitter, please refresh and try again!");
      }
      console.log("linking data reps - ", res.body);
      setLinkLoading(false);
    }).catch((err) => {
      setLinkLoading(false);
    });
  }

  return (
    <motion.main
      initial={{ y: -5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }}
    >
      <div className=' flex  justify-center  h-[90vh]  bg-black   text-white font-mono'>
        <div className='left-contianer w-[60%]  pl-[5%] flex flex-col gap-6  mt-10'>
          <div className='topLeftContainer '>
            <div className='small-text  text-[16px] text-slate-400'>
              YOU'RE ALMOST THERE
            </div>
            <div className='Large-text text-[32px]'>To claim your airdrop:</div>
          </div>
          <div className='bottomContainer bg-airdrop-gradient px-8 py-8 flex flex-col '>
            <div className='flex justify-between  '>
              <div className='flex gap-2 items-center '>
                <div className='sno px-3 py-1 text-[16px]  bg-black rounded-full'>
                  1
                </div>
                <div className='text-container  text-black'>
                  Connect with twitter/X
                </div>
              </div>
              <button className='flex justify-center items-center button-container bg-black px-4 py-2 text-center  w-[200px]' disabled={(twitterAuthCode && twitterAuthCode.length>0) || (user && user.approved)} onClick={twitterAuth}>
                {twitterAuthCode || (user && user.approved) ? "✔️" : "Connect twitter"}
              </button>
            </div>
            <hr className='w-[90%] flex self-center  my-[10px] h-[0.5px] bg-black border-[0px]' />
            <div className='flex justify-between'>
              <div className='flex gap-2 items-center '>
                <div className='sno px-3 py-1 text-[16px]  bg-black rounded-full'>
                  2
                </div>
                <div className='text-container text-black'>
                  Connect your wallet
                </div>
              </div>
              <button className='button-container bg-black px-4 text-center py-2  w-[200px]' disabled={accountAddress && accountAddress.length>0} onClick={connectWallet}>
                {user && user.approved ? "✔️" :
                  accountAddress ? `${accountAddress.slice(0, 4)}....${accountAddress.slice(38, 42)}` : "Connect wallet"}
              </button>
            </div>
            <hr className='w-[90%] flex self-center  my-[10px] h-[0.5px] bg-black border-[0px]' />
            <div className='flex justify-between'>
              <div className='flex gap-2 items-center  flex-1   '>
                <div className='sno px-3 py-1 text-[16px]  bg-black rounded-full'>
                  3
                </div>
                <div className='text-container text-black'>
                  Link your wallet with twitter/X
                </div>
              </div>
              <button className='flex justify-center items-center button-container bg-black px-4 self-center py-2 text-center w-[200px]' disabled={linkLoading || (user && user.approved)} onClick={linkWalletX}>
                {!linkLoading && (user && user.approved ? "✔️" : "Link both")}
                {linkLoading && <ClipLoader color={"white"} size={25} />}
              </button>
            </div>
          </div>
          <i>*This is a testnet application. Please note that the AIRDROP tokens received are test tokens only. A similar app will be used to receive mainnet tokens on our mainnet launch</i>
        </div>
        <div className='right-container  w-[40%]  h-full '>
          <img src={AirdropImg} className='object-cover h-full'></img>
        </div>
      </div>
      <ToastContainer 
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={true}
        rtl={false}
        theme="light"
      />
    </motion.main>
  );
}

export default Airdrop;
