import React, { useState, useEffect, useCallback } from "react";
import SearchIcon from "../../assets/GalleryImages/search 02.png";
import { RxCross2 } from "react-icons/rx";
import "./Follow.css";
import GradientBtn from "../Buttons/GradientBtn";
import { useAuth0 } from "@auth0/auth0-react";
import api from "../../utils/api";
import { ProgressSpinner } from "primereact/progressspinner";
import EmptyState from "../Common/EmptyState";
import { useToast } from "../../context/ToastContext";
import profileImg from "../../assets/images/avatar-default-svgrepo-com.svg";

const Follower = ({ resp, Data, showFollow, setShowFollow }) => {
  const { user } = useAuth0();
  const { showToast } = useToast();
  const [followers, setFollowers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchFollowers = useCallback(async () => {
    const followerList = Data?.userData?.Profile?.Followers || [];
    if (followerList.length === 0) {
      setFollowers([]);
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.post("/profile/followers", { followers: followerList });
      setFollowers(result.data || []);
    } catch (err) {
      console.error("Fetch Followers Error:", err);
      showToast("Failed to load followers", "red");
    } finally {
      setIsLoading(false);
    }
  }, [Data?.userData?.Profile?.Followers, showToast]);

  useEffect(() => {
    fetchFollowers();
  }, [fetchFollowers]);

  const removeFollower = async (followerEmail, name) => {
    setIsActionLoading(true);
    try {
      await api.post("/profile/unFollow", {
        from: followerEmail,
        to: user.email,
      });

      showToast(`Removed ${name} from followers`, "blue");
      if (resp) resp();
    } catch (err) {
      console.error("Remove Follower Error:", err);
      showToast("Failed to remove follower", "red");
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredFollowers = followers.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-3xl bg-[#050618]/95 border border-[#0CA3E7]/20 h-[500px] w-[450px] flex flex-col shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300">
      <div className="p-6 pb-2">
        <div className="text-white font-bold text-2xl flex justify-between items-center mb-4">
          <span>Followers</span>
          <button 
            onClick={() => setShowFollow(false)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white"
          >
            <RxCross2 size={24} />
          </button>
        </div>
        
        <div className="relative group">
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search followers..."
            className="text-white w-full py-3 px-12 rounded-xl bg-[#0ca2e710] border border-white/5 focus:border-[#0ca2e740] outline-none transition-all placeholder:text-gray-600"
          />
          <img className="absolute top-1/2 -translate-y-1/2 left-4 w-5 h-5 opacity-40 group-focus-within:opacity-100 transition-opacity" src={SearchIcon} alt="" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-500">
             <ProgressSpinner style={{width: '30px', height: '30px'}} strokeWidth="4" />
             <p className="text-sm font-semibold tracking-widest uppercase">Fetching...</p>
          </div>
        ) : filteredFollowers.length === 0 ? (
          <EmptyState 
            size="sm"
            icon="👥"
            title={searchTerm ? "No match" : "No followers"}
            description={searchTerm ? "Try a different name" : "You don't have any followers yet"}
          />
        ) : (
          <div className="space-y-3">
            {filteredFollowers.map((follower) => (
              <div key={follower.email} className="p-3 flex items-center justify-between border-b border-white/5 hover:bg-white/5 rounded-xl transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 shadow-lg group-hover:border-[#0CA3E7]/50 transition-colors">
                    <img src={follower.image || profileImg} alt={follower.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="font-semibold text-gray-200">{follower.name}</span>
                </div>
                <button 
                  disabled={isActionLoading}
                  onClick={() => removeFollower(follower.email, follower.name)}
                  className="px-4 py-1 text-xs font-bold uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 rounded-full transition-all active:scale-95 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default Follower;
