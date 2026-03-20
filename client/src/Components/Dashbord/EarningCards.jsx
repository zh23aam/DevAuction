import React from 'react'
import moneySak from '../../../public/Icons/moneySak.png'
import coinStack from '../../../public/Icons/coinstack.png'
import sakeofcoins from '../../../public/Icons/Sackofcoins.png'
import coins2 from '../../../public/Icons/2coins.png'

function EarningCards({
  earningAmount = 0,
  earningRate = "+0%",
  spendAmount = 0,
  spendRate = "+0%",
  avgAmount = 0,
  avgRate = "+0%",
}) {
  function formatNumber(num) {
    if (num === null || num === undefined) return "0.00";
    const n = Number(num);
    if (isNaN(n)) return "0.00";
    
    if (n >= 1000000000) {
      return (n / 1000000000).toFixed(2).replace(/\.00$/, "").replace(/\.0$/, "") + "B";
    } else if (n >= 1000000) {
      return (n / 1000000).toFixed(2).replace(/\.00$/, "").replace(/\.0$/, "") + "M";
    } else if (n >= 1000) {
      return (n / 1000).toFixed(2).replace(/\.00$/, "").replace(/\.0$/, "") + "k";
    } else {
      return n.toFixed(2).replace(/\.00$/, "").replace(/\.0$/, "");
    }
  }

  return (
    <div
      id="earningCards"
      className="no-scrollbar flex gap-3 h-auto md:justify-center md:items-center md:flex-wrap px-2 overflow-x-auto overflow-y-hidden"
    >
      <div className="relative min-w-[300px] mt-3 border-2 border-[#223534] rounded-lg basis-[32%] bg-[#050b1e]/30">
        <div className="flex items-center gap-3 mt-8 ml-6 mb-6">
          <img src={moneySak} width={30} alt="" />
          <p className="text-xl font-semibold">Total Earnings</p>
        </div>
        <div className="ml-6">
          <h4 className="text-3xl font-bold mb-2">₹ {formatNumber(earningAmount)}</h4>
          <p className="opacity-0 mb-5 font-semibold">
            <span className="text-green-400">{earningRate}</span> from last week
          </p>
        </div>
        <img src={coinStack} className="w-[150px] dropShado absolute right-0 top-10 pointer-events-none" alt="" />
      </div>

      <div className="relative min-w-[300px] mt-3 border-2 border-[#223534] rounded-lg basis-[32%] bg-[#050b1e]/30">
        <div className="flex items-center gap-3 mt-8 ml-6 mb-6">
          <img src={moneySak} width={30} alt="" />
          <p className="text-xl font-semibold">Total Spending</p>
        </div>
        <div className="ml-6">
          <h4 className="text-3xl font-bold mb-2">₹ {formatNumber(spendAmount)}</h4>
          <p className="opacity-0 mb-5 font-semibold">
            <span className="text-green-400">{spendRate}</span> from last week
          </p>
        </div>
        <img src={coins2} className="w-[100px] dropShado absolute right-2 top-20 rounded-2xl pointer-events-none" alt="" />
      </div>

      <div className="relative min-w-[300px] mt-3 border-2 border-[#223534] rounded-lg basis-[32%] bg-[#050b1e]/30">
        <div className="flex items-center gap-3 mt-8 ml-6 mb-6">
          <img src={moneySak} width={30} alt="" />
          <p className="text-xl font-semibold">Average Spending</p>
        </div>
        <div className="ml-6">
          <h4 className="text-3xl font-bold mb-2">₹ {formatNumber(avgAmount)}</h4>
          <p className="opacity-0 mb-5 font-semibold">
            <span className="text-green-400">{avgRate}</span> from last week
          </p>
        </div>
        <img src={sakeofcoins} className="w-[85px] dropShado absolute right-6 top-20 pointer-events-none" alt="" />
      </div>
    </div>
  );
}

export default EarningCards
