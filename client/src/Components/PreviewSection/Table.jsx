import React, { useEffect, useState } from "react";

const Table = ({ tableData}) => {

  console.log("tableData: ", tableData)

  // const data = [
  //   {
  //     name: "Ankit chauhan",
  //     total: 1000000,
  //   },
  //   {
  //     name: "Ankit chauhan",
  //     total: 1000000,
  //   },
  //   {
  //     name: "Ankit chauhan",
  //     total: 1000000,
  //   },
  //   {
  //     name: "Ankit chauhan",
  //     total: 1000000,
  //   },
  //   {
  //     name: "Ankit chauhan",
  //     total: 1000000,
  //   },
  // ];
  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="overflow-y-auto no-scrollbar flex-1 px-2 pb-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[#0CA3E7] text-[10px] uppercase tracking-widest font-black">
              <th className="py-5 px-4 text-left border-b border-white/5 sticky top-0 bg-[#0a0b1e]/95 backdrop-blur-md z-10 w-16">#</th>
              <th className="py-5 px-2 text-left border-b border-white/5 sticky top-0 bg-[#0a0b1e]/95 backdrop-blur-md z-10">Bidders</th>
              <th className="py-5 px-4 text-right border-b border-white/5 sticky top-0 bg-[#0a0b1e]/95 backdrop-blur-md z-10">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {tableData.length !== 0 ? (
              tableData.map((ele, index) => (
                <tr key={index} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4 text-[10px] font-black text-gray-500 group-hover:text-[#0CA3E7] transition-colors">
                    {String(index + 1).padStart(2, '0')}
                  </td>
                  <td className="py-4 px-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white/90 group-hover:text-white transition-colors">{ele.name}</span>
                      <span className="text-[9px] uppercase tracking-wider text-gray-500">Verified Bidder</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-[#0CA3E7] font-black text-sm">
                      <span className="text-[10px] opacity-60">&#8377;</span>
                      <span>{ele.amount.toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                      <span className="text-xl">!</span>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-white/40 italic">No offers placed yet</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Table;
