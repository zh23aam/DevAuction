import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useToast } from "../../context/ToastContext";
import { RxCross2 } from "react-icons/rx";
import { Link } from "react-router-dom";
import PrimaryButton from "../Common/PrimaryButton";
import api from "../../utils/api";

const ProfileSearch = ({ searchdata, showsearch, setShowsearch, refreshData }) => {
  const { user } = useAuth0();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { showToast } = useToast();

  const followMe = async (targetEmail, name) => {
    if (!user?.email) return;

    setIsActionLoading(true);
    try {
      await api.post("/profile/follow", { from: user.email, to: targetEmail });

      showToast(`Following ${name}`, "green");
      if (refreshData) refreshData();
    } catch (err) {
      console.error("Follow Error:", err);
      showToast(`Failed to follow ${name}`, "red");
    } finally {
      setIsActionLoading(false);
    }
  };

  const isFollowing = (searchedUser) => {
    const followers = searchedUser?.Profile?.Followers || [];
    return followers.includes(user?.email);
  };

  const data = searchdata || [];

  return (
    <div className="rounded-3xl bg-[#050618]/95 border border-[#0CA3E7]/20 max-h-[500px] w-[400px] flex flex-col shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in duration-300 overflow-hidden">
      <div className="p-6 pb-2">
        <div className="text-white font-bold text-2xl flex justify-between items-center mb-4">
          <span>Search Results</span>
          <button 
            onClick={() => setShowsearch(false)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-gray-500 hover:text-white"
          >
            <RxCross2 size={24} />
          </button>
        </div>
        <div className="h-px bg-white/5 w-full"></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2">
        {data.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-gray-600 italic">
            No matching profiles found
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((profile, index) => (
              <div key={profile._id || index} className="p-4 flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl hover:border-[#0CA3E7]/30 transition-all group">
                <Link to={`/homepage/profile/${profile._id}`} className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/10 shadow-lg group-hover:border-[#0CA3E7]/50 transition-colors">
                    <img src={profile.UserInfo?.picture} alt={profile.UserInfo?.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-100 group-hover:text-[#0CA3E7] transition-colors">{profile.UserInfo?.name}</span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">{profile.Profile?.Title || "Developer"}</span>
                  </div>
                </Link>

                {isFollowing(profile) ? (
                  <div className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] bg-[#0CA3E7]/10 border border-[#0CA3E7]/30 rounded-full">
                    Following
                  </div>
                ) : (
                  <PrimaryButton
                    label="Follow"
                    onClick={() => followMe(profile.UserInfo?.email, profile.UserInfo?.name)}
                    isLoading={isActionLoading}
                    variant="primary"
                    className="!px-6 !py-2 !text-[10px] border-none"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSearch;
