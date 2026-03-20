import React, { useEffect, useState, useCallback } from "react";
import Table from "./Table";
import PrimaryButton from "../Common/PrimaryButton";
import "./Preview.css";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import api from "../../utils/api";
import Badge from "../Common/Badge";
import { isImageOrVideo } from "../../utils/helpers";
import Makeoffer from "./Makeoffer";

const PreviewSec = ({ show, setshow, tableData, getProjectOffers }) => {
  const { user } = useAuth0();
  const navigate = useNavigate();
  const { id: projectID } = useParams();
  
  const [data, setdata] = useState(null);
  const [owner, setOwner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const projectData = await api.post("/gallery/getProjectById", { projectID });
      setdata(projectData);
      
      if (projectData.Owner) {
        const userData = await api.post("/profile", { email: projectData.Owner });
        setOwner(userData.userData);
      }
    } catch (error) {
      console.error("Load Preview Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [projectID]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const redirectToProfile = () => {
    if (owner?._id) {
      navigate(`/homepage/profile/${owner._id}`);
    }
  };

  return (
    <div className="w-full">
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8 items-start">
          {/* Main Content Column */}
          <div className="flex flex-col gap-6 animate-in slide-in-from-left duration-500">
            {/* Action Section (Moved to Top) */}
            {user?.email !== data.Owner && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 flex items-center justify-between backdrop-blur-md">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">Interested in this architect's work?</p>
                  <p className="text-sm font-black text-white leading-tight">Secure this project now</p>
                </div>
                <PrimaryButton 
                  label="Place Your Offer" 
                  onClick={() => setshow(!show)}
                  variant="primary"
                  className="!py-4 !px-8 shadow-xl"
                />
              </div>
            )}

            {/* Project Header Card */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-8 backdrop-blur-xl shadow-2xl overflow-visible">
              <div className="flex flex-col justify-between items-start gap-4 mb-3">
                <div className="flex-1 space-y-1">
                  <h1 className="text-lg md:text-xl font-black tracking-tight text-white leading-tight">
                    {data.Title}
                  </h1>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {data.Category && (
                      <Badge variant="primary" size="sm" className="bg-[#0CA3E7]/10 border-[#0CA3E7]/30">
                        {data.Category}
                      </Badge>
                    )}
                    {data.Tags?.map((tag, index) => (
                      <Badge key={index} variant="premium" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative border-t border-white/5 pt-4 mt-2">
                <p className={`text-gray-400 text-[11px] md:text-sm leading-relaxed text-justify ${!isExpanded ? "line-clamp-2" : ""}`}>
                  {data.Description}
                </p>
                {data.Description?.length > 100 && (
                  <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mt-2 text-[#0CA3E7] text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
                  >
                    {isExpanded ? "Show Less" : "Read More"}
                  </button>
                )}
              </div>
            </div>

            {/* Project Media Container */}
            <div className="group relative bg-[#0a0b1e] border-2 border-white/5 rounded-3xl overflow-hidden shadow-2xl ring-1 ring-[#0CA3E7]/20 hover:ring-[#0CA3E7]/40 transition-all duration-500">
              {/* Overlays */}
              <div className="absolute inset-x-0 top-0 p-3 md:p-4 flex justify-between items-start z-20 pointer-events-none">
                {/* Author Info */}
                <div 
                  className={`flex gap-3 items-center bg-black/60 backdrop-blur-xl border border-white/10 p-2 pr-5 rounded-full group/author transition-all hover:bg-black/80 pointer-events-auto ${owner ? "cursor-pointer" : "opacity-50"}`} 
                  onClick={redirectToProfile}
                >
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-full border-2 border-[#0CA3E7]/50 p-0.5 overflow-hidden shadow-lg">
                    {owner ? (
                      <img
                        className="w-full h-full object-cover rounded-full"
                        src={owner.UserInfo?.picture}
                        alt={owner.UserInfo?.name}
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 animate-pulse rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-[#0CA3E7] uppercase tracking-[0.2em] leading-none mb-1">Architect</p>
                    <p className="text-xs font-black text-white group-hover/author:text-[#0CA3E7] transition-colors tracking-tight leading-none">
                      {owner ? owner.UserInfo?.name : "Loading..."}
                    </p>
                  </div>
                </div>

                {/* Price Label */}
                <div className="bg-[#0CA3E7] text-white px-3 py-1.5 md:px-4 md:py-2 rounded-xl md:rounded-2xl shadow-xl flex flex-col items-center justify-center shrink-0 pointer-events-auto border border-white/10">
                  <span className="text-[6px] md:text-[7px] font-black uppercase tracking-[0.2em] opacity-80 leading-none mb-1">Price</span>
                  <span className="text-sm md:text-base font-black leading-none">&#8377; {data.OfferPrice}</span>
                </div>
              </div>

              {isImageOrVideo(data.Image) === "image" ? (
                <img
                  className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-700"
                  src={data.Image}
                  alt={data.Title}
                />
              ) : (
                <video
                  src={data.Image}
                  autoPlay
                  muted
                  loop
                  className="w-full aspect-video object-cover"
                ></video>
              )}
              
              <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <PrimaryButton 
                  label="Live Preview" 
                  onClick={() => window.open(data.Link)}
                  variant="gradient"
                  className="scale-110 !px-10"
                />
              </div>
            </div>

          </div>

          {/* Sidebar / Bidding Table Column */}
          <div className="h-full sticky top-28 animate-in slide-in-from-right duration-500">
            <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-2xl lg:min-h-[600px] flex flex-col">
              <div className="bg-[#0CA3E7]/10 p-5 border-b border-white/10">
                <h3 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
                  <span className="w-1.5 h-6 bg-[#0CA3E7] rounded-full inline-block"></span>
                  Bidding History
                </h3>
              </div>
              <div className="flex-1">
                <Table tableData={tableData} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewSec;
