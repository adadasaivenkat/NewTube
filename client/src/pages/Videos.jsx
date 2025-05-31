import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function Videos({ userId }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserVideos = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/user/${userId}/videos`);
        setVideos(res.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch videos:", err);
        setError("Failed to load videos");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserVideos();
    } else {
      setVideos([]);
      setLoading(false);
    }
  }, [userId]);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0F0F0F]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FF0000]"></div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0F0F0F] text-[#FF0000] text-xl">
        {error}
      </div>
    );

  if (videos.length === 0)
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#0F0F0F] text-gray-500 dark:text-gray-400 text-xl">
        No videos uploaded yet.
      </div>
    );

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F0F0F] transition-colors duration-200 px-4 py-8">
      <div className="container mx-auto">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white">
          Your Videos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video) => (
            <Link
              key={video._id}
              to={`/video/${video._id}`}
              className="group flex flex-col bg-[#F2F2F2] dark:bg-[#212121] rounded-xl overflow-hidden shadow-md hover:shadow-lg transition duration-200">
              {/* Thumbnail */}
              <div className="relative w-full pt-[56.25%]">
                {video.thumbnail ? (
                  <img
                    src={`${API_URL}/uploads/thumbnails/${video.thumbnail}`}
                    alt={video.title}
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    onError={(e) => (e.target.src = "/default-thumbnail.jpg")}
                  />
                ) : (
                  <div className="absolute top-0 left-0 w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400">
                    No Thumbnail
                  </div>
                )}
                <div className="absolute bottom-2 right-2 bg-black/75 px-2 py-1 text-xs text-white rounded">
                  {video.duration || "0:00"}
                </div>
              </div>

              {/* Info Section */}
              <div className="p-4 flex flex-1">
                <div className="flex space-x-3 w-full">
                  {/* Profile Pic */}
                  <div className="flex-shrink-0">
                    {video.uploaderId?.photo ? (
                      <img
                        src={
                          video.uploaderId.photo.startsWith("http")
                            ? video.uploaderId.photo
                            : `${API_URL}/uploads/profilepics/${video.uploaderId.photo}`
                        }
                        alt={video.uploaderId.name || "Uploader"}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) =>
                          (e.target.src = `${API_URL}/uploads/profilepics/default_image.png`)
                        }
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#E5E5E5] dark:bg-[#303030]"></div>
                    )}
                  </div>

                  {/* Video Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#0F0F0F] dark:text-white text-base mb-1 line-clamp-2 group-hover:text-[#FF0000]">
                      {video.title}
                    </h3>
                    <p className="text-sm text-[#282828] dark:text-[#FFFFFF]/70 truncate">
                      {video.uploaderId?.name || "Unknown"}
                    </p>
                    <div className="flex items-center space-x-1 text-sm text-[#282828] dark:text-[#FFFFFF]/70">
                      <span>{video.views?.toLocaleString() || 0} views</span>
                      <span>•</span>
                      <span>
                        {video.createdAt
                          ? formatDistanceToNow(new Date(video.createdAt), {
                              addSuffix: true,
                            })
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Videos;
