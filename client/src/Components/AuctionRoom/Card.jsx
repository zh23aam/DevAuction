import React from "react";
import logo from "../../assets/AuctionroomImages/WonderKids Landing Page Exploration 1 (1).png";
import GradientBtn from "../Buttons/GradientBtn";
import { useNavigate } from "react-router-dom";
import { BsFillCalendarDateFill } from "react-icons/bs";
import { MdOutlineGavel } from "react-icons/md";
import { HiOutlineChartBar } from "react-icons/hi";

const Card = ({ roomId, date, title, imgSrc, status, bidCount, description, owner }) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (status) {
      // Closed auction → go to summary
      navigate(`/homepage/auction/${roomId}/summary`);
    } else {
      // Live auction → enter room
      navigate(`/auction/${roomId}`);
    }
  };

  return (
    <div className="group border relative w-[350px] rounded-2xl bg-[#1a1b2e]/60 backdrop-blur-md border-[#ffffff10] text-white p-3 flex flex-col gap-3 hover:scale-[1.02] transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-300" />

      {/* Status Badge */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
        <span className={`flex h-2 w-2 rounded-full ${!status ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
        <span className="text-[10px] font-bold uppercase tracking-wider">
          {!status ? "Live" : "Closed"}
        </span>
      </div>

      {/* Image */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900/50">
        <img
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          alt={title}
          src={imgSrc || logo}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1b2e] via-transparent to-transparent opacity-60" />
        {/* Closed overlay hint */}
        {status && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="bg-black/60 backdrop-blur-sm rounded-xl px-3 py-1.5 flex items-center gap-2 border border-white/10">
              <HiOutlineChartBar className="text-yellow-400 text-sm" />
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">View Summary</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1 px-1">
        <h3 className="text-lg font-bold line-clamp-1 group-hover:text-blue-400 transition-colors">
          {title || "Untitled Auction"}
        </h3>
        <p className="text-xs text-gray-400 line-clamp-2 h-8 leading-relaxed mb-1">
          {description || "No description provided for this auction room."}
        </p>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">
            {owner?.charAt(0).toUpperCase() || "H"}
          </div>
          <span className="text-[10px] text-gray-400 font-medium truncate">
            Host: {owner || "anonymous@devauction.com"}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex w-full justify-between items-center px-1 text-[11px] font-medium text-gray-300">
        <div className="flex gap-2 items-center bg-white/5 px-2 py-1 rounded-lg">
          <BsFillCalendarDateFill className="text-blue-400" />
          <span>{date || "—"}</span>
        </div>
        <div className="flex gap-2 items-center bg-white/5 px-2 py-1 rounded-lg">
          <MdOutlineGavel className="text-blue-400" />
          <span className="text-blue-400 font-bold">{bidCount || 0}</span>
          <span className="text-gray-400 uppercase tracking-tighter">Bids</span>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-1">
        <GradientBtn
          placeholder={status ? "View Summary" : "Enter Auction"}
          className="w-full text-sm py-2.5 font-bold rounded-xl"
          onClick={handleAction}
        />
      </div>
    </div>
  );
};

export default Card;