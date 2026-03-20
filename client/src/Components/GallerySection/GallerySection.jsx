import React, { useCallback, useEffect, useState } from "react";
import LongCard from "./LongCard";
import "./Slider.css";
import { Link } from "react-router-dom";
import PrimaryButton from "../Common/PrimaryButton";
import { IoSearch } from "react-icons/io5";
import { ProgressSpinner } from "primereact/progressspinner";

import { isImageOrVideo, formatNumber } from "../../utils/helpers";
import api from "../../utils/api";
import EmptyState from "../Common/EmptyState";

const GallerySection = ({ displayToast }) => {
  const [data, setData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const categories = ["All", "Web", "Mobile", "UI/UX", "Blockchain", "SaaS"];
  const sortOptions = ["Newest", "Price: Low to High", "Price: High to Low", "Title: A-Z"];

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await api.get("/gallery/getProjects");
      setData(result || []);
      setProjects(result || []);
    } catch (error) {
      console.error("Fetch Gallery Error:", error);
      if (displayToast) displayToast("Failed to load gallery projects", "red");
    } finally {
      setIsLoading(false);
    }
  }, [displayToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearch = useCallback(() => {
    let filtered = [...data];

    // Filter by Search Text
    if (search.trim()) {
      const lower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.Title?.toLowerCase().includes(lower) || 
        p.Tags?.some(t => t.toLowerCase().includes(lower))
      );
    }

    // Filter by Category
    if (activeCategory !== "All") {
      filtered = filtered.filter(p => 
        p.Category === activeCategory || 
        p.Tags?.some(t => t.toLowerCase() === activeCategory.toLowerCase())
      );
    }

    // Sorting Logic
    if (sortBy === "Price: Low to High") {
      filtered.sort((a, b) => (a.OfferPrice || 0) - (b.OfferPrice || 0));
    } else if (sortBy === "Price: High to Low") {
      filtered.sort((a, b) => (b.OfferPrice || 0) - (a.OfferPrice || 0));
    } else if (sortBy === "Title: A-Z") {
      filtered.sort((a, b) => (a.Title || "").localeCompare(b.Title || ""));
    } else if (sortBy === "Newest") {
      filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    setProjects(filtered);
  }, [search, activeCategory, sortBy, data]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  return (
    <div className="min-h-[600px]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 py-6 px-4 md:px-12 bg-[#050618]/60 border-b border-white/5 backdrop-blur-3xl sticky top-[82px] z-30 transition-all duration-300">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-2 px-2 order-2 lg:order-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                activeCategory === cat 
                ? "bg-[#0CA3E7] text-white shadow-lg shadow-[#0CA3E7]/40 border border-[#0CA3E7]/50 scale-105" 
                : "bg-white/5 text-gray-500 hover:bg-white/10 hover:text-white border border-white/5"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-2xl group order-1 lg:order-2 flex items-center gap-3 overflow-visible">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-[#0CA3E7] transition-colors">
              <IoSearch size={18} />
            </div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full py-3 px-14 rounded-xl bg-black/40 border border-white/5 focus:border-[#0CA3E7]/40 text-white transition-all outline-none placeholder:text-gray-600 shadow-inner text-sm"
              placeholder="Search assets..."
            />
          </div>
          
          <div className="relative overflow-visible">
            <PrimaryButton 
              label="Filter" 
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="!px-6 !py-3 !text-[10px] border-none !rounded-xl h-full shadow-lg"
              variant="primary"
            />
            
            {showSortMenu && (
              <div className="absolute right-0 mt-3 w-56 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-2 border-b border-white/5 bg-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#0CA3E7] px-3">Sort By</span>
                </div>
                {sortOptions.map(opt => (
                  <button
                    key={opt}
                    onClick={() => { setSortBy(opt); setShowSortMenu(false); }}
                    className={`w-full text-left px-5 py-3 text-xs font-semibold transition-colors ${
                      sortBy === opt ? "text-[#0CA3E7] bg-[#0CA3E7]/5" : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 px-4 md:px-12">
        {isLoading ? (
          <div className="h-[400px] flex flex-col items-center justify-center gap-6">
            <ProgressSpinner style={{width: '50px', height: '50px'}} strokeWidth="4" />
            <p className="text-gray-500 font-bold tracking-[0.2em] uppercase text-xs animate-pulse">Scanning the Grid...</p>
          </div>
        ) : (
          <div className="w-full">
          {projects.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
              {projects.map((project, index) => (
                <Link key={project.ProjectID || index} to={`preview/${project.ProjectID}`} className="block break-inside-avoid animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${index * 50}ms` }}>
                  <LongCard
                    assetSrc={project.Image}
                    offerPrice={formatNumber(project.OfferPrice)}
                    title={project.Title}
                    type={isImageOrVideo(project.Image)}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState 
              title="No projects found" 
              description="Try searching for a different tag or keyword"
              actionText="Clear Search"
              onAction={() => { 
                setSearch(""); 
                setActiveCategory("All");
                setProjects(data); 
              }}
            />
          )}
        </div>
      )}
    </div>
  </div>
);
};

export default GallerySection;
