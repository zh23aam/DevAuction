import React, { useCallback, useEffect, useState } from "react";
import TopBar from "../../Components/Common/TopBar";
import ChatPeople from "../../Components/Chat people/ChatPeople";
import ChatScreen from "../../Components/Chat screen/ChatScreen";
import { useAuth0 } from "@auth0/auth0-react";
import { useMenuContext } from "../../context/MenuContextProvider";
import api from "../../utils/api";
import { ProgressSpinner } from "primereact/progressspinner";

import { useLocation } from "react-router-dom";

export default function Chat() {
  const { showMenu, setShowMenu } = useMenuContext();
  const { user } = useAuth0();
  const location = useLocation();
  const [selectedUser, setSelectedUser] = useState(location.state?.selectedUser || null);
  const [recentChatUsers, setRecentChatUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showChats, setShowChats] = useState(!!location.state?.selectedUser);

  const getUsersRecentChats = useCallback(async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      const result = await api.post("/profile/inbox", { email: user.email });
      const sortedUsers = (result?.data || []).sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
      setRecentChatUsers(sortedUsers);
    } catch (err) {
      console.error("Fetch Inbox Error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    getUsersRecentChats();
  }, [getUsersRecentChats]);

  return (
    <div className="chatParent h-dvh flex flex-col bg-transparent text-white">
      <TopBar 
        title="My Chats"
        subtitle="Connect and collaborate with your peers"
      />
      <div
        className="chatBody flex flex-1 relative overflow-hidden"
        style={{ 
          height: "calc(100vh - 84px)", // accounting for TopBar height roughly
          backgroundColor: "transparent"
        }}
      >
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <ProgressSpinner style={{width: '40px', height: '40px'}} strokeWidth="4" />
            <p className="text-gray-500 text-sm tracking-widest uppercase animate-pulse">Establishing Connection...</p>
          </div>
        ) : (
          <>
            <ChatPeople recentChatUsers={recentChatUsers} setSelectedUser={setSelectedUser} showChats={showChats} setShowChats={setShowChats} />
            <ChatScreen selectedUser={selectedUser} myEmail={user?.email} showChats={showChats} setShowChats={setShowChats} />
          </>
        )}
      </div>
    </div>
  );
}
