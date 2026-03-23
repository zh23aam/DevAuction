import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { MdOutlineGavel, MdArrowBack, MdEmojiEvents } from 'react-icons/md';
import { HiOutlineCurrencyDollar, HiOutlineUsers } from 'react-icons/hi';
import { BsFillCalendarDateFill, BsGraphUp } from 'react-icons/bs';
import { RiAuctionLine } from 'react-icons/ri';
import { FiClock } from 'react-icons/fi';

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex flex-col gap-2 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accent}`}>
        <Icon className="text-lg text-white" />
      </div>
      <p className="text-gray-400 text-xs uppercase tracking-widest">{label}</p>
      <p className="text-white text-xl font-bold leading-none">{value}</p>
    </div>
  );
}

// ── Bid row ────────────────────────────────────────────────────────────────
function BidRow({ bid, index, isWinner }) {
  const time = bid.serverTimestamp
    ? new Date(bid.serverTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
      isWinner
        ? 'bg-yellow-500/10 border border-yellow-500/30'
        : index % 2 === 0 ? 'bg-white/3' : 'bg-transparent'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold w-6 text-center ${isWinner ? 'text-yellow-400' : 'text-gray-600'}`}>
          {isWinner ? '🥇' : `#${index + 1}`}
        </span>
        <div>
          <p className={`text-sm font-semibold ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
            {bid.bidderName || bid.bidderId || 'Anonymous'}
            {isWinner && <span className="ml-2 text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded-full uppercase tracking-wide">Winner</span>}
          </p>
          <p className="text-gray-500 text-xs flex items-center gap-1">
            <FiClock className="text-[10px]" /> {time}
          </p>
        </div>
      </div>
      <span className={`font-bold text-base ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
        ${typeof bid.amount === 'number' ? bid.amount.toFixed(2) : bid.amount}
      </span>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function AuctionSummary() {
  const { auctionId } = useParams();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoading(true);
        const data = await api.get(`/api/auctions/${auctionId}/summary`);
        setSummary(data);
      } catch (err) {
        setError(err.message || 'Failed to load auction summary');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, [auctionId]);

  // ── Loading ──
  if (isLoading) return (
    <div className="min-h-screen bg-[#050618] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400">Loading auction summary…</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="min-h-screen bg-[#050618] flex items-center justify-center">
      <div className="text-center space-y-4">
        <RiAuctionLine className="text-gray-600 text-5xl mx-auto" />
        <p className="text-gray-400">{error}</p>
        <button onClick={() => navigate('/homepage/auction')} className="text-blue-400 hover:text-blue-300 text-sm underline">
          Back to auctions
        </button>
      </div>
    </div>
  );

  const {
    title,
    description,
    imgSrc,
    owner,
    date,
    status,
    winnerName,
    winnerBid,
    totalBids,
    startingBid,
    minimumIncrement,
    bids = [],
    duration,
  } = summary || {};

  const hasWinner = winnerName && winnerBid > 0;
  const sortedBids = [...bids].reverse(); // most recent first for display, winner on top

  return (
    <div className="min-h-screen bg-[#050618] text-white">

      {/* ── Hero banner ── */}
      <div className="relative w-full h-56 md:h-72 overflow-hidden">
        {imgSrc ? (
          <img src={imgSrc} alt={title} className="w-full h-full object-cover opacity-40" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-indigo-900 to-purple-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050618] via-[#050618]/60 to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate('/homepage/auction')}
          className="absolute top-5 left-5 flex items-center gap-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm border border-white/10 px-3 py-2 rounded-xl text-sm text-gray-300 hover:text-white transition-all"
        >
          <MdArrowBack /> Back
        </button>

        {/* Closed badge */}
        <div className="absolute top-5 right-5 flex items-center gap-1.5 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/30">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Closed</span>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-5 left-5 right-5">
          <h1 className="text-2xl md:text-3xl font-bold leading-tight line-clamp-2">{title || 'Auction Summary'}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">
                {owner?.charAt(0).toUpperCase() || 'H'}
              </div>
              {owner || '—'}
            </div>
            {date && (
              <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                <BsFillCalendarDateFill className="text-blue-400" />
                {date}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-8">

        {/* Winner card */}
        <div className={`rounded-2xl p-6 border text-center ${
          hasWinner
            ? 'bg-yellow-500/8 border-yellow-500/30'
            : 'bg-white/5 border-white/10'
        }`}>
          {hasWinner ? (
            <>
              <MdEmojiEvents className="text-yellow-400 text-5xl mx-auto mb-3" />
              <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Winner</p>
              <p className="text-white text-2xl font-bold">{winnerName}</p>
              <p className="text-yellow-400 text-3xl font-extrabold mt-2">
                ${typeof winnerBid === 'number' ? winnerBid.toFixed(2) : winnerBid}
              </p>
              <p className="text-gray-500 text-xs mt-1">Final winning bid</p>
            </>
          ) : (
            <>
              <MdOutlineGavel className="text-gray-600 text-4xl mx-auto mb-3" />
              <p className="text-gray-400 text-base font-medium">No bids were placed</p>
              <p className="text-gray-600 text-sm mt-1">This auction closed without a winner</p>
            </>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={MdOutlineGavel}
            label="Total Bids"
            value={totalBids ?? bids.length}
            accent="bg-blue-500/80"
          />
          <StatCard
            icon={HiOutlineCurrencyDollar}
            label="Starting Bid"
            value={`$${(startingBid || 0).toFixed(2)}`}
            accent="bg-purple-500/80"
          />
          <StatCard
            icon={BsGraphUp}
            label="Min Increment"
            value={`$${(minimumIncrement || 0).toFixed(2)}`}
            accent="bg-indigo-500/80"
          />
          <StatCard
            icon={FiClock}
            label="Duration"
            value={duration ? `${Math.floor(duration / 60)}m` : '60m'}
            accent="bg-pink-500/80"
          />
        </div>

        {/* Description */}
        {description && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
            <p className="text-gray-400 text-xs uppercase tracking-widest mb-2">About this auction</p>
            <p className="text-gray-300 text-sm leading-relaxed">{description}</p>
          </div>
        )}

        {/* Bid timeline */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <MdOutlineGavel className="text-yellow-400" /> Bid History
            </h2>
            <span className="text-gray-500 text-sm">{bids.length} bid{bids.length !== 1 ? 's' : ''} total</span>
          </div>

          {sortedBids.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <MdOutlineGavel className="text-4xl mx-auto mb-3 opacity-40" />
              <p>No bids were placed in this auction</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sortedBids.map((bid, idx) => (
                <BidRow
                  key={bid.id || idx}
                  bid={bid}
                  index={idx}
                  isWinner={idx === 0 && hasWinner}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}