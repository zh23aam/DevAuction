import React, { useState } from "react";
import { FaLongArrowAltLeft } from "react-icons/fa";
import { MdModeEditOutline } from "react-icons/md";
import { IoAdd, IoClose } from "react-icons/io5";
import "./project.css";
import { useAuth0 } from "@auth0/auth0-react";
import GradientBtn from "../Buttons/GradientBtn";
import api from "../../utils/api";
import { useToast } from "../../context/ToastContext";
import Badge from "../Common/Badge";

function ProfileEdit({ resp, showEdit, setShowEdit, userData }) {
  const { user } = useAuth0();
  const { showToast } = useToast();
  const [skills, setSkills] = useState(userData?.Skills || []);
  const [bio, setBio] = useState(userData?.Bio || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSkillChange = (index, value) => {
    const newSkills = [...skills];
    newSkills[index] = value;
    setSkills(newSkills);
  };

  const addSkill = () => {
    setSkills([...skills, ""]);
  };

  const removeSkill = (index) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setSkills(newSkills);
  };

  const handleSave = async () => {
    if (!user?.email) return;
    
    // Filter out empty skills
    const filteredSkills = skills.filter(s => s.trim() !== "");
    
    setIsSaving(true);
    try {
      await api.post("/profile/edit", { 
        email: user.email, 
        bio: bio, 
        skills: filteredSkills 
      });

      showToast("Profile updated successfully", "green");
      if (resp) resp();
      setShowEdit(false);
    } catch (error) {
      console.error("Profile Edit Error:", error);
      showToast("Failed to update profile", "red");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#0f1325]/95 border border-[#0CA3E7]/20 w-[95%] max-w-xl text-white rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in duration-300">
      <div className="p-4 md:p-[16px]">
        <div className="flex items-center gap-4 mb-6">
          <button 
            onClick={() => setShowEdit(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors active:scale-90"
          >
            <FaLongArrowAltLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Edit Profile</h2>
        </div>
        <div className="space-y-4">
          <div className="w-full px-4 py-3 rounded-2xl bg-[#1e293b]/30 border border-[#0CA3E7]/10 group focus-within:border-[#0CA3E7]/40 transition-all">
            <p className="font-bold text-[10px] uppercase tracking-widest text-[#0CA3E7] mb-2 opacity-80">Bio</p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the world about yourself..."
              className="w-full resize-none min-h-[100px] rounded-xl px-3 py-2 border border-white/10 outline-none bg-black/20 focus:bg-black/30 focus:border-[#0CA3E7]/30 transition-all shadow-inner text-gray-200 leading-relaxed text-sm placeholder:text-gray-500"
            />
          </div>

          <div className="w-full px-4 py-3 rounded-2xl bg-[#1e293b]/20 border border-[#0CA3E7]/5">
            <div className="flex justify-between items-center mb-3">
              <p className="font-bold text-[10px] uppercase tracking-widest text-[#0CA3E7] opacity-80">Skills</p>
              <button 
                onClick={addSkill}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#0CA3E7] hover:bg-[#0A8BC7] transition-all active:scale-95 text-white shadow-lg shadow-[#0CA3E7]/20"
                title="Add Skill"
              >
                <IoAdd size={18} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-[180px] overflow-y-auto no-scrollbar pr-2">
              {skills.map((skill, index) => (
                <div key={index} className="relative group">
                  <input
                    value={skill}
                    onChange={(e) => handleSkillChange(index, e.target.value)}
                    placeholder="Skill"
                    className="w-[110px] px-3 py-1.5 pr-8 rounded-xl border border-white/10 outline-none bg-black/30 text-xs shadow-inner transition-all focus:bg-black/50 focus:border-[#0CA3E7]/50 text-gray-200"
                  />
                  <button 
                    onClick={() => removeSkill(index)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400 active:scale-90"
                  >
                    <IoClose size={14} />
                  </button>
                </div>
              ))}
              {skills.length === 0 && (
                <p className="text-gray-500 text-[10px] italic py-1">Add some skills to showcase your talent</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button 
            onClick={() => setShowEdit(false)}
            className="px-5 py-1 rounded-full border border-gray-700 hover:bg-white/5 transition-all text-gray-400 font-semibold text-xs"
          >
            Cancel
          </button>
          <GradientBtn 
            placeholder={isSaving ? "Saving..." : "Save Changes"} 
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs px-6 py-1"
          />
        </div>
      </div>
    </div>
  );
}
export default ProfileEdit;
