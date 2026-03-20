import React from "react";
import { CiSearch } from "react-icons/ci";
import ChatMateStrip from "./ChatMateStrip";

export default function ChatPeople({ recentChatUsers, setSelectedUser, showChats, setShowChats }) {
  return (
    <div className={`chatLeft lg:w-[350px] border-r border-white/10 flex-col gap-4 w-full flex-shrink-0 bg-white/[0.02] ${window.innerWidth < 1024 && showChats ? "hidden" : "flex"}`}>
      <div className="p-6 flex flex-col gap-6 h-full">
        <div
          className="top h-11 w-full rounded-xl relative flex-shrink-0"
          style={{ backgroundColor: "rgba(12, 163, 231, 0.08)" }}
        >
          <CiSearch
            size="1.4rem"
            className="absolute top-1/2 -translate-y-1/2 w-fit left-4 opacity-50"
          />
          <input
            type="text"
            placeholder="Search messages..."
            className="h-11 w-full z-0 rounded-xl pl-12 bg-transparent outline-none text-sm placeholder:opacity-50"
            id="search"
          />
        </div>
        
        <div className="friends flex-1 overflow-auto custom-scrollbar pr-2">
          <div className="body">
            <div className="header text-xs font-bold uppercase tracking-[0.2em] text-white/30 mb-4 px-2">Recent Chats</div>
            <div className="flex flex-col gap-1">
              {recentChatUsers?.map((elem) => (
                <ChatMateStrip 
                  key={btoa(elem.email)} 
                  imgSrc={elem.image} 
                  userName={elem.name} 
                  lastMessage={elem.lastMessage}
                  lastMessageAt={elem.lastMessageAt}
                  onClick={() => {
                    setSelectedUser(elem); 
                    setShowChats(true);
                  }} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
