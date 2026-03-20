import React, { useState } from "react";
import { RxCross2 } from "react-icons/rx";
import GradientBtn from "../Buttons/GradientBtn";
import background from "../../assets/AuctionroomImages/Rectangle.png";
import "./Auctionroom.css";
import api from "../../utils/api";
import { useToast } from "../../context/ToastContext";

const Download = ({ show, setshow }) => {
  const [fileid, setfileid] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const clickHandler = async (e) => {
    if (e) e.preventDefault();
    
    if (!fileid.trim()) {
      showToast("Please enter a File ID", "red");
      return;
    }

    setIsLoading(true);
    try {
      // Use api.post directly with responseType in config
      const response = await api.post("/create/download", { fileID: fileid.trim() }, {
        responseType: "blob",
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Axios-based api utility returns response.data directly in the interceptor
      // But for blob we need the whole response if we want to check type, 
      // however my api.js interceptor returns response.data.
      // Let's check api.js again.
      
      const blob = response; // response is data because of interceptor

      // Check if blob is actually an error JSON
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const errorData = JSON.parse(text);
        throw new Error(errorData.message || "File not found or access denied");
      }

      const filename = `sourcecode_${fileid.slice(0, 6)}.zip`;
      saveAs(blob, filename);
      
      showToast("Download started successfully!", "green");
      setshow(false);
      setfileid("");
    } catch (error) {
      console.error('Error downloading file:', error);
      showToast(error.message || "Failed to download file", "red");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center relative max-w-xl w-[95%] z-[1002] rounded-3xl shadow-2xl bg-[#0f1325]/95 border border-[#0CA3E7]/20 p-4 overflow-hidden animate-in fade-in zoom-in duration-300">
      <button 
        className={`absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-[500] p-1.5 hover:bg-white/10 rounded-full ${isLoading ? 'opacity-20 pointer-events-none' : ''}`}
        onClick={() => setshow(false)}
      >
        <RxCross2 size={18} />
      </button>
      
      <form onSubmit={clickHandler} className="flex flex-col items-start gap-5 w-full p-4 md:p-[16px] z-20 relative text-left">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">Download Project</h2>

        <p className="text-gray-400 text-xs -mt-2 opacity-80 leading-relaxed">
          Enter the unique File ID sent to your email or from the project details to retrieve your source code.
        </p>

        <div className="w-full">
          <div className="w-full px-4 py-3 rounded-2xl bg-[#1e293b]/30 border border-[#0CA3E7]/10 group focus-within:border-[#0CA3E7]/40 transition-all">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] mb-2 block opacity-80">File ID*</label>
            <input
              value={fileid}
              onChange={(e) => setfileid(e.target.value)}
              placeholder="E.g., 65f2a..."
              className="bg-black/20 focus:bg-black/30 transition-all rounded-xl px-4 py-3 w-full border border-white/10 focus:border-[#0CA3E7]/30 outline-none text-white font-mono text-xs placeholder:text-gray-500 placeholder:font-sans"
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div className="w-full flex items-center gap-4 mt-2">
          <GradientBtn
            type="submit"
            placeholder={isLoading ? "Searching..." : "Download File"}
            className="text-xs px-6 py-1"
            disabled={isLoading}
          />
          <button 
            type="button"
            onClick={() => setshow(false)}
            className="text-gray-500 hover:text-white transition-colors font-semibold text-xs px-4 py-1 border border-gray-700 rounded-full hover:bg-white/5"
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

export default Download;
