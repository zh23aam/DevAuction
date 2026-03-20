import React from 'react';

const Transactions = ({ transactions = [] }) => {
  return (
    <div>
      <div className="border-2 border-[#223534] text-[12px] rounded-lg sm:text-[18px] h-[400px] no-scrollbar overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[#0CA3E7] bg-[#050618]">
              <th className="p-3 sticky top-0 bg-[#050618] border-b border-[#223534]">#</th>
              <th className="p-3 sticky top-0 bg-[#050618] border-b border-[#223534]">Category</th>
              <th className="p-3 sticky top-0 bg-[#050618] border-b border-[#223534]">Amount (₹)</th>
              <th className="p-3 sticky top-0 bg-[#050618] border-b border-[#223534]">Transaction ID</th>
              <th className="p-3 sticky top-0 bg-[#050618] border-b border-[#223534]">Date</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500">
                  No transaction history found.
                </td>
              </tr>
            ) : (
              transactions.map((ele, index) => {
                const isDebit = ele.category?.toLowerCase() === 'debit';
                const amount = (ele.amount || 0) / 100;
                return (
                  <tr key={ele._id || index} className="border-b border-[#223534] hover:bg-[#ffffff05] transition-colors">
                    <td className="p-3 text-center text-gray-400">{index + 1}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-md text-sm ${isDebit ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                        {ele.category || 'N/A'}
                      </span>
                    </td>
                    <td className={`p-3 text-center font-semibold ${isDebit ? 'text-red-400' : 'text-green-400'}`}>
                      {isDebit ? '-' : '+'}{amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-center text-gray-400 font-mono text-sm">{ele._id || 'N/A'}</td>
                    <td className="p-3 text-center text-gray-400 text-sm">
                      {ele.createdAt ? new Date(ele.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Transactions;
