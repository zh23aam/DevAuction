import React, { useEffect, useState } from "react";
import { MdAttachment } from "react-icons/md";
import { LuCamera } from "react-icons/lu";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { MdKeyboardVoice } from "react-icons/md";
import { IoSend } from "react-icons/io5";
import AttachmentModel from "./AttachmentModel";
import EmojiPicker from "emoji-picker-react";
import CameraAccess from "./CameraAccess";
import { useAuth0 } from "@auth0/auth0-react";
import { useSocket } from "../../context/SocketProvider";
import api from "../../utils/api";

const ChatScreenFooter = React.memo(({ receiversMailId, setMsgs, onToggleProjectModal }) => {
  const socket = useSocket();
  const { user } = useAuth0();
  const [msg, setMsg] = useState("");
  const [showEmojis, setShowEmojis] = useState(false);
  const [openCamera, setOpenCamera] = useState(false);
  
  function onEmojiClickHndl(emoji) {
    setMsg((preMsg) => {
      return preMsg + emoji.emoji;
    });
  }

  const handleMessageRequest = (data) => {
    setMsgs(prevState => {
      return {
        ...prevState, 
        senderMessages: [...(prevState.senderMessages || []), data]
      };
    });
  };

  useEffect(() => {
    socket.on("user:message", handleMessageRequest);
    return () => {
      socket.off("user:message", handleMessageRequest);
    };
  }, [socket, handleMessageRequest]);

  async function sendMsg() {
    if (!msg.trim()) return;
    const userEmail = user.email;
    
    console.log("sending msg");
    socket.emit("user:message", {
      from: userEmail,
      to: receiversMailId,
      message: msg,
    });

    try {
      await api.post("/profile/chat/send", {
        from: userEmail,
        to: receiversMailId,
        message: msg,
      });

      setMsgs(prevState => {
        return {
          ...prevState, 
          myMessages: [...(prevState.myMessages || []), { mes: msg, at: new Date().getTime() }]
        };
      });
      setMsg("");
    } catch (error) {
      console.error("Send Message Error:", error);
    }
  }

  return (
    <div className="flex gap-4 items-center w-full p-6 bg-white/[0.03] border-t border-white/5 relative z-10">
      <div
        className={
          "absolute md:right-20 bottom-20 right-0 " +
          ` ${showEmojis ? "block" : "hidden"}`
        }
      >
        <EmojiPicker
          className="h-40"
          height="350px"
          onEmojiClick={onEmojiClickHndl}
        />
      </div>
      <div
        className="msgInterface flex items-center p-4 rounded-xl flex-1 gap-4 bg-[#05081B]/50 backdrop-blur-md"
        style={{ border: "1px solid rgba(255, 255, 255, 0.1)" }}
      >
        <MdAttachment
          size="1.5rem"
          className="rotate-[120deg] cursor-pointer hover:text-[#0CA3E7] transition-colors active:scale-95"
          onClick={() => {
            setShowEmojis(false);
            onToggleProjectModal();
          }}
        />
        <input
          type="text"
          className="w-full bg-inherit text-white h-fit outline-none"
          placeholder="Your thoughts here..."
          value={msg}
          onFocus={() => {
            setShowEmojis(false);
          }}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMsg()}
        />
        <MdOutlineEmojiEmotions
          size="1.5rem"
          className="cursor-pointer active:bg-white active:text-gray-400 rounded-full"
          onClick={() => {
            setShowEmojis(!showEmojis);
          }}
        />
        {/* <LuCamera
          size="1.5rem"
          onClick={() => setOpenCamera(!openCamera)}
          className="cursor-pointer"
        /> */}
      </div>
      <div className="chatAction">
        {/* {msg.length == 0 ? (
          <MdKeyboardVoice
            size="3.4rem"
            className="p-4 bg-[#66bee3] rounded-xl cursor-pointer active:scale-95"
          />
        ) : ( */}
          <IoSend
            size="3.4rem"
            className="p-4 bg-[#66bee3] rounded-xl cursor-pointer active:scale-95"
            onClick={msg.trim() !== "" ? sendMsg : ""}
          />
        {/* )} */}
      </div>
    </div>
  );
});

export default ChatScreenFooter;