import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import GradientBtn from "../Buttons/GradientBtn";
import { RxCross2 } from "react-icons/rx";
import { GoQuestion } from "react-icons/go";
import background from "../../assets/AuctionroomImages/Rectangle.png";
import { Dropdown } from "primereact/dropdown";
import "./Auctionroom.css";
import api from "../../utils/api";
import { useToast } from "../../context/ToastContext";

const Createauction = ({ show, setshow }) => {
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const { user } = useAuth0();
  const [isLoading, setIsLoading] = useState(false);
  const fileref = useRef(null);
  const [url, seturl] = useState("");
  const [title, settitle] = useState("");
  const [date, setDate] = useState("");
  const [desc, setdesc] = useState("");
  const [fileName, setFileName] = useState("Upload Source Code");
  const { showToast } = useToast();

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName("Upload Source Code");
    }
  };

  const clickHandler = async (e) => {
    if (e) e.preventDefault();
    
    if (!title || !date || !desc) {
      showToast("Please fill all required fields", "red");
      return;
    }

    if (!fileref.current.files[0]) {
      showToast("Please upload source code file", "red");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", fileref.current.files[0]);
    formData.append("date", date);
    formData.append("title", title);
    formData.append("description", desc);
    formData.append("image", url);
    formData.append("email", user.email);

    try {
      const response = await api.post(
        "/create/room",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      showToast("Auction room created successfully!", "green");
      setshow(false);
      navigate(`/room/${response.RoomID}`);
    } catch (error) {
      console.error("Create Room Error:", error);
      showToast(error.message || "Failed to create room", "red");
    } finally {
      setIsLoading(false);
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="flex justify-center items-center relative max-w-[calc(100vw-2rem)] md:max-w-3xl w-full max-h-[90vh] overflow-y-auto no-scrollbar z-10 rounded-3xl shadow-2xl bg-[#0f1325]/95 border border-[#0CA3E7]/20 p-4 animate-in fade-in zoom-in duration-300">
      <button 
        className={`absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-[500] p-1.5 hover:bg-white/10 rounded-full ${isLoading ? 'opacity-20 pointer-events-none' : ''}`}
        onClick={() => setshow(false)}
      >
        <RxCross2 size={18} />
      </button>
      
      <form onSubmit={clickHandler} className="flex flex-col items-start gap-4 w-full p-4 md:p-[16px] z-20 relative">
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">Create Auction</h2>

        <div className="w-full space-y-4">
          <div className="w-full px-4 py-3 rounded-2xl bg-[#1e293b]/30 border border-[#0CA3E7]/10 group focus-within:border-[#0CA3E7]/40 transition-all">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="url" className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80">Image or video URL (Optional)</label>
              <GoQuestion
                size="1.1rem"
                className="cursor-pointer text-[#0CA3E7] hover:text-white transition-all"
                onClick={() => setShowVideo(!showVideo)}
              />
            </div>
            {showVideo && (
              <div className="absolute left-1/2 -translate-x-1/2 h-64 aspect-video z-50 top-10 max-w-[80vw] bg-black rounded-lg border border-[#0CA3E7]/20 shadow-2xl overflow-hidden animate-in zoom-in">
                {/* video component here if needed, or link */}
                <RxCross2
                  className="absolute top-2 right-2 text-white hover:text-red-500 z-[80] cursor-pointer"
                  onClick={() => setShowVideo(false)}
                />
              </div>
            )}
            <input
              id="url"
              value={url}
              onChange={(e) => seturl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="bg-black/20 focus:bg-black/30 transition-all rounded-xl px-4 py-2.5 w-full border border-white/10 focus:border-[#0CA3E7]/30 outline-none text-white text-sm"
              disabled={isLoading}
            />
          </div>

          <div className="w-full px-4 py-3 rounded-2xl bg-[#1e293b]/20 border border-[#0CA3E7]/5 focus-within:border-[#0CA3E7]/40 transition-all">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] mb-2 block opacity-80">Project Title*</label>
            <input
              value={title}
              onChange={(e) => settitle(e.target.value)}
              placeholder="E.g., Modern E-commerce Platform"
              className="bg-black/20 focus:bg-black/35 transition-all rounded-xl px-4 py-3 w-full border border-white/10 focus:border-[#0CA3E7]/30 outline-none text-white text-sm placeholder:text-gray-600 shadow-inner"
              required
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="px-4 py-3 rounded-2xl bg-[#1e293b]/20 border border-[#0CA3E7]/5 focus-within:border-[#0CA3E7]/40 transition-all">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] mb-2 block opacity-80">Auction Date*</label>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={getTodayDate()}
                className="bg-black/20 focus:bg-black/35 transition-all rounded-xl px-4 py-3 w-full border border-white/10 focus:border-[#0CA3E7]/30 outline-none text-white text-sm color-scheme-dark shadow-inner"
                type="date"
                required
                disabled={isLoading}
              />
            </div>

            <div className="px-4 py-3 rounded-2xl bg-[#1e293b]/20 border border-[#0CA3E7]/5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] mb-2 block opacity-80">Source Code (.zip)*</label>
              <div className="relative group/file">
                <input
                  type="file"
                  ref={fileref}
                  onChange={handleFileChange}
                  accept=".zip"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isLoading}
                />
                <div className="bg-black/20 group-hover/file:bg-black/30 transition-all rounded-xl px-4 py-3 w-full flex items-center justify-between border border-dashed border-white/20 overflow-hidden shadow-inner">
                  <span className="text-xs truncate text-gray-500">
                    {fileName}
                  </span>
                  <span className="text-[10px] font-bold uppercase text-[#0CA3E7]">Upload</span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full px-4 py-3 rounded-2xl bg-[#1e293b]/20 border border-[#0CA3E7]/5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] mb-2 block opacity-80">Project Description*</label>
            <textarea
              value={desc}
              onChange={(e) => setdesc(e.target.value)}
              rows="3"
              placeholder="Details about your project..."
              className="resize-none bg-black/20 focus:bg-black/30 transition-all rounded-xl px-4 py-2.5 w-full border border-white/10 focus:border-[#0CA3E7]/30 outline-none text-white text-sm"
              required
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="w-full flex items-center gap-4 mt-2">
          <GradientBtn
            type="submit"
            placeholder={isLoading ? "Uploading..." : "Create Room"}
            className="text-sm px-8 py-1.5"
            disabled={isLoading}
          />
          <button 
            type="button"
            onClick={() => setshow(false)}
            className="text-gray-500 hover:text-white transition-colors font-semibold text-sm"
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
      </form>

      <img
        className="absolute bottom-0 w-full h-auto opacity-10 z-0 pointer-events-none"
        alt=""
        src={background}
      />
    </div>
  );
};

export default Createauction;
