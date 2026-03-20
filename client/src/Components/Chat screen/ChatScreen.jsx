import React, { useEffect, useState, useRef } from "react";
import ChatScreenHeader from "./ChatScreenHeader";
import ChatScreenFooter from "./ChatScreenFooter";
import ChatBtn from "./ChatBtn";
import logo from "../../assets/LandingPage Images/logo remove background.svg";
import api from "../../utils/api";
import useChatLogic from "../../hooks/useChatLogic";
import ProjectSelectionModal from "./ProjectSelectionModal";
import { useAuth0 } from "@auth0/auth0-react";
import { useSocket } from "../../context/SocketProvider";

const ChatScreen = React.memo(({ selectedUser, myEmail, showChats, setShowChats }) => {
  const [msgs, setMsgs] = useState({ myMessages: [], senderMessages: [] });
  const [showProjectModal, setShowProjectModal] = useState(false);
  const { user } = useAuth0();
  const socket = useSocket();
  const messagesContainerRef = useRef(null);
  
  const processedMessages = useChatLogic(msgs);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [processedMessages]);

  const getMsgs = async () => {
    if (!selectedUser?.email) return;
    try {
      const userMsgs = await api.post("/profile/chats", {
        me: myEmail,
        other: selectedUser.email,
      });
      if (userMsgs) setMsgs(userMsgs);
    } catch (error) {
      console.error("Fetch Messages Error:", error);
    }
  };

  useEffect(() => {
    getMsgs();
  }, [selectedUser]);

  const handleProjectSelect = async (project) => {
    const projectData = {
      id: project.ProjectID,
      title: project.Title,
      image: project.Image || project.image,
      owner: project.Owner || project.owner
    };
    
    const projectMsg = `[PROJECT_MENTION]${JSON.stringify(projectData)}`;
    
    socket.emit("user:message", {
      from: user.email,
      to: selectedUser.email,
      message: projectMsg,
    });

    try {
      await api.post("/profile/chat/send", {
        from: user.email,
        to: selectedUser.email,
        message: projectMsg,
      });

      setMsgs(prevState => ({
        ...prevState, 
        myMessages: [...(prevState.myMessages || []), { mes: projectMsg, at: new Date().getTime() }]
      }));
      setShowProjectModal(false);
    } catch (error) {
      console.error("Send Project Error:", error);
    }
  };

  return (
    <div className={`flex-1 h-full relative overflow-hidden flex flex-col bg-[#050618]/30 ${!showChats ? "max-[1024px]:hidden" : "flex"}`}>
      {selectedUser ? (
        <div className="flex-1 flex flex-col h-full relative">
          <ChatScreenHeader
            setShowChats={setShowChats}
            imgSrc={selectedUser?.image}
            userName={selectedUser?.name}
          />
          <div
            className="msgs flex-1 overflow-auto p-4 md:p-8 flex flex-col gap-5 z-0 custom-scrollbar"
            ref={messagesContainerRef}
            key={"msgsContainer"}
          >
            {processedMessages.map((item) => {
              if (item.isDateHeader) {
                return (
                  <div className="text-[10px] w-full text-center text-white/20 uppercase tracking-[0.3em] font-bold my-6" key={item.id}>
                    {item.label}
                  </div>
                );
              }
              return (
                <ChatBtn
                  key={item.id}
                  msg={item.mes}
                  sender={item.type}
                  time={item.localTime}
                />
              );
            })}
          </div>
          <ChatScreenFooter
            receiversMailId={selectedUser.email}
            setMsgs={setMsgs}
            key={"ChatScreenFooter"}
            onToggleProjectModal={() => setShowProjectModal(!showProjectModal)}
          />
          <ProjectSelectionModal
            isOpen={showProjectModal}
            onClose={() => setShowProjectModal(false)}
            senderEmail={user?.email}
            receiverEmail={selectedUser.email}
            onSelect={handleProjectSelect}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center flex-col gap-6 select-none bg-white/[0.02]">
          <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center">
            <img src={logo} alt="DevAuction" className="w-16 h-16 object-contain opacity-20 grayscale" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-white/80">Select a Conversation</h2>
            <p className="text-white/30 text-sm max-w-[280px] mx-auto leading-relaxed">
              Choose a person from your list to see your message history and start collaborating.
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

export default ChatScreen;