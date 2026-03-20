import React, { useCallback, useEffect, useState } from "react";
import profileImg from "../../assets/images/avatar-default-svgrepo-com.svg";
import GradientBtn from "../../Components/Buttons/GradientBtn";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { IoMenu } from "react-icons/io5";
import { RiNotificationLine } from "react-icons/ri";
import { useAuth0 } from "@auth0/auth0-react";
import { ProgressSpinner } from "primereact/progressspinner";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import Badge from "../Common/Badge";
import api from "../../utils/api";
import Avatar from "../Common/Avatar";

export default function ProfileHero({
  resp,
  Data,
  showFollow,
  setShowFollow,
  showFollowing,
  setShowFollowing,
  setShowMenu,
  showMenu,
  showEdit,
  setShowEdit,
  isOwner = true,
  showcreatepro,
  setCreatePro,
  messageOnClickFunction,
}) {
  const navigate = useNavigate();
  const { user } = useAuth0();
  const skill = Data?.userData?.Profile?.Skills || [];
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [follow, setfollow] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (Data?.userData?.Profile?.Followers && user?.email) {
      const isFollowing = Data.userData.Profile.Followers.includes(user.email);
      setfollow(isFollowing);
    }
  }, [Data, user?.email]);

  const followMe = async () => {
    if (!user?.email || !Data?.userData?.UserInfo?.email) return;
    setIsFollowLoading(true);
    try {
      await api.post("/profile/follow", {
        from: user.email,
        to: Data.userData.UserInfo.email,
      });

      showToast(`Following ${Data.userData.UserInfo.given_name}`, "green");
      if (resp) resp();
    } catch (err) {
      console.error("Follow Error:", err);
      showToast("Failed to follow user", "red");
    } finally {
      setIsFollowLoading(false);
    }
  };

  const unfollowMe = async () => {
    if (!user?.email || !Data?.userData?.UserInfo?.email) return;
    setIsFollowLoading(true);
    try {
      await api.post("/profile/unFollow", {
        from: user.email,
        to: Data.userData.UserInfo.email,
      });

      showToast(`Unfollowed ${Data.userData.UserInfo.given_name}`, "blue");
      if (resp) resp();
    } catch (err) {
      console.error("Unfollow Error:", err);
      showToast("Failed to unfollow user", "red");
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (!Data) {
    return (
      <div className="w-[100%] h-[300px] flex justify-center items-center bg-[#05081B]">
        <ProgressSpinner
          style={{ width: "40px", height: "40px" }}
          strokeWidth="6"
          fill="#05081B"
          animationDuration=".5s"
        />
      </div>
    );
  }

  const userInfo = Data.userData.UserInfo;
  const profile = Data.userData.Profile;

  return (
    <div className="sm:max-h-1/2 h-fit min-h-fit w-full relative text-white overflow-x-hidden">
      <div className="w-80 aspect-square rounded-full absolute left-20 -top-24 bg-[#0CA3E7] bg-opacity-30 blur-[200px] z-[100] lg:block hidden"></div>
      

      <div className="profileContants flex xl:px-[90px] md:p-8 md:py-8 p-6 md:gap-12 gap-8 justify-between flex-wrap">
        <div className="profileDetails flex md:gap-12 gap-6 flex-wrap sm:flex-nowrap">
          <div className="left shrink-0 mx-auto sm:mx-0">
            <Avatar 
              src={userInfo.picture} 
              name={userInfo.name} 
              size="avatar-xl" 
              className="rounded-2xl" 
            />
          </div>
          
          <div className="right flex flex-col md:gap-4 gap-2">
            <div className="userName sm:text-5xl font-bold text-3xl tracking-tight">
              {userInfo.given_name || userInfo.name}
            </div>
            
            <div className="followersFollwingProjects flex gap-8 items-center py-2">
              <div className="projects flex flex-col items-start">
                <div className="count sm:text-2xl font-bold text-xl text-[#0CA3E7]">
                  {profile.Projects?.length || 0}
                </div>
                <div className="heading sm:text-sm text-xs uppercase tracking-widest text-gray-500 font-bold">Projects</div>
              </div>
              <div 
                className="followers flex flex-col items-start cursor-pointer group"
                onClick={() => setShowFollow(true)}
              >
                <div className="count sm:text-2xl font-bold text-xl text-[#0CA3E7] group-hover:text-white transition-colors">
                  {profile.Followers?.length || 0}
                </div>
                <div className="heading sm:text-sm text-xs uppercase tracking-widest text-gray-500 font-bold group-hover:text-gray-300">Followers</div>
              </div>
              <div 
                className="following flex flex-col items-start cursor-pointer group"
                onClick={() => setShowFollowing(true)}
              >
                <div className="count sm:text-2xl font-bold text-xl text-[#0CA3E7] group-hover:text-white transition-colors">
                  {profile.Following?.length || 0}
                </div>
                <div className="heading sm:text-sm text-xs uppercase tracking-widest text-gray-500 font-bold group-hover:text-gray-300">Following</div>
              </div>
            </div>

            <p className="description text-sm sm:text-base max-w-[32rem] text-gray-400 leading-relaxed italic border-l-4 border-[#0CA3E7]/30 pl-4 py-1 bg-white/5 rounded-r-lg">
              {profile.Bio || "No bio available yet."}
            </p>

            <div className="skills flex flex-wrap gap-2 mt-2">
              {skill.length > 0 ? (
                skill.map((elem) => (
                  <Badge key={elem} variant="primary" size="sm">
                    {elem}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-gray-600 uppercase tracking-widest font-bold font-mono">No skills listed</span>
              )}
            </div>
          </div>
        </div>

        <div className="profileActions flex gap-4 h-fit flex-wrap justify-center sm:w-fit w-full xl:justify-start lg:mt-4">
          {!isOwner ? (
            <div className="flex gap-4 w-full">
              {follow ? (
                <GradientBtn
                  placeholder={isFollowLoading ? "..." : "Unfollow"}
                  onClick={unfollowMe}
                  disabled={isFollowLoading}
                  className="flex-1 min-w-[120px]"
                />
              ) : (
                <GradientBtn
                  placeholder={isFollowLoading ? "..." : "Follow"}
                  onClick={followMe}
                  disabled={isFollowLoading}
                  className="flex-1 min-w-[120px]"
                />
              )}
              <GradientBtn
                placeholder="Message"
                className="flex-1 min-w-[120px]"
                onClick={() => navigate("/homepage/chats", { state: { selectedUser: userInfo } })}
              />
            </div>
          ) : (
            <div className="flex gap-4 w-full">
              <GradientBtn
                placeholder="Edit Profile"
                onClick={() => setShowEdit(true)}
                className="flex-1 min-w-[100px]"
              />
              <GradientBtn
                placeholder="New Project"
                onClick={() => setCreatePro && setCreatePro(true)}
                className="flex-1 min-w-[100px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
