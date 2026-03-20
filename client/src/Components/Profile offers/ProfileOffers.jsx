import React, { useCallback, useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import api from "../../utils/api";

import { ProgressSpinner } from "primereact/progressspinner";
import { useToast } from "../../context/ToastContext";

export default function ProfileOffers({ className, user }) {
  const [offersData, setOffersData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const getOffersHistory = useCallback(async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      const resData = await api.post("/profile/getUserOffers", { email: user.email });
      setOffersData(resData.offers || []);
    } catch (error) {
      console.error("Fetch Offers Error:", error);
      if (showToast) showToast("Failed to load offers", "red");
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, showToast]);

  useEffect(() => {
    getOffersHistory();
  }, [getOffersHistory]);

  return (
    <div className={`${className} min-h-[300px]`}>
      {isLoading ? (
        <div className="w-full h-[300px] flex flex-col justify-center items-center gap-4">
          <ProgressSpinner
            style={{ width: "40px", height: "40px" }}
            strokeWidth="4"
            fill="transparent"
            animationDuration=".5s"
          />
          <p className="text-gray-500 text-sm tracking-widest uppercase">Fetching Offers...</p>
        </div>
      ) : offersData.length > 0 ? (
        <div className="bg-[#05081B] rounded-3xl border border-white/5 overflow-hidden shadow-2xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0CA3E7]/10 border-b border-white/5 text-[#0CA3E7] text-xs uppercase tracking-widest font-bold">
                  <th className="px-6 py-4 hidden sm:table-cell">#</th>
                  <th className="px-6 py-4">From</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {offersData.map((offer, index) => (
                  <tr 
                    key={offer._id || index}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4 hidden sm:table-cell text-gray-500">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-200">{offer.name}</td>
                    <td className="px-6 py-4 text-gray-400">{offer.projectTitle}</td>
                    <td className="px-6 py-4 text-[#0CA3E7] font-semibold">₹{offer.amount}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${
                        offer.result == 1 
                          ? "bg-green-500/10 text-green-500 border border-green-500/20" 
                          : offer.result == 2
                            ? "bg-red-500/10 text-red-500 border border-red-500/20"
                            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      }`}>
                        {offer.result == 1 ? "Accepted" : offer.result == 2 ? "Rejected" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="w-full py-20 flex flex-col items-center justify-center text-gray-600 gap-2 bg-[#05081B] rounded-3xl border border-white/5">
          <span className="text-4xl text-gray-700">💼</span>
          <p className="text-lg font-medium">No offers received yet</p>
          <p className="text-sm">Great things take time. Keep building!</p>
        </div>
      )}
    </div>
  );
}
