import React from "react";
import { BsCurrencyDollar } from "react-icons/bs";
import { IoPersonSharp } from "react-icons/io5";

export default function MaxBidCont({ maxBid, Bidder }) {
  return (
    <div className="p-4 w-56 fixed top-6 right-6 hidden min-[390px]:flex flex-col gap-1 bg-[#0f1325]/80 backdrop-blur-md rounded-2xl border border-[#0CA3E7]/30 shadow-2xl z-50 animate-in slide-in-from-right duration-500">
      <div className="flex items-center justify-between mb-1">
        <p className={`text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 ${Bidder != "Opening Bid" ? "" : "hidden" }`}>Current Max Bid</p>
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      </div>
      <h1 className="flex items-center gap-2 text-3xl font-bold text-white tracking-tight">
        <span className="text-[#0CA3E7]">₹</span> {maxBid}
      </h1>
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0CA3E7] to-[#050618] flex items-center justify-center">
          <IoPersonSharp size="0.8rem" className="text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Top Bidder</span>
          <span className="text-xs text-gray-200 font-semibold truncate max-w-[120px]">{Bidder}</span>
        </div>
      </div>
    </div>
  );
}
