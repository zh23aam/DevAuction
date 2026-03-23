import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../utils/api';
import ErrorBoundary from '../Components/Common/ErrorBoundary';
import ErrorSection from '../Components/Common/ErrorSection';
import { AuctionProvider, useAuction } from '../context/AuctionContext';
import { ChatProvider, useChat } from '../context/ChatContext';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import { useSocketAuction } from '../hooks/useSocketAuction';
import VideoGrid from '../Components/video/VideoGrid';
import VideoTile from '../Components/video/VideoTile';
import BidPanel from '../Components/bidding/BidPanel';
import TimerDisplay from '../Components/bidding/TimerDisplay';
import AuctionControls from '../Components/bidding/AuctionControls';
import BidHistory from '../Components/bidding/BidHistory';
import ChatPanel from '../Components/chat/ChatPanel';
import PreJoinScreen from '../Components/Room/PreJoinScreen';

import { MdVideocam, MdVideocamOff, MdMic, MdMicOff, MdChat, MdHistory, MdEmojiEmotions, MdExitToApp, MdWifiOff } from 'react-icons/md';
import { FiUsers } from 'react-icons/fi';
import { HiOutlineCurrencyDollar } from 'react-icons/hi';
import { BsHandThumbsUp, BsHeart, BsFire } from 'react-icons/bs';
import { FaRegLaughBeam, FaRegHandPeace } from 'react-icons/fa';
import { RiAuctionLine } from 'react-icons/ri';

// ─── Reaction config ───────────────────────────────────────────────────────
const REACTIONS = [
  { icon: BsHandThumbsUp, value: '👍' },
  { icon: BsHeart,        value: '❤️' },
  { icon: FaRegLaughBeam, value: '😂' },
  { icon: BsFire,         value: '🔥' },
  { icon: FaRegHandPeace, value: '👏' },
];

// ─── Drawer Header ─────────────────────────────────────────────────────────
function DrawerHeader({ title, onClose }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
      <h3 className="text-white font-semibold text-base">{title}</h3>
      <button onClick={onClose} className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-colors text-xl leading-none">×</button>
    </div>
  );
}

// ─── Inner Room ────────────────────────────────────────────────────────────
function AuctionRoomContent({ auctionId, userRole, auctionTitle, preJoinTracks }) {
  const { state: auctionState, addError: addAuctionError, clearErrors } = useAuction();
  const { state: chatState } = useChat();

  const { participants, localParticipant, isConnected: isLiveKitConnected, error: liveKitError, isCameraEnabled: isCameraOn, isMicEnabled: isMicOn, toggleCamera, toggleMicrophone, disconnect: disconnectLiveKit } = useLiveKitRoom(auctionId, userRole, preJoinTracks);
  const { isConnected: isSocketConnected, error: socketError, isHostPresent, submitBid, startAuction, pauseAuction, resumeAuction, endAuction, sendMessage, sendReaction, deleteMessage: deleteMessageSocket } = useSocketAuction(auctionId, userRole);

  const [activeDrawer, setActiveDrawer] = useState(null);
  const [rightTab, setRightTab]         = useState('chat');
  const [latestBid, setLatestBid]       = useState(null);
  const [isMobile, setIsMobile]         = useState(window.innerWidth < 768);
  const hasEverConnectedRef = useRef(false);
  const navigate = useNavigate();

  const isConnected  = isLiveKitConnected && isSocketConnected;
  const hasErrors    = auctionState.errors?.length > 0;
  const isWaitingForHost = !isHostPresent && userRole !== 'host';
  const isWaiting    = isWaitingForHost;
  const isEnded      = auctionState.auctionStatus === 'ended';
  const allParticipants = localParticipant ? [localParticipant, ...participants] : participants;

  useEffect(() => { const fn = () => setIsMobile(window.innerWidth < 768); window.addEventListener('resize', fn); return () => window.removeEventListener('resize', fn); }, []);
  useEffect(() => { if (isLiveKitConnected && isSocketConnected) hasEverConnectedRef.current = true; }, [isLiveKitConnected, isSocketConnected]);
  useEffect(() => { if (liveKitError) addAuctionError(liveKitError); }, [liveKitError, addAuctionError]);
  useEffect(() => { if (socketError) addAuctionError(socketError); }, [socketError, addAuctionError]);
  useEffect(() => {
    if (auctionState.bids?.length > 0) {
      setLatestBid(auctionState.bids[auctionState.bids.length - 1]);
      const t = setTimeout(() => setLatestBid(null), 3000);
      return () => clearTimeout(t);
    }
  }, [auctionState.bids]);

  const handleLeave    = useCallback(async () => {
    try {
      await disconnectLiveKit();
    } catch (e) {}
    // Belt-and-suspenders: stop any lingering getUserMedia streams
    try {
      if (window._activeMediaStream) {
        window._activeMediaStream.getTracks().forEach(t => t.stop());
        window._activeMediaStream = null;
      }
    } catch (e) {}
    navigate('/homepage/auction');
  }, [disconnectLiveKit, navigate]);
  const handleEnd      = useCallback(() => endAuction(), [endAuction]);
  const toggleDrawer   = (name) => setActiveDrawer(prev => prev === name ? null : name);

  const getParticipantTracks = (p) => {
    const vp = p?.getTrackPublication?.('camera') || Array.from(p?.videoTrackPublications?.values() || [])[0];
    const ap = p?.getTrackPublication?.('microphone') || Array.from(p?.audioTrackPublications?.values() || [])[0];
    return { videoTrack: vp?.track || null, audioTrack: ap?.track || null };
  };

  const renderVideoTile = useCallback((participant, isActive) => {
    const isLocal = participant === localParticipant;
    const lkp = isLocal ? localParticipant : participant;
    const { videoTrack, audioTrack } = getParticipantTracks(lkp);
    return (
      <VideoTile
        key={lkp?.identity || 'local'}
        participant={{ userId: lkp?.identity || '', displayName: lkp?.name || lkp?.identity || 'You', videoTrack, audioTrack }}
        isActive={isActive} isLocal={isLocal} isMuted={false} connectionQuality="good"
      />
    );
  }, [localParticipant]);

  // ─ Loading / Waiting ──────────────────────────
  if (!isConnected && !liveKitError && !socketError && !hasEverConnectedRef.current) return (
    <div className="flex h-screen bg-gray-950 items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400">Connecting to auction room…</p>
      </div>
    </div>
  );

  if (isWaiting) return (
    <div className="relative w-full h-screen bg-gray-950 overflow-hidden">
      <div className="absolute inset-0">
        {localParticipant && (
          <VideoGrid
            participants={[localParticipant]}
            localParticipant={localParticipant}
            activeSpearker={null}
            isMobile={isMobile}
            renderVideoTile={renderVideoTile}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl px-8 py-6 max-w-sm w-full border border-gray-700/50">
          <h2 className="text-white text-xl font-bold mb-1">{auctionTitle || 'Live Auction'}</h2>
          <p className="text-gray-400 text-sm mb-4">Waiting for the host to join…</p>
          <div className="w-8 h-8 rounded-full animate-spin mx-auto mb-4 border-yellow-500 border-t-transparent" style={{ borderWidth: 3, borderStyle: 'solid' }} />
          <div className="flex items-center justify-center gap-2 text-gray-400 text-xs">
            <FiUsers className="text-base" />
            <span>{allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''} connected</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        <button onClick={toggleCamera} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${isCameraOn ? 'bg-gray-700/90 text-white' : 'bg-red-600/90 text-white'}`}>
          {isCameraOn ? <MdVideocam className="text-base" /> : <MdVideocamOff className="text-base" />}
          {isCameraOn ? 'Camera On' : 'Camera Off'}
        </button>
        <button onClick={toggleMicrophone} className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${isMicOn ? 'bg-gray-700/90 text-white' : 'bg-red-600/90 text-white'}`}>
          {isMicOn ? <MdMic className="text-base" /> : <MdMicOff className="text-base" />}
          {isMicOn ? 'Mic On' : 'Muted'}
        </button>
        <button onClick={handleLeave} className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold bg-red-900/70 text-red-300 hover:bg-red-800 transition-colors">
          <MdExitToApp className="text-base" /> Leave
        </button>
      </div>
    </div>
  );

  // ─ Shared overlays ────────────────────────────
  const BidToast = latestBid && (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
      <div className="flex items-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold text-sm shadow-xl animate-bounce">
        <HiOutlineCurrencyDollar className="text-lg" />
        New bid: ${latestBid.amount?.toFixed(2)}
      </div>
    </div>
  );

  const ReconnectBanner = liveKitError && (
    <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-sm px-4 py-2 flex justify-between items-center z-50">
      <span className="flex items-center gap-2"><MdWifiOff /> Video connection lost</span>
      <button onClick={() => window.location.reload()} className="bg-white text-red-600 px-3 py-1 rounded text-xs font-bold">Reconnect</button>
    </div>
  );

  const EndedOverlay = isEnded && (
    <div className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-sm w-full text-center border border-yellow-500/40 shadow-2xl">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-yellow-400 text-2xl font-bold mb-3">Auction Ended</h2>
        {auctionState.highestBidderName ? (
          <div className="space-y-1 mb-6">
            <p className="text-gray-400 text-sm uppercase tracking-widest">Winner</p>
            <p className="text-white text-xl font-bold">{auctionState.highestBidderName}</p>
            <p className="text-gray-300 text-base mt-2">Final Bid: <span className="text-yellow-400 font-bold">${auctionState.currentHighestBid?.toFixed(2)}</span></p>
          </div>
        ) : <p className="text-gray-400 mb-6">No bids were placed</p>}
        <button onClick={handleLeave} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl transition-colors">
          {userRole === 'host' ? 'Close Room' : 'Leave Room'}
        </button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────
  // MOBILE
  // ─────────────────────────────────────────────
  if (isMobile) return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">

      {/* Video fills screen above action bar */}
      <div className="absolute inset-0" style={{ bottom: 56 }}>
        <VideoGrid participants={allParticipants} localParticipant={localParticipant} activeSpearker={auctionState.activeSpeakerId} isMobile renderVideoTile={renderVideoTile} />
      </div>

      {ReconnectBanner}
      {BidToast}

      {/* Timer */}
      <div className="absolute top-3 right-3 z-20 bg-black/60 backdrop-blur-sm rounded-xl overflow-hidden">
        <TimerDisplay remainingSeconds={auctionState.remainingSeconds} auctionStatus={auctionState.auctionStatus} />
      </div>

      {/* Error toasts */}
      {hasErrors && (
        <div className="absolute top-16 left-3 right-3 z-30 space-y-1">
          {auctionState.errors.map((err, i) => (
            <div key={i} className="bg-red-900/90 text-white text-xs px-3 py-2 rounded-lg flex justify-between">
              <span>{err}</span><button onClick={clearErrors} className="ml-2 text-red-300">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Action bar — 56px tall, fixed at very bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gray-950 border-t border-gray-800 z-20 flex items-center justify-around px-1">
        {/* Camera toggle */}
        <button
          onClick={toggleCamera}
          className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${isCameraOn ? 'text-gray-300' : 'text-red-400'}`}
        >
          {isCameraOn ? <MdVideocam className="text-xl" /> : <MdVideocamOff className="text-xl" />}
          <span>{isCameraOn ? 'Cam' : 'Cam Off'}</span>
        </button>

        {/* Mic toggle */}
        <button
          onClick={toggleMicrophone}
          className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${isMicOn ? 'text-gray-300' : 'text-red-400'}`}
        >
          {isMicOn ? <MdMic className="text-xl" /> : <MdMicOff className="text-xl" />}
          <span>{isMicOn ? 'Mic' : 'Muted'}</span>
        </button>

        {REACTIONS.map(({ icon: Icon, value }) => (
          <button key={value} onClick={() => sendReaction(value)} className="flex items-center justify-center w-9 h-9 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 active:scale-125 transition-all">
            <Icon className="text-lg" />
          </button>
        ))}

        {userRole === 'host' && (
          <button onClick={() => toggleDrawer('controls')} className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${activeDrawer === 'controls' ? 'text-orange-400' : 'text-gray-400'}`}>
            <RiAuctionLine className="text-xl" /><span>Controls</span>
          </button>
        )}

        {userRole !== 'host' && (
          <button onClick={() => toggleDrawer('bid')} className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${activeDrawer === 'bid' ? 'text-yellow-400' : 'text-gray-400'}`}>
            <HiOutlineCurrencyDollar className="text-xl" /><span>Bid</span>
          </button>
        )}

        <button onClick={() => toggleDrawer('chat')} className={`flex flex-col items-center gap-0.5 text-[10px] relative transition-colors ${activeDrawer === 'chat' ? 'text-blue-400' : 'text-gray-400'}`}>
          <MdChat className="text-xl" /><span>Chat</span>
          {chatState.messages.length > 0 && <span className="absolute -top-0.5 right-0 bg-blue-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">{chatState.messages.length > 9 ? '9+' : chatState.messages.length}</span>}
        </button>

        <button onClick={() => toggleDrawer('history')} className={`flex flex-col items-center gap-0.5 text-[10px] transition-colors ${activeDrawer === 'history' ? 'text-green-400' : 'text-gray-400'}`}>
          <MdHistory className="text-xl" /><span>Bids</span>
        </button>

        {userRole !== 'host' && (
          <button onClick={handleLeave} className="flex flex-col items-center gap-0.5 text-[10px] text-red-400">
            <MdExitToApp className="text-xl" /><span>Leave</span>
          </button>
        )}
      </div>

      {/* Drawer backdrop */}
      {activeDrawer && <div className="absolute inset-0 bg-black/50 z-25" onClick={() => setActiveDrawer(null)} />}

      {/* Controls Drawer */}
      {activeDrawer === 'controls' && userRole === 'host' && (
        <div className="absolute bottom-14 left-0 right-0 z-30 bg-gray-900 rounded-t-2xl max-h-[60vh] overflow-y-auto">
          <DrawerHeader title="Auction Controls" onClose={() => setActiveDrawer(null)} />
          <div className="p-4"><AuctionControls auctionStatus={auctionState.auctionStatus} userRole={userRole} onStart={startAuction} onPause={pauseAuction} onResume={resumeAuction} onEnd={handleEnd} /></div>
        </div>
      )}

      {/* Bid Drawer */}
      {activeDrawer === 'bid' && userRole !== 'host' && (
        <div className="absolute bottom-14 left-0 right-0 z-30 bg-gray-900 rounded-t-2xl max-h-[60vh] overflow-y-auto">
          <DrawerHeader title="Place Bid" onClose={() => setActiveDrawer(null)} />
          <div className="p-4">
            <div className="mb-4 px-3 py-2 bg-gray-800 rounded-xl flex justify-between items-center">
              <span className="text-gray-400 text-xs">Current Bid</span>
              <span className="text-yellow-400 font-bold">${(auctionState.currentHighestBid || 0).toFixed(2)}</span>
            </div>
            <BidPanel userRole={userRole} auctionId={auctionId} submitBid={submitBid} socketError={socketError} />
          </div>
        </div>
      )}

      {/* Chat Drawer */}
      {activeDrawer === 'chat' && (
        <div className="absolute bottom-14 left-0 right-0 z-30 bg-gray-900 rounded-t-2xl max-h-[70vh] flex flex-col">
          <DrawerHeader title="Chat" onClose={() => setActiveDrawer(null)} />
          <div className="flex-1 overflow-hidden">
            <ChatPanel messages={chatState.messages} userRole={userRole} auctionStatus={auctionState.auctionStatus} onSendMessage={sendMessage} onDeleteMessage={deleteMessageSocket} />
          </div>
        </div>
      )}

      {/* History Drawer */}
      {activeDrawer === 'history' && (
        <div className="absolute bottom-14 left-0 right-0 z-30 bg-gray-900 rounded-t-2xl max-h-[60vh] overflow-y-auto">
          <DrawerHeader title={`Bid History (${auctionState.bids?.length || 0})`} onClose={() => setActiveDrawer(null)} />
          <div className="p-4"><BidHistory bids={auctionState.bids} auctionStatus={auctionState.auctionStatus} highestBidderId={auctionState.highestBidderId} highestBidderName={auctionState.highestBidderName} /></div>
        </div>
      )}

      {EndedOverlay}
    </div>
  );

  // ─────────────────────────────────────────────
  // DESKTOP
  // ─────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">

      {/* Left */}
      <div className="flex-1 relative flex flex-col min-w-0">
        {ReconnectBanner}
        <div className="flex-1 relative bg-black overflow-hidden">
          <VideoGrid participants={allParticipants} localParticipant={localParticipant} activeSpearker={auctionState.activeSpeakerId} isMobile={false} renderVideoTile={renderVideoTile} />
          {BidToast}
        </div>

        {hasErrors && (
          <div className="absolute top-12 left-4 right-4 z-30 space-y-1">
            {auctionState.errors.map((err, i) => (
              <div key={i} className="bg-red-900/90 text-white text-sm px-4 py-2 rounded-lg flex justify-between items-center">
                <span>{err}</span><button onClick={clearErrors} className="ml-3 text-red-300 text-lg">×</button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gray-900 border-t border-gray-800 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            <button onClick={toggleCamera} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isCameraOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
              {isCameraOn ? <MdVideocam /> : <MdVideocamOff />} {isCameraOn ? 'Camera On' : 'Camera Off'}
            </button>
            <button onClick={toggleMicrophone} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isMicOn ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-red-600 hover:bg-red-500 text-white'}`}>
              {isMicOn ? <MdMic /> : <MdMicOff />} {isMicOn ? 'Mic On' : 'Muted'}
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm"><FiUsers /><span>{allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''}</span></div>
          {userRole !== 'host' && (
            <button onClick={handleLeave} className="flex items-center gap-2 px-4 py-2 bg-red-900/40 hover:bg-red-800/60 text-red-400 hover:text-red-300 rounded-lg text-sm font-medium transition-colors border border-red-800/50">
              <MdExitToApp /> Leave Auction
            </button>
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="w-80 xl:w-96 bg-gray-900 border-l border-gray-800 flex flex-col overflow-hidden shrink-0">
        <div className="shrink-0 border-b border-gray-800">
          <TimerDisplay remainingSeconds={auctionState.remainingSeconds} auctionStatus={auctionState.auctionStatus} />
        </div>

        {userRole === 'host' && (
          <div className="shrink-0 px-4 py-3 border-b border-gray-800 bg-gray-800/40">
            <AuctionControls auctionStatus={auctionState.auctionStatus} userRole={userRole} onStart={startAuction} onPause={pauseAuction} onResume={resumeAuction} onEnd={handleEnd} />
          </div>
        )}

        <div className="shrink-0 px-4 py-3 border-b border-gray-800 bg-gray-800/20">
          <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">Current Bid</p>
          <p className="text-yellow-400 text-2xl font-bold leading-none">${(auctionState.currentHighestBid || 0).toFixed(2)}</p>
          {auctionState.highestBidderName && <p className="text-gray-500 text-xs mt-1.5">by {auctionState.highestBidderName}</p>}
        </div>

        {userRole !== 'host' && (
          <div className="shrink-0 px-4 py-3 border-b border-gray-800">
            <BidPanel userRole={userRole} auctionId={auctionId} submitBid={submitBid} socketError={socketError} />
          </div>
        )}

        <div className="shrink-0 flex border-b border-gray-800 bg-gray-900">
          {[
            { id: 'chat',      Icon: MdChat,         label: 'Chat',                                      badge: chatState.messages.length, color: 'text-blue-400 border-blue-400' },
            { id: 'history',   Icon: MdHistory,      label: `Bids (${auctionState.bids?.length || 0})`,  color: 'text-green-400 border-green-400' },
            { id: 'reactions', Icon: MdEmojiEmotions, label: 'React',                                    color: 'text-purple-400 border-purple-400' },
          ].map(({ id, Icon, label, badge, color }) => (
            <button key={id} onClick={() => setRightTab(id)} className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium border-b-2 relative transition-colors ${rightTab === id ? `${color} border-current` : 'text-gray-500 border-transparent hover:text-gray-300'}`}>
              <Icon className="text-sm" />{label}
              {badge > 0 && rightTab !== id && <span className="absolute top-1 right-1 bg-blue-500 text-white text-[9px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">{badge > 9 ? '9+' : badge}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-hidden">
          {rightTab === 'chat' && <ChatPanel messages={chatState.messages} userRole={userRole} auctionStatus={auctionState.auctionStatus} onSendMessage={sendMessage} onDeleteMessage={deleteMessageSocket} />}
          {rightTab === 'history' && <div className="h-full overflow-y-auto"><BidHistory bids={auctionState.bids} auctionStatus={auctionState.auctionStatus} highestBidderId={auctionState.highestBidderId} highestBidderName={auctionState.highestBidderName} /></div>}
          {rightTab === 'reactions' && (
            <div className="p-4 space-y-3">
              <p className="text-gray-500 text-xs uppercase tracking-wider">Send a reaction</p>
              <div className="grid grid-cols-5 gap-2">
                {REACTIONS.map(({ icon: Icon, value }) => (
                  <button key={value} onClick={() => sendReaction(value)} className="flex items-center justify-center h-11 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-all active:scale-110 text-xl">
                    <Icon />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {EndedOverlay}
    </div>
  );
}

// ─── Outer Shell ───────────────────────────────────────────────────────────
function AuctionRoom() {
  const { auctionId } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: isAuth0Loading } = useAuth0();

  const [userRole, setUserRole]       = useState(null);
  const [auctionTitle, setAuctionTitle] = useState('');
  const [isLoading, setIsLoading]     = useState(true);
  const [error, setError]             = useState(null);
  const [hasJoined, setHasJoined]     = useState(false);
  const [preJoinTracks, setPreJoinTracks] = useState(null);

  useEffect(() => {
    if (isAuth0Loading) return;
    if (!user?.email) { setError('User not authenticated'); setIsLoading(false); return; }
    api.post('/livestream/roomDetails', { roomId: auctionId })
      .then(roomData => { setUserRole(roomData.Owner === user.email ? 'host' : 'bidder'); setAuctionTitle(roomData.Title || 'Live Auction'); setIsLoading(false); })
      .catch(() => { setError('Failed to load auction room'); setIsLoading(false); });
  }, [user, auctionId, isAuth0Loading]);

  if (isLoading) return (
    <div className="flex h-screen bg-gray-950 items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-400">Loading auction room…</p>
      </div>
    </div>
  );

  if (error) return <ErrorBoundary><ErrorSection title="Failed to Load Auction Room" message={error} onRetry={() => window.location.reload()} /></ErrorBoundary>;
  if (!auctionId || !userRole) return <ErrorBoundary><ErrorSection title="Invalid Auction Room" message="Auction ID or user role is missing." onRetry={() => window.location.reload()} /></ErrorBoundary>;

  if (!hasJoined) return (
    <ErrorBoundary>
      <PreJoinScreen
        auctionTitle={auctionTitle}
        onJoin={(tracks) => { setPreJoinTracks(tracks); setHasJoined(true); }}
        onCancel={() => navigate(-1)}
      />
    </ErrorBoundary>
  );

  return (
    <ErrorBoundary>
      <AuctionProvider>
        <ChatProvider>
          <AuctionRoomContent auctionId={auctionId} userRole={userRole} auctionTitle={auctionTitle} preJoinTracks={preJoinTracks} />
        </ChatProvider>
      </AuctionProvider>
    </ErrorBoundary>
  );
}

export default AuctionRoom;