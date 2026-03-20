import React, { useEffect, useState, useCallback } from "react";
import GradientBtn from "../../Components/Buttons/GradientBtn";
import EarningCards from "../../Components/Dashbord/EarningCards";
import TopBar from "../../Components/Common/TopBar";
import Cradites from "../../Components/Dashbord/Cradites";
import { useAuth0 } from "@auth0/auth0-react";
import Auctionrooms from "../../Components/AuctionRoom/Auctionrooms";
import Highestbidder from "../../Components/AuctionRoom/Highestbidder";
import Createauction from "../../Components/AuctionRoom/Createauction";
import { ProgressSpinner } from "primereact/progressspinner";
import { useMenuContext } from "../../context/MenuContextProvider";
import Download from "../../Components/AuctionRoom/Download";
import { useToast } from "../../context/ToastContext";
import ErrorSection from "../../Components/Common/ErrorSection";
import api from "../../utils/api";

function Dashbord() {
  const { showMenu, setShowMenu } = useMenuContext();
  const [showtable, setshowTable] = useState(false);
  const [show, setshow] = useState(false);
  const { user } = useAuth0();
  const [data, setdata] = useState(null);
  const [avg, setavg] = useState(0);
  const [total, settotal] = useState(0);
  const [totalearn, settotalearn] = useState(0);
  const [credits, setcredits] = useState(0);
  const [trans, settrans] = useState();
  const [showdownload, setShowdownload] = useState(false);
  const { showToast } = useToast();

  const userEmail = user?.email;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfileData = useCallback(async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const userData = await api.post("/profile", { email: user.email });
      setdata(userData);
      
      const creds = userData.userData?.Profile?.Credits || 0;
      setcredits(creds);

      if (userData.userData?.Profile?.Transactions?.length > 0) {
        settrans(userData.userData.Profile.Transactions);
      }

      let totalspend = 0;
      const spendings = userData.userData?.Profile?.Spendings || [];

      if (spendings.length > 0) {
        totalspend = spendings.reduce((acc, curr) => acc + (curr?.Amount || 0), 0);
        setavg(totalspend / spendings.length);
        settotal(totalspend);
      } else {
        setavg(0);
        settotal(0);
      }

      const earnings = userData.userData?.Profile?.Earnings || [];
      const totalEarn = earnings.reduce((acc, curr) => acc + (curr?.Amount || 0), 0);
      settotalearn(totalEarn);

    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError(err.message);
      showToast("Failed to load dashboard data", "red");
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, showToast]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  return (
    <div className="relative">
      {(isLoading || !user) && (
        <div className="w-[100%] h-[700px] flex flex-col justify-center items-center bg-[#050618]">
          <ProgressSpinner
            style={{ width: "50px", height: "50px" }}
            strokeWidth="8"
            fill="#05081B"
            animationDuration=".5s"
          />
          <p className="mt-4 text-gray-400 animate-pulse text-xl">Loading your dashboard...</p>
        </div>
      )}
      {!isLoading && error && (
        <div className="w-[100%] h-full min-h-[700px] flex flex-col justify-center items-center bg-[#050618] text-white">
          <ErrorSection 
            title="Dashboard Error"
            message={error}
            onRetry={fetchProfileData}
          />
        </div>
      )}
      {!isLoading && !error && user && (
        <div id="main" className="flex h-screen relative">
          {show && (
            <div className="absolute w-[90%] left-[5%] top-[10px] flex justify-center z-[1001] ">
              <Createauction show={show} setshow={setshow} />
            </div>
          )}
          {showdownload && (
            <div className="absolute w-[90%] left-[5%] top-[100px] flex justify-center z-[1001] ">
              <Download show={showdownload} setshow={setShowdownload} />
            </div>
          )}
          <div
            className={`w-[100%] overflow-y-scroll border-l-2 border-[#4b4c59] bg-[#050618] pb-10 text-white ${
              show ? "blur-xl pointer-events-none" : ""
            } ${showdownload ? "blur-lg pointer-events-none" : ""}`}
          >
            <TopBar 
              title={`Hi, ${user?.given_name || "User"}`}
              subtitle="Welcome back, it's good to have you back"
            />
            
            <div className="p-4 md:p-8">
              <EarningCards
                earningAmount={totalearn}
                spendAmount={total}
              />

              <Auctionrooms
                show={show}
                setshow={setshow}
                showdownload={showdownload}
                setShowdownload={setShowdownload}
              />
              <Highestbidder />
              <Cradites
                resp={fetchProfileData}
                showtable={showtable}
                setshowTable={setshowTable}
                trans={trans}
                credits={credits / 100}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashbord;
