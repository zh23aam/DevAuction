import React, { useState } from "react";
import logo from "../../../public/Icons/Logo.png";
import { SlOptionsVertical } from "react-icons/sl";
import { IoChatbubbleEllipsesSharp } from "react-icons/io5";
import { RxCross2 } from "react-icons/rx";
import {useLocation} from "react-router-dom"

import Avatar from "../Common/Avatar";

export default function ChatScreenHeader({ imgSrc, userName, setShowChats }) {
  const location = useLocation();
  return (
    <div className="h-16 w-full flex px-8 select-none flex-col flex-shrink-0 bg-white/[0.03] border-b border-white/5 relative z-10 transition-all">
        <div className="mainContent flex items-center justify-between w-full flex-1">
          <div className="headerleft flex gap-4 items-center">
            <Avatar src={imgSrc} name={userName} size="sm" className="border-2 border-[#0CA3E7]/30 p-[2px]" />
            <div className="nameAndStatus">
              <div className="userName sm:text-2xl text-lg font-bold tracking-tight">{userName || "Someone"}</div>
            </div>
          </div>
          <div className="right flex gap-4 items-center">
            {/* <SlOptionsVertical /> */}
            <RxCross2 size="1.5rem" className={`cursor-pointer hover:text-red-500 transition-colors ${location.pathname == "/homepage/chats" && window.innerWidth > 1024 ? "opacity-0" : "opacity-100"}`} onClick={() => setShowChats(false)}  />
          </div>
        </div>
      </div>
  );
}
