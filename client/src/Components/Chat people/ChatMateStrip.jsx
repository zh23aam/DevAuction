import React from "react";
import logo from "../../../public/vite.svg";
import { IoCheckmarkDoneSharp } from "react-icons/io5";
import Avatar from "../Common/Avatar";

export default function ChatMateStrip({ imgSrc, userName, lastMessage, lastMessageAt, onClick }) {
  const formatTime = (at) => {
    if (!at) return "";
    const date = new Date(at);
    const now = new Date();
    
    // Check if same day
    const isToday = date.toDateString() === now.toDateString();
    
    // Check if yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (isYesterday) {
      return "Yesterday";
    }
    
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const getMessageDisplay = (msg) => {
    if (!msg) return "";
    if (msg.startsWith("[PROJECT_MENTION]")) return "📂 Shared a project";
    return msg;
  };

  return (
    <div
      className="chatStrip min-h-[72px] flex items-center gap-4 cursor-pointer hover:bg-white/5 transition-colors p-3 rounded-xl group"
      style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}
      onClick={onClick}
    >
      <Avatar src={imgSrc} name={userName} size="sm" />
      <div className="stripDetails flex-1 flex flex-col justify-center overflow-hidden">
        <div className="flex justify-between items-center w-full">
          <div className="name text-sm font-bold text-white truncate group-hover:text-[#0CA3E7] transition-colors">{userName || "No name"}</div>
          <div className="time text-[10px] text-white/30 font-medium whitespace-nowrap ml-2">
            {formatTime(lastMessageAt)}
          </div>
        </div>
        <div className="latestMsg text-[11px] text-white/50 truncate mt-0.5 font-medium pr-2">
          {getMessageDisplay(lastMessage)}
        </div>
      </div>
    </div>
  );
}
