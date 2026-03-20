import React, { useRef, useState } from "react";
import background from "../../assets/AuctionroomImages/Rectangle.png";
import GradientBtn from "../Buttons/GradientBtn";
import { useAuth0 } from "@auth0/auth0-react";
import { IoAdd, IoClose } from "react-icons/io5";
import { IoIosArrowBack } from "react-icons/io";
import api from "../../utils/api";
import { useToast } from "../../context/ToastContext";

const CreateProject = ({ show, setshow, refreshData }) => {
  const { user } = useAuth0();
  const [offerPrice, setOfferPrice] = useState("");
  const fileref = useRef(null);
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [projectLink, setProjectLink] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [category, setCategory] = useState("Web");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileName, setFileName] = useState("Select source file...");
  const { showToast } = useToast();

  const categories = ["Web", "Mobile", "UI/UX", "Blockchain", "SaaS"];

  const addTag = () => setTags([...tags, ""]);
  
  const handleTagChange = (index, value) => {
    const newTags = [...tags];
    newTags[index] = value;
    setTags(newTags);
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleFileChange = (e) => {
    if (e.target.files?.[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async () => {
    if (!user?.email) return;
    if (!title || !description || !offerPrice) {
      showToast("Please fill in all required fields", "red");
      return;
    }

    const filteredTags = tags.filter(t => t.trim() !== "");
    
    setIsSubmitting(true);
    const formData = new FormData();
    if (fileref.current?.files[0]) {
      formData.append("file", fileref.current.files[0]);
    }
    formData.append("offerPrice", offerPrice);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("link", projectLink);
    formData.append("image", imageUrl);
    formData.append("email", user.email);
    formData.append("category", category);
    formData.append("tags", JSON.stringify(filteredTags));

    try {
      await api.post("/create/project", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      showToast("Project created successfully!", "green");
      if (refreshData) refreshData();
      setshow(false);
    } catch (error) {
      console.error("Project Creation Error:", error);
      showToast(error.message || "Failed to create project", "red");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col relative max-w-3xl w-full max-h-[95vh] md:max-h-[90vh] z-[150] rounded-3xl shadow-2xl bg-[#0f1325]/95 border border-white/5 animate-in fade-in zoom-in duration-300">
      {/* STICKY HEADER */}
      <div className="w-full px-6 md:px-10 pt-6 pb-2 z-30 bg-[#0f1325]/50 backdrop-blur-sm rounded-t-3xl border-b border-white/5">
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3">
          <button 
            onClick={() => setshow(false)} 
            className="hover:text-[#0CA3E7] transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <IoIosArrowBack size={24} />
          </button>
          Create New Project
        </h2>
      </div>

      {/* SCROLLABLE BODY */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 md:px-10 py-6 z-20">
        <div className="w-full space-y-4">
          {/* BASIC INFO SECTION */}
          <div className="w-full px-5 py-4 rounded-2xl bg-[#1e293b]/30 border border-[#0CA3E7]/10 group focus-within:border-[#0CA3E7]/40 transition-all space-y-4">
            <div className="flex flex-col gap-1.5 group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80">Project Title*</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What are you building?"
                className="bg-black/20 focus:bg-black/30 transition-all rounded-xl px-4 py-3 w-full border border-white/10 focus:border-[#0CA3E7]/30 outline-none text-white shadow-inner text-sm placeholder:text-gray-500"
              />
            </div>
            
            <div className="flex flex-col gap-1.5 group">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80">Display Image URL</label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className="bg-black/20 focus:bg-black/30 transition-all rounded-xl px-4 py-3 w-full border border-white/10 focus:border-[#0CA3E7]/30 outline-none text-white shadow-inner text-sm placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* CATEGORY SELECTION */}
          <div className="w-full px-5 py-4 rounded-2xl bg-[#1e293b]/20 border border-[#0CA3E7]/5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 block mb-2">Project Category*</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    category === cat
                      ? "bg-[#0CA3E7] text-white shadow-lg shadow-[#0CA3E7]/20 border border-[#0CA3E7]/50"
                      : "bg-black/20 text-gray-400 border border-white/5 hover:bg-black/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* PRICING & LINKS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full px-5 py-4 rounded-2xl bg-[#1e293b]/20 border border-[#0CA3E7]/5 focus-within:border-[#0CA3E7]/30 transition-all">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 block mb-2">Offer Price (INR)*</label>
              <input
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder="e.g. 5000"
                className="bg-black/20 focus:bg-black/30 transition-all rounded-xl px-4 py-3 w-full border border-white/10 focus:border-[#0CA3E7]/30 outline-none text-white shadow-inner text-sm placeholder:text-gray-500"
              />
            </div>

            <div className="w-full px-5 py-4 rounded-2xl bg-[#1e293b]/20 border border-[#0CA3E7]/5 focus-within:border-[#0CA3E7]/30 transition-all">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 block mb-2">Project Link</label>
              <input
                value={projectLink}
                onChange={(e) => setProjectLink(e.target.value)}
                placeholder="GitHub or Demo URL"
                className="bg-black/20 focus:bg-black/30 transition-all rounded-xl px-4 py-3 w-full border border-white/10 focus:border-[#0CA3E7]/30 outline-none text-white shadow-inner text-sm placeholder:text-gray-500"
              />
            </div>
          </div>

          {/* ASSETS & TAGS SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="w-full px-5 py-4 rounded-2xl bg-[#1e293b]/20 border border-[#0CA3E7]/5 focus-within:border-[#0CA3E7]/30 transition-all">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 block mb-2">Source Code (ZIP)</label>
              <div className="relative group/file cursor-pointer">
                <input
                  type="file"
                  ref={fileref}
                  onChange={handleFileChange}
                  accept=".zip"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="bg-black/20 group-hover/file:bg-black/30 transition-all rounded-xl px-4 py-3 w-full border border-dashed border-white/20 flex items-center justify-between shadow-inner">
                  <span className="text-[11px] truncate pr-2 text-gray-500">
                    {fileName}
                  </span>
                  <span className="text-[9px] font-bold uppercase text-[#0CA3E7]">Browse</span>
                </div>
              </div>
            </div>

            <div className="w-full px-5 py-4 rounded-2xl bg-[#1e293b]/20 border border-[#0CA3E7]/5">
              <div className="flex justify-between items-center mb-2.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80">Tech Tags</label>
                <button 
                  onClick={addTag}
                  className="w-6 h-6 flex items-center justify-center rounded-full bg-[#0CA3E7] hover:bg-[#0A8BC7] transition-all active:scale-95 text-white shadow-lg shadow-[#0CA3E7]/20"
                  title="Add tag"
                >
                  <IoAdd size={16} />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[80px] overflow-y-auto no-scrollbar pr-1">
                {tags.map((tag, index) => (
                  <div key={index} className="relative group/tag">
                    <input
                      value={tag}
                      onChange={(e) => handleTagChange(index, e.target.value)}
                      placeholder="Tag"
                      className="bg-black/30 text-[10px] px-3 py-1.5 pr-7 rounded-lg w-20 border border-white/10 outline-none text-white focus:border-[#0CA3E7]/40 transition-all shadow-inner"
                    />
                    <button 
                      onClick={() => removeTag(index)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-red-400 opacity-0 group-hover/tag:opacity-100 transition-all"
                    >
                      <IoClose size={12} />
                    </button>
                  </div>
                ))}
                {tags.length === 0 && <span className="text-[10px] text-gray-600 italic">No tags added</span>}
              </div>
            </div>
          </div>

          {/* DESCRIPTION SECTION */}
          <div className="w-full px-5 py-4 rounded-2xl bg-[#1e293b]/30 border border-[#0CA3E7]/10 group focus-within:border-[#0CA3E7]/40 transition-all">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#0CA3E7] opacity-80 block mb-2">Project Description*</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              placeholder="Explain what your project does..."
              className="resize-none bg-black/20 focus:bg-black/30 transition-all rounded-xl px-4 py-3 w-full border border-white/10 focus:border-[#0CA3E7]/30 outline-none text-white shadow-inner text-sm placeholder:text-gray-500 leading-relaxed min-h-[100px]"
            />
          </div>
        </div>
      </div>

      {/* STICKY FOOTER */}
      <div className="w-full px-6 md:px-10 pt-2 pb-6 flex justify-end gap-3 z-30 bg-[#0f1325]/50 backdrop-blur-sm rounded-b-3xl border-t border-white/5">
        <button 
          onClick={() => setshow(false)}
          className="px-5 py-1 rounded-full border border-gray-700 hover:bg-white/5 transition-all text-gray-400 font-semibold text-xs"
        >
          Cancel
        </button>
        <GradientBtn
          placeholder={isSubmitting ? "Creating..." : "Launch Project"}
          onClick={handleSubmit}
          disabled={isSubmitting}
        />
      </div>

      <img
        className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none rounded-3xl"
        alt=""
        src={background}
      />
    </div>
  );
};

export default CreateProject;
