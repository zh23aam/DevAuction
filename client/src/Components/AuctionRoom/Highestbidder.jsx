import React, { useEffect, useState } from "react";
import api from "../../utils/api";

const Highestbidder = () => {
  const [data, setData] = useState({ data: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const getHighestBidderList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await api.get("/dashboard/highestBidders");
      setData(list);
    } catch (err) {
      console.error("Highest Bidder Fetch Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getHighestBidderList();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col gap-4 animate-pulse">
        <div className="h-10 w-64 bg-gray-700 rounded mb-4"></div>
        <div className="h-40 w-full bg-gray-800 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500 bg-red-500/10 rounded-2xl border border-red-500/20 m-6">
        <p className="mb-2 font-semibold">Error loading highest bidders: {error}</p>
        <button className="text-white bg-red-500/20 px-4 py-1.5 rounded-lg hover:bg-red-500/40 transition-all text-sm font-bold uppercase tracking-wider" onClick={getHighestBidderList}>Retry</button>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 ">
      <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight">
        Highest Bidders
      </div>
      <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#0f1325]/40 backdrop-blur-sm shadow-2xl">
        <div className="no-scrollbar overflow-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e293b]/30 text-[#0CA3E7] border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-80">S.No.</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-80">Highest Bidder</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-80">Project</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest opacity-80 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {!data.data || data.data.length === 0 ? (
                <tr>
                  <td className="px-6 py-10 text-center text-gray-500 italic text-sm" colSpan={4}>
                    The leaderboard is empty. Start bidding to see names here!
                  </td>
                </tr>
              ) : (
                data.data.map((ele, index) => (
                  <tr key={index + ele.name} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-sm text-gray-400 font-mono">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0CA3E7]/20 to-transparent flex items-center justify-center text-[#0CA3E7] font-bold text-xs">
                          {ele.name?.charAt(0)}
                        </div>
                        <span className="text-sm font-semibold text-gray-200">{ele.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{ele.title}</td>
                    <td className="px-6 py-4 text-sm font-bold text-white text-right">
                      <span className="text-[#0CA3E7] mr-1">₹</span>
                      {ele.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Highestbidder;
