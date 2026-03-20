import React, { useState, useCallback } from "react";
import GradientBtn from "../Buttons/GradientBtn";
import { useAuth0 } from "@auth0/auth0-react";
import photo from "../../assets/LandingPage Images/logo remove background.svg";
import Transactions from "./Transactions";
import { useToast } from "../../context/ToastContext";
import api from "../../utils/api";
import { RAZORPAY_KEY_ID } from "../../utils/constants";

function Cradites({ resp, trans, credits = 0, showtable, setshowTable }) {
  const [amount, setAmount] = useState("");
  const { user } = useAuth0();
  const [localTransactions, setLocalTransactions] = useState([]);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { showToast } = useToast();

  const fetchTransactions = async () => {
    setIsActionLoading(true);
    try {
      const data = await api.post("/payments/transactions", { email: user.email });
      setLocalTransactions(data.transactions || []);
      setshowTable(!showtable);
    } catch (error) {
      console.error("Transaction Fetch Error:", error);
      showToast("Failed to load transaction history", "red");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showToast("Enter a valid amount to withdraw", "red");
      return;
    }
    if (numAmount > credits) {
      showToast("Insufficient balance!", "red");
      return;
    }

    setIsActionLoading(true);
    try {
      await api.post("/payments/withdraw", { email: user.email, amount: numAmount * 100 });

      showToast("Withdrawal successful!", "green");
      setAmount("");
      if (resp) resp(); // Refresh profile data
    } catch (error) {
      console.error("Withdrawal Error:", error);
      showToast(error.message || "Withdrawal failed. Please try again.", "red");
    } finally {
      setIsActionLoading(false);
    }
  };

  const loadRazorPay = useCallback(() => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      showToast("Enter a valid amount to deposit", "red");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = handleDeposit;
    document.body.appendChild(script);
  }, [amount, showToast]);

  const handleDeposit = async () => {
    const depositAmount = parseFloat(amount) * 100;
    
    if (depositAmount > 50000000) {
      showToast("Maximum deposit amount is ₹500,000", "red");
      return;
    }

    setIsActionLoading(true);
    try {
      const result = await api.post("/payments", { amount: depositAmount });

      const options = {
        key: RAZORPAY_KEY_ID, 
        amount: `${result.amount}`,
        currency: "INR",
        name: "DevAuction",
        description: "Credit Deposit",
        image: photo,
        order_id: `${result.id}`,
        handler: function (response) {
          showToast("Payment successful! Updating balance...", "green");
          setTimeout(() => {
            if (resp) resp();
            setAmount("");
          }, 2000); // 2 second delay for webhook processing
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: { color: "#0CA3E7" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on("payment.failed", function (response) {
        showToast(`Payment failed: ${response.error.description}`, "red");
      });
    } catch (error) {
      console.error("Deposit Error:", error);
      showToast("Could not initiate payment. Please try again.", "red");
    } finally {
      setIsActionLoading(false);
    }
  };
;

  return (
    <section className="p-3" id="credits">
      <div className="mx-auto w-full border-[#0CA3E7]/20 bg-[#0f1325]/50 border flex items-center justify-between rounded-xl overflow-hidden relative">
        <div className="rounded-xl w-full bg-cover bg-center p-4 md:p-[16px]" style={{ backgroundImage: 'url("/Icons/craditeBG.png")' }}>
          <h4 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent mb-4">My Credits</h4>
          <div className="flex gap-4 flex-wrap items-center">
            <div className="bg-black/20 flex items-center rounded-xl text-lg px-4 py-2.5 border border-white/10 focus-within:border-[#0CA3E7]/40 transition-all shadow-inner">
              <span className="mr-2 text-[#0CA3E7] font-bold">₹</span>
              <input
                value={amount}
                type="number"
                placeholder="0.00"
                onChange={(e) => setAmount(e.target.value)}
                className="border-none w-32 md:w-48 text-lg outline-none bg-transparent text-white placeholder:text-gray-600"
                disabled={isActionLoading}
              />
            </div>

            <div className="flex gap-3">
              <GradientBtn
                placeholder={isActionLoading ? "..." : "Withdraw"}
                className="w-28 text-sm"
                onClick={handleWithdrawal}
                disabled={isActionLoading}
              />
              <GradientBtn
                placeholder={isActionLoading ? "..." : "Deposit"}
                className="w-28 text-sm"
                onClick={loadRazorPay}
                disabled={isActionLoading}
              />
            </div>
          </div>
          <p className="text-[#0CA3E7] font-semibold mt-4 text-xl">
            Available Balance: ₹ {credits.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="border-2 border-[#223534] rounded-lg py-4 bg-[#050b1e]/50">
          <div className="flex justify-between items-center px-6 mb-4">
            <h4 className="text-2xl font-semibold">Transaction History</h4>
            <GradientBtn
              placeholder={showtable ? "Hide" : "Show Transactions"}
              className="w-fit scale-90"
              onClick={fetchTransactions}
              disabled={isActionLoading}
            />
          </div>
          
          {showtable && (
            <div className="px-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <Transactions transactions={localTransactions.length > 0 ? localTransactions : trans} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Cradites;
