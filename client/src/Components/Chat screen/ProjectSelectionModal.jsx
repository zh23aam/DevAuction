import React, { useEffect, useState, useCallback } from "react";
import { RxCross2 } from "react-icons/rx";
import { ProgressSpinner } from "primereact/progressspinner";
import api from "../../utils/api";

const ProjectSelectionModal = ({ isOpen, onClose, senderEmail, receiverEmail, onSelect }) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("their"); // "my" or "their"
  const [myProjects, setMyProjects] = useState([]);
  const [theirProjects, setTheirProjects] = useState([]);

  const fetchProjects = useCallback(async (email, setter) => {
    if (!email) return;
    setLoading(true);
    try {
      const resp = await api.post("/profile/userProjects", { email });
      setter(resp?.userProjects || []);
    } catch (err) {
      console.error("Fetch Projects Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProjects(senderEmail, setMyProjects);
      fetchProjects(receiverEmail, setTheirProjects);
    }
  }, [isOpen, senderEmail, receiverEmail, fetchProjects]);

  if (!isOpen) return null;

  const currentProjects = activeTab === "my" ? myProjects : theirProjects;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#072643] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0CA3E7]/10">
          <h2 className="text-xl font-bold text-white">Share Project</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <RxCross2 size="1.5rem" className="text-white/70" />
          </button>
        </div>

        <div className="flex p-2 bg-[#05081B]/50 gap-2">
          <button
            onClick={() => setActiveTab("my")}
            className={`flex-1 py-2 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "my" ? "bg-[#0CA3E7] text-white shadow-lg" : "text-white/40 hover:text-white/60"
            }`}
          >
            My Projects
          </button>
          <button
            onClick={() => setActiveTab("their")}
            className={`flex-1 py-2 text-sm font-bold uppercase tracking-widest rounded-lg transition-all ${
              activeTab === "their" ? "bg-[#0CA3E7] text-white shadow-lg" : "text-white/40 hover:text-white/60"
            }`}
          >
            Their Projects
          </button>
        </div>

        <div className="flex-1 overflow-auto overflow-x-hidden p-4 pb-12 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <ProgressSpinner style={{ width: "30px", height: "30px" }} strokeWidth="4" />
              <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-bold">Scanning...</p>
            </div>
          ) : currentProjects.length === 0 ? (
            <div className="text-center py-12 opacity-30 select-none">
              <p className="text-sm font-medium">No projects found</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {currentProjects.map((project) => (
                <div
                  key={project.ProjectID}
                  onClick={() => onSelect(project)}
                  className="group flex gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#0CA3E7]/50 hover:bg-[#0CA3E7]/10 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 shrink-0">
                    <img
                      src={project.Image || "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80"}
                      alt={project.Title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex flex-col justify-center overflow-hidden min-w-0">
                    <h3 className="text-sm font-bold text-white group-hover:text-[#0CA3E7] transition-colors leading-snug line-clamp-2">
                      {project.Title}
                    </h3>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 font-bold">Project ID: {project.ProjectID}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectionModal;
