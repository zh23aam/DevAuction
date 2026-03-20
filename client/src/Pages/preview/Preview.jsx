import React, { useState, useEffect } from "react";
import TopBar from "../../Components/Common/TopBar";
import PreviewSec from "../../Components/PreviewSection/PreviewSec";
import { useAuth0 } from "@auth0/auth0-react";
import { useMenuContext } from "../../context/MenuContextProvider";
import Makeoffer from "../../Components/PreviewSection/Makeoffer";
import { useParams } from "react-router-dom";
import api from "../../utils/api";

const Preview = () => {
  const { showMenu, setShowMenu } = useMenuContext();
  const [show, setshow] = useState(false);
  const { user } = useAuth0();
  const [tableData, setTableData] = useState([]);
  const [projectData, setProjectData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const params = useParams();

  const loadInitialData = async () => {
    try {
      // 1. Get Project Offers
      const { offers } = await api.post("/profile/getProjectOffers", {
        projectID: params.id,
      });
      setTableData(offers);

      // 2. Get Project Details for validation
      const details = await api.post("/gallery/getProjectById", { projectID: params.id });
      setProjectData(details);

      // 3. Get User Profile for credit check
      if (user?.email) {
        const profile = await api.post("/profile", { email: user.email });
        setUserProfile(profile.userData);
      }
    } catch (error) {
      console.error("Preview Load Error:", error);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [params.id, user?.email]);

  async function getProjectOffers() {
    try {
      const { offers } = await api.post("/profile/getProjectOffers", {
        projectID: params.id,
      });
      setTableData(offers);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="min-h-screen bg-[#050618] relative">
      {show && (
        <div className="fixed inset-0 z-[1000] flex justify-center items-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in duration-300">
          <Makeoffer 
            getProjectOffers={loadInitialData} 
            id={params.id} 
            setshow={setshow} 
            projectOwner={projectData?.Owner}
            minPrice={projectData?.OfferPrice}
            userCredits={userProfile?.Profile?.Credits || 0}
          />
        </div>
      )}

      <div className={`w-full transition-all duration-300 ${show ? "blur-xl scale-[0.98] pointer-events-none" : ""}`}>
        <TopBar 
          title="Project Details" 
          subtitle="Review the project and place your bid"
        />
        <div className="px-4 md:px-12 pb-20 pt-8">
          <PreviewSec 
            tableData={tableData} 
            show={show} 
            setshow={setshow} 
            getProjectOffers={loadInitialData}
          />
        </div>
      </div>
    </div>
  );
};

export default Preview;
