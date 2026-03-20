import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaExternalLinkAlt } from "react-icons/fa";

const ProjectCard = ({ project, isFromMe }) => {
  const navigate = useNavigate();
  return (
    <div 
      className={`flex flex-col gap-3 p-3 rounded-2xl w-full sm:min-w-[280px] max-w-[320px] shadow-2xl transition-all hover:scale-[1.02] cursor-default border border-white/10 ${
        isFromMe ? "bg-[#0CA3E7]/20" : "bg-white/5"
      }`}
    >
      <div className="relative h-32 w-full rounded-xl overflow-hidden group">
        <img 
          src={project.image || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80"} 
          alt={project.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
          <p className="text-xs font-bold text-white uppercase tracking-widest truncate">{project.title}</p>
        </div>
      </div>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/homepage/gallery/project-details/${project.id}`);
        }}
        className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white/10 hover:bg-[#0CA3E7] text-white text-xs font-bold transition-all active:scale-95 group"
      >
        <span>View Project</span>
        <FaExternalLinkAlt size="0.7rem" className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </button>
    </div>
  );
};

export default function ChatBtn({ msg, sender, time }) {
  const isFromMe = sender?.toLowerCase() !== "from";

  let projectData = null;
  if (msg?.startsWith("[PROJECT_MENTION]")) {
    try {
      projectData = JSON.parse(msg.replace("[PROJECT_MENTION]", ""));
    } catch (e) {
      console.error("Parse Project Error:", e);
    }
  }

  const renderContent = () => {
    if (projectData) {
      return <ProjectCard project={projectData} isFromMe={isFromMe} />;
    }
    return <span className="text-sm leading-relaxed whitespace-pre-wrap">{msg}</span>;
  };

  return (
    <div
      className={`w-fit max-w-[85%] p-2.5 px-4 rounded-2xl relative group ${
        isFromMe ? "ml-auto" : ""
      } flex flex-col gap-1`}
      style={{
        backgroundImage: isFromMe
          ? "linear-gradient(to bottom, rgba(12, 163, 231, 0.1), rgba(12, 163, 231, 0.6))"
          : "linear-gradient(to bottom, rgba(186, 233, 254, 0.05), rgba(186, 233, 254, 0.4))",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        boxShadow: isFromMe ? "0 4px 12px rgba(12, 163, 231, 0.2)" : "0 4px 12px rgba(0, 0, 0, 0.2)",
      }}
    >
      {renderContent()}
      <span className={`text-[9px] text-white/40 font-bold uppercase tracking-widest ${
        isFromMe ? "text-right ml-auto" : "text-left mr-auto"
      }`}>
        {time}
      </span>
    </div>
  );
}
