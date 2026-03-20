import React, { useCallback, useEffect, useState } from "react";
import ProfileHero from "../../Components/Profile hero/ProfileHero";
import ProfilePosts from "../../Components/Profile Posts/ProfilePosts";
import ProfileOffers from "../../Components/Profile offers/ProfileOffers";
import Follower from "../../Components/Follow/Follower";
import Following from "../../Components/Follow/Following";
import { useAuth0 } from "@auth0/auth0-react";
import { ProgressSpinner } from "primereact/progressspinner";
import { useMenuContext } from "../../context/MenuContextProvider";
import ProfileEdit from "../../Components/ProjectAndEProfile/ProfileEdit";
import CreateProject from "../../Components/Profile hero/CreateProject";
import { useParams } from "react-router-dom";
import api from "../../utils/api";

import { useToast } from "../../context/ToastContext";
import TopBar from "../../Components/Common/TopBar";

function Profile() {
  const { id } = useParams();
  const { showMenu, setShowMenu } = useMenuContext();
  const [explorerSection, setExplorerSection] = useState("Projects");
  const [showFollow, setShowFollow] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const { user, isLoading: isAuthLoading } = useAuth0();
  const [profileData, setProfileData] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showcreatepro, setCreatePro] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { showToast } = useToast();

  const isOwner = !id || 
    id === profileData?.userData?.UserInfo?._id || 
    (user?.email && profileData?.userData?.UserInfo?.email === user.email) ||
    user?.sub === id;

  const fetchProfileData = useCallback(async () => {
    setIsProfileLoading(true);
    setError(null);
    try {
      let data;
      if (id) {
        // Fetch specific user profile by ID
        data = await api.post("/profile/getUsersById", { id });
      } else if (user?.email) {
        // Fetch current logged in user profile
        data = await api.post("/profile", { email: user.email });
      } else {
        return;
      }
      setProfileData(data);
    } catch (err) {
      console.error("Profile Fetch Error:", err);
      setError(err.message);
      showToast("Failed to load profile data", "red");
    } finally {
      setIsProfileLoading(false);
    }
  }, [id, user?.email, showToast]);

  useEffect(() => {
    fetchProfileData();
  }, [id, user?.email, fetchProfileData]);

  const isLoading = isAuthLoading || isProfileLoading;

  return (
    <div className="relative">
      {isLoading && (
        <div className="w-[100%] h-[700px] flex flex-col justify-center items-center bg-[#05081B]">
          <ProgressSpinner
            style={{ width: "50px", height: "50px" }}
            strokeWidth="8"
            fill="#05081B"
            animationDuration=".5s"
          />
          <p className="mt-4 text-gray-400 animate-pulse text-xl">Loading profile...</p>
        </div>
      )}
      
      {!isLoading && error && (
        <div className="w-[100%] h-[700px] flex flex-col justify-center items-center bg-[#05081B] text-white p-4">
          <h2 className="text-2xl font-bold text-red-500 mb-4 text-center">Failed to load profile</h2>
          <p className="text-gray-400 mb-6 text-center">{error}</p>
          <button 
            onClick={fetchProfileData}
            className="px-6 py-2 bg-[#0CA3E7] rounded-full hover:bg-[#0A8BC7] transition-colors font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && profileData && (
        <div className="min-h-screen bg-[#05081B]">
          {showcreatepro && (
            <div className="absolute inset-0 flex justify-center z-[200] items-start pt-20 bg-black/40 backdrop-blur-sm">
              <CreateProject 
                show={showcreatepro} 
                setshow={setCreatePro} 
                displayToast={showToast}
                refreshData={fetchProfileData}
              />
            </div>
          )}
          {showEdit && (
            <div className="absolute inset-0 flex justify-center z-[200] items-start pt-20 bg-black/40 backdrop-blur-sm">
              <ProfileEdit
                resp={fetchProfileData}
                showEdit={showEdit}
                setShowEdit={setShowEdit}
                userData={profileData?.userData?.Profile}
                displayToast={showToast}
              />
            </div>
          )}
          {showFollow && (
            <div className="absolute inset-0 flex justify-center z-[200] items-start pt-20 bg-black/40 backdrop-blur-sm">
              <Follower
                resp={fetchProfileData}
                Data={profileData}
                showFollow={showFollow}
                setShowFollow={setShowFollow}
                displayToast={showToast}
              />
            </div>
          )}
          {showFollowing && (
            <div className="absolute inset-0 flex justify-center z-[200] items-start pt-20 bg-black/40 backdrop-blur-sm">
              <Following
                resp={fetchProfileData}
                Data={profileData}
                showFollowing={showFollowing}
                setShowFollowing={setShowFollowing}
                displayToast={showToast}
              />
            </div>
          )}

          <div
            className={`transition-all duration-300 min-h-screen ${
              (showFollow || showFollowing || showEdit || showcreatepro) ? "blur-xl pointer-events-none scale-95" : "blur-0 scale-100"
            }`}
          >
            <TopBar 
              title={isOwner ? "My Profile" : `${profileData?.userData?.UserInfo?.name}'s Profile`} 
              subtitle={isOwner ? "View and manage your professional identity" : "Explore this architect's portfolio and offers"}
            />
            <ProfileHero
              resp={fetchProfileData}
              Data={profileData}
              showFollow={showFollow}
              setShowFollow={setShowFollow}
              showFollowing={showFollowing}
              setShowFollowing={setShowFollowing}
              setShowMenu={setShowMenu}
              showMenu={showMenu}
              showEdit={showEdit}
              setShowEdit={setShowEdit}
              showcreatepro={showcreatepro}
              setCreatePro={setCreatePro}
              displayToast={showToast}
              isOwner={isOwner}
            />
            <div className="explorerSection h-full relative pt-8">
              <div className="navlinksForExplorerSection flex items-center sticky top-0 w-full bg-[#05081B]/80 backdrop-blur-md z-10 border-b border-[#072A47]">
                <div
                  className={
                    "projects text-center text-white py-4 flex-1 font-semibold uppercase tracking-wider cursor-pointer transition-all " +
                    `${explorerSection === "Projects" ? "border-b-4 border-[#0CA3E7] bg-white/5" : "border-b-4 border-transparent hover:bg-white/5 text-gray-500"}`
                  }
                  onClick={() => setExplorerSection("Projects")}
                >
                  Projects
                </div>
                <div
                  className={
                    "offers text-white py-4 flex-1 font-semibold uppercase tracking-wider text-center cursor-pointer transition-all " +
                    `${explorerSection === "Offers" ? "border-b-4 border-[#0CA3E7] bg-white/5" : "border-b-4 border-transparent hover:bg-white/5 text-gray-500"}`
                  }
                  onClick={() => setExplorerSection("Offers")}
                >
                  Offers
                </div>
              </div>
              <div className="pb-10 pt-6">
                <ProfilePosts
                  className={explorerSection === "Projects" ? "block" : "hidden"}
                  user={profileData?.userData?.UserInfo}
                  displayToast={showToast}
                />
                <ProfileOffers
                  user={profileData?.userData?.UserInfo}
                  className={explorerSection === "Offers" ? "block" : "hidden"}
                  displayToast={showToast}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
