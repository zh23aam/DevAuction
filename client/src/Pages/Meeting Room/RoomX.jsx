import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { useAuth0 } from "@auth0/auth0-react";
import { useSocket } from "../../context/SocketProvider";
import GradientBtn from "../../Components/Buttons/GradientBtn";
import PrimaryButton from "../../Components/Common/PrimaryButton";
import { IoIosArrowDown } from "react-icons/io";
import { FaCoins } from "react-icons/fa";
import api from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import { ZEGO_APP_ID, ZEGO_SERVER_SECRET } from "../../utils/constants";
import { formatNumber } from "../../utils/helpers";

const RoomPage = () => {
  // const zpInstance = useRef(null);
  const [showBidSection, setShowBidSection] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [userCreditsLeft, setUserCreditsLeft] = useState(0);
  const navigate = useNavigate();
  const socket = useSocket();
  const { roomID } = useParams();
  const { user } = useAuth0();
  const [amount, setAmount] = useState("");
  const [bidData, setBidData] = useState({ data: { Amt: 0 } });
  const [showAnimation, setShowAnimation] = useState(false);
  const videoContainerRef = useRef(null); // Add useRef for the video container
  const [host, setHost] = useState(false);
  const { showToast } = useToast();
  const [zp, setZp] = useState(null); //related to zegocloud

  setTimeout(() => {
    setShowContent(true);
  }, 5000);


  useEffect(() => {
    socket.emit("room:connect", {
      roomID,
    });
  }, [socket]);

  function updateZPState(zp){
    setZp(zp);
  }

  const myMeeting = async (element) => {
    const appID = ZEGO_APP_ID;
    const serverSecret = ZEGO_SERVER_SECRET;
    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomID,
      Date.now().toString(),
      user.given_name || "User"
    );
    // Create instance object from Kit Token.
    const zp = ZegoUIKitPrebuilt.create(kitToken);
    // setZp(zp);
    updateZPState(zp);
    // start the call
    zp.joinRoom({
      container: element,
      scenario: {
        mode: ZegoUIKitPrebuilt.VideoConference,
      },
      onJoinRoom: () => {
        // console.log("kuchh to mila: ", e);
        console.log("join ho gye hai");
      },
      onLeaveRoom: () => {
        console.log("main ja raha hu");
        navigate("/homepage/dashboard");
        zp.destroy();
        console.log("destory kr diya hai");
      },
    });
  };

  useEffect(() => {
    if (videoContainerRef.current) {
      myMeeting(videoContainerRef.current);
    }
  }, [videoContainerRef]);

  function closeRoom() {
    socket.emit("roomClose", {
      roomID,
    });
  }

  async function getHost() {
    console.log(user.email);
    // let resData;
    try {
      const resData = await api.post("/rooms/getHost", {
        roomID,
        email: user.email,
      });

      console.log(resData);
      if (resData.Owner == user.email) {
        setHost(true);
      }
      setUserCreditsLeft(resData.Credits/100);
    } catch (error) {
      console.log(error);
    }
    // return resData;
  }

  async function getLatestBidAmount() {
    try {
      const resData = await api.post("/rooms/getLatestBid", { roomID });
      console.log(resData);
      setBidData(() => {
        return {
          data: {
            Amt: resData.highestBid,
            img: resData.picture,
            name: resData.name,
          },
        };
      });
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getHost();
    getLatestBidAmount();
  }, [user]);

  function speak(text) {
    // const text = document.getElementById('text').value;
    const speechSynthesisUtterance = new SpeechSynthesisUtterance(text);

    // Optional: set voice, pitch, rate
    speechSynthesisUtterance.voice = speechSynthesis.getVoices()[0];
    speechSynthesisUtterance.pitch = 1; // 0 to 2
    speechSynthesisUtterance.rate = 1; // 0.1 to 10

    // Speak the text
    window.speechSynthesis.speak(speechSynthesisUtterance);
  }

  useEffect(() => {
    socket.on("on:bid", (data) => {
      console.log("kuchh to aaya");
      console.log(data);
      setBidData(data);
      setShowAnimation(true);
      setTimeout(() => {
        setShowAnimation(false);
      }, 1000);
      speak(`${data.data.name} has bid of ${data.data.Amt} Rupees`);
    });
    socket.on("roomClose", (data) => {
      console.log(data);
      api.post("/rooms/sendMailToBider", { roomID }).catch(err => {
        console.error("Failed to send mail:", err);
      });
      showToast("Thankyou for joining", "green");
      // console.log(zp);
      // navigate("/homepage/dashboard");
      navigate('/homepage/dashboard');
      if (videoContainerRef.current) {
        videoContainerRef.current.leaveRoom();
        ZegoUIKitPrebuilt.destroy();
      }
      // setTimeout(() => {
      // }, 5000);
    });
    return () => {
      socket.off("on:bid");
      socket.off("roomClose");
    };
  }, [roomID, user]);

  async function SendBidToBackEnd() {
    try {
      await api.post("/rooms/bids", {
        roomId: roomID,
        email: user.email,
        bid: amount,
      });
    } catch (error) {
      console.log(error);
    }
  }

  function SendBid() {
    if (bidData.data.Amt - amount >= 0) {
      speak("Your bid should be higher than previous bid!");
      showToast("Are thoda sharam karo (Bid amount should be greater than previous bid placed!)", "red");
      return;
    }

    if (amount - userCreditsLeft > 0) {
      speak("Your bid amount can't be more than your credits!");
      showToast("Your bid amount can't be more than your credits!", "red");
      return;
    }

    setAmount("");
    setShowBidSection(false);
    // console.log(localStorage.getItem("userCredits") - amount);
    socket.emit("on:bid", {
      email: user.email,
      roomID,
      Amt: amount,
      name: user.given_name,
      img: user.picture,
    });
    SendBidToBackEnd();
  }

  const handleInputChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and remove any non-numeric characters
    const sanitizedValue = value.replace(/[^0-9]/g, "");
    setAmount(sanitizedValue);
  };

  return (
    <div
      className="room-page"
      style={{ height: "100vh", width: "100vw", overflow: "hidden" }}
    >
      <div
        ref={videoContainerRef}
        className="video-container relative"
        style={{ height: "100%", width: "100%" }}
      />
      {showContent && (
        <div className="absolute z-50 top-6 left-6 flex flex-col sm:flex-row gap-6 items-start">
          {/* Bid Control Section */}
          <div
            className={`shadow-2xl h-fit bg-[#0f1325]/80 backdrop-blur-md rounded-2xl border border-white/10 transition-all duration-500 relative ${
              showBidSection ? "flex flex-col gap-4 items-center w-[220px]" : "w-fit"
            }`}
            style={{ padding: showBidSection ? "1.5rem" : "0.5rem 2.5rem 0.5rem 1rem" }}
          >
            <IoIosArrowDown
              className={`absolute right-3 top-1/2 -translate-y-1/2 transition-all duration-500 cursor-pointer text-[#0CA3E7] hover:text-white ${
                showBidSection ? "rotate-180 !top-5 !translate-y-0" : ""
              }`}
              size="1.2rem"
              onClick={() => setShowBidSection(!showBidSection)}
            />
            
            <div
              className={`z-10 flex items-center justify-center gap-3 transition-all duration-500 ${
                showAnimation ? "wiggleAnimation" : ""
              } ${showBidSection ? "flex-col mb-2" : ""}`}
            >
              <div className="relative">
                <img
                  src={bidData?.data.img || user?.picture}
                  className="w-10 h-10 rounded-full border border-[#0CA3E7]/40 p-0.5"
                  alt={bidData ? bidData?.data.name + "'s img" : ""}
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f1325] animate-pulse"></div>
              </div>
              
              <div className="flex flex-col">
                <div className="bidAmt text-2xl font-bold text-white tracking-tight flex items-center gap-1">
                  <span className="text-[#0CA3E7] text-lg">₹</span>
                  {bidData ? formatNumber(bidData?.data.Amt) : 0}
                </div>
                <div
                  className={`name text-[10px] font-bold uppercase tracking-widest text-gray-500 transition-all duration-300 ${
                    showBidSection ? "text-center mt-1" : "hidden sm:block"
                  }`}
                >
                  {bidData ? bidData?.data.name : "Top Bidder"}
                </div>
              </div>
            </div>

            {showBidSection && (
              <>
                <div className="w-full flex flex-col gap-1.5 mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 ml-1">Your Bid</label>
                  <input
                    type="number"
                    className="rounded-xl px-4 py-2.5 outline-none bg-black/40 border border-white/10 text-white text-sm focus:border-[#0CA3E7]/40 focus:bg-black/60 transition-all shadow-inner w-full"
                    placeholder="Min 100"
                    value={amount}
                    onChange={handleInputChange}
                  />
                </div>
                <GradientBtn
                  onClick={SendBid}
                  className="w-full mt-2 animate-in fade-in slide-in-from-top-4 duration-500"
                  placeholder={"Place Bid"}
                />
              </>
            )}
          </div>

          {/* Status & Credits Section */}
          <div className="flex flex-col gap-4 items-center justify-center h-fit animate-in fade-in slide-in-from-left duration-700">
            {host && (
              <PrimaryButton
                label="End Auction"
                variant="danger"
                onClick={closeRoom}
                className="flex-col !gap-1 min-w-[100px] !rounded-2xl"
                icon={() => (
                  <div className="w-2 h-2 rounded-full bg-red-500 group-hover:bg-white animate-pulse mb-1"></div>
                )}
              />
            )}
            
            <div
              className={`creditsLeft bg-[#0f1325]/80 backdrop-blur-md border border-[#0CA3E7]/30 rounded-2xl p-4 flex flex-col items-center gap-1 min-w-[120px] shadow-2xl transition-all ${
                Number(userCreditsLeft) <= 100 ? "border-red-500/50" : ""
              }`}
              title="Your remaining credits"
            >
              <div className="flex items-center gap-2 text-[#0CA3E7]">
                <FaCoins size="0.9rem" />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Credits Left</span>
              </div>
              <span className={`text-xl font-bold ${Number(userCreditsLeft) <= 100 ? "text-red-400" : "text-white"}`}>
                <span className="text-sm mr-1 opacity-60">₹</span>
                {formatNumber(userCreditsLeft)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomPage;
