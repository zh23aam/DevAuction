import React, { useState, useCallback } from "react";
import LeftNavbar from "../Dashbord/LeftNavbar";
import TopBar from "../Common/TopBar";
import GallerySection from "./GallerySection";
import { useAuth0 } from "@auth0/auth0-react";
import { useMenuContext } from "../../context/MenuContextProvider";
import { ProgressSpinner } from "primereact/progressspinner";
import ProfileSearch from "./ProfileSearch";
import api from "../../utils/api";

import { useToast } from "../../context/ToastContext";

const Gallery = () => {
  const { user, isLoading } = useAuth0();
  const { showMenu, setShowMenu } = useMenuContext();
  const [search, setSearch] = useState("");
  const [searchdata, setSearchdata] = useState([]);
  const [showsearch, setShowsearch] = useState(false);
  const { showToast } = useToast();

  const fetchSearchData = useCallback(async () => {
    if (!search.trim()) return;
    try {
      const data = await api.post("/profile/getUsers", { name: search });
      setSearchdata(data.users || []);
    } catch (err) {
      console.error("Search Error:", err);
      showToast("Search failed", "red");
    }
  }, [search, showToast]);

  const handleSearchKeyPress = (e) => {
    if (e.key === "Enter") {
      setShowsearch(true);
      fetchSearchData();
    }
  };

  return (
    <div>
      {isLoading && (
        <div className="w-[100%] h-[700px] flex justify-center items-center ">
          <ProgressSpinner
            style={{ width: "50px", height: "50px" }}
            strokeWidth="8"
            fill="#05081B"
            animationDuration=".5s"
          />
        </div>
      )}
      {!isLoading && (
        <div className="relative">
          {showsearch && (
            <div className="absolute w-[80%] flex justify-center top-[150px]  z-10">
              <ProfileSearch
                searchdata={searchdata}
                showsearch={showsearch}
                setShowsearch={setShowsearch}
                displayToast={showToast}
                refreshData={fetchSearchData}
              />
            </div>
          )}

          <div className="flex h-screen">
            {/* <LeftNavbar/> */}
            <div
              className={`w-full overflow-y-auto bg-[#050618] text-white ${
                showsearch ? " blur-2xl " : ""
              } overflow-x-hidden no-scrollbar`}
            >
              <TopBar 
                title="Project Gallery" 
                subtitle="Explore and bid on amazing projects"
              />
              <div className="pb-10">
                <GallerySection displayToast={showToast} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
