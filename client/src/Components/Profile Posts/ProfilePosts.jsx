import React, { useCallback, useEffect, useState } from "react";
import ProjectTile from "./ProjectTile";
import { useAuth0 } from "@auth0/auth0-react";
import { ProgressSpinner } from "primereact/progressspinner";
import api from "../../utils/api";

export default function ProfilePosts({ className, user }) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUserProjects = useCallback(async () => {
    if (!user?.email) return;
    
    setIsLoading(true);
    try {
      const data = await api.post("/profile/userProjects", { email: user.email });
      setProjects(data.userProjects || []);
    } catch (error) {
      console.error("Fetch User Projects Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchUserProjects();
  }, [fetchUserProjects]);

  return (
    <div className={`${className} min-h-[400px]`}>
      {isLoading ? (
        <div className="w-full h-[400px] flex flex-col justify-center items-center gap-4">
          <ProgressSpinner
            style={{ width: "40px", height: "40px" }}
            strokeWidth="4"
            fill="transparent"
            animationDuration=".5s"
          />
          <p className="text-gray-500 text-sm tracking-widest uppercase">Loading Projects...</p>
        </div>
      ) : (
        <div className="bg-[#05081B] h-fit w-full p-4 rounded-3xl border border-white/5">
          {projects.length > 0 ? (
            <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
              {projects.map((project, index) => project && (
                <div key={project._id || index} className="break-inside-avoid">
                  <ProjectTile
                    imgSrc={project.Image}
                    title={project.Title}
                    viewsCount={"₹" + project.OfferPrice}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full py-20 flex flex-col items-center justify-center text-gray-600 gap-2">
              <span className="text-4xl text-gray-700">📂</span>
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm">Start building something amazing!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
