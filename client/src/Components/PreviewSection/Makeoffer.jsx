import React, { useState } from "react";
import background from "../../assets/AuctionroomImages/Rectangle.png";
import PrimaryButton from "../Common/PrimaryButton";
import { RxCross2 } from "react-icons/rx";
import { useToast } from "../../context/ToastContext";
import api from "../../utils/api";
import { useAuth0 } from "@auth0/auth0-react";

const Makeoffer = ({ id, setshow, getProjectOffers, projectOwner, minPrice, userCredits }) => {
  const { user } = useAuth0();
  const [Amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const clickHandler = async () => {
    const offerAmount = Number(Amount);
    
    // 1. Valid Number Check
    if (!Amount || isNaN(offerAmount) || offerAmount <= 0) {
      showToast("Please enter a valid amount greater than 0", "yellow");
      return;
    }

    // 2. Self-Bidding Check
    if (user?.email === projectOwner) {
      showToast("You cannot place an offer on your own project!", "red");
      return;
    }

    // 3. Minimum Price Check
    if (offerAmount < minPrice) {
      showToast(`Offer must be at least ₹${minPrice}`, "yellow");
      return;
    }

    // 4. Balance Check (1 INR = 100 Credits)
    const requiredCredits = offerAmount * 100;
    if (userCredits < requiredCredits) {
      showToast(`Insufficient balance! Your current balance is ${userCredits} credits.`, "red");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/project/offers", {
        email: user.email,
        offer: Amount,
        projectID: id,
      });

      showToast("Offer placed successfully!", "green");
      setshow(false);
      if (getProjectOffers) getProjectOffers();
    } catch (error) {
      showToast(error.response?.data || error.message || "Failed to place offer", "red");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center relative max-w-lg w-full text-white rounded-[32px] shadow-2xl overflow-hidden backdrop-blur-2xl bg-[#0a0b1e]/95 border border-white/10 animate-in fade-in zoom-in duration-300">
      <button 
        className="absolute top-6 right-6 text-white/40 hover:text-white transition-all z-50 p-2 hover:bg-white/10 rounded-full"
        onClick={() => setshow(false)}
      >
        <RxCross2 size={20} />
      </button>

      <div className="flex flex-col items-start gap-8 w-full p-8 md:p-10 z-20 relative">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white tracking-tight">Place an Offer</h2>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Connect with the architect</p>
        </div>

        <div className="w-full space-y-6">
          <div className="w-full px-6 py-5 rounded-3xl bg-white/5 border border-white/10 group focus-within:border-[#0CA3E7]/50 transition-all shadow-inner">
            <p className="font-black text-[10px] uppercase tracking-[0.2em] text-[#0CA3E7] mb-3">Bid Amount (INR)</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-gray-600">&#8377;</span>
              <input
                value={Amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                autoFocus
                className="bg-transparent w-full outline-none text-2xl font-black text-white placeholder:text-gray-800"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col w-full gap-3">
          <PrimaryButton
            label="Confirm Bid"
            isLoading={isLoading}
            className="w-full !py-5 !rounded-2xl text-base shadow-lg shadow-[#0CA3E7]/20"
            onClick={clickHandler}
          />
          <button 
            onClick={() => setshow(false)}
            className="text-gray-500 hover:text-white transition-all font-bold text-xs py-3 rounded-xl hover:bg-white/5 uppercase tracking-widest"
          >
            Cancel Transaction
          </button>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-br from-[#0CA3E7]/10 via-transparent to-transparent pointer-events-none"></div>
      <img
        className="absolute inset-0 w-full h-full object-cover opacity-[0.03] pointer-events-none grayscale"
        alt=""
        src={background}
      />
    </div>
  );
};

export default Makeoffer;
