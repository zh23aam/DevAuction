import React from "react";
import { Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { IoMenu } from "react-icons/io5";
import { useMenuContext } from "../../context/MenuContextProvider";
import Avatar from "./Avatar";

/**
 * TopBar Component
 * A centralized header component for consistent navigation and branding.
 * 
 * @param {string} title - Main title (e.g., "Hi, Name" or "Profile")
 * @param {string} subtitle - Optional secondary text
 * @param {boolean} showBack - Whether to show the back button (hidden on desktop)
 * @param {function} onBack - Callback for back button
 */
const TopBar = ({ title, subtitle, showBack = false, onBack }) => {
  const { user } = useAuth0();
  const { setShowMenu } = useMenuContext();

  return (
    <div className="w-full flex items-center justify-between py-5 px-4 md:px-12 border-b border-white/10 bg-[#05081B]/90 backdrop-blur-md sticky top-0 z-[40]">
      <div className="flex items-center gap-4">
        <IoMenu
          size="1.7rem"
          className="md:hidden cursor-pointer active:scale-95 text-white/80 hover:text-white transition-colors"
          onClick={() => setShowMenu(true)}
        />
        
        {showBack && (
          <FaLongArrowAltLeft
            size="1.5rem"
            className="hidden md:hidden cursor-pointer hover:text-[#0CA3E7] transition-colors text-white" 
            onClick={onBack}
          />
        )}
        
        <div className="flex flex-col">
          <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] md:text-sm text-[#0CA3E7] mt-1 font-medium opacity-90">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link 
          to="/homepage/profile" 
          className="group relative"
          title="Go to Profile"
        >
          <Avatar 
            src={user?.picture} 
            name={user?.name} 
            size="sm" 
            className="border-2 border-[#0CA3E7]/30 p-[2px] transition-all group-hover:border-[#0CA3E7] group-active:scale-95 shadow-lg shadow-[#0CA3E7]/10" 
          />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-[#05081B] rounded-full"></div>
        </Link>
      </div>
    </div>
  );
};

export default TopBar;
