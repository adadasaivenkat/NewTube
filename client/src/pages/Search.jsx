import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const Search = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const searchQuery = searchParams.get("q") || "";

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (searchQuery) {
      searchVideos(searchQuery);
    }
  }, [searchQuery]);

  const searchVideos = async (query) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_URL}/api/search?q=${encodeURIComponent(query)}`
      );
      setVideos(response.data);
    } catch (err) {
      setError(
        "No videos available — or something went wrong while fetching them."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#0F0F0F] transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        {searchQuery && (
          <h2 className="text-xl font-semibold mb-6 text-[#0F0F0F] dark:text-[#FFFFFF]">
            Search results for "{searchQuery}"
          </h2>
        )}

        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF0000]"></div>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mx-4">
            {error}
          </div>
        ) : videos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <Link
                key={video._id}
                to={`/video/${video._id}`}
                className="group flex flex-col bg-[#F2F2F2] dark:bg-[#212121] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200">
                {/* Thumbnail Container - Fixed Aspect Ratio */}
                <div className="relative w-full pt-[56.25%]">
                  {video.thumbnail ? (
                    <img
                      src={`${API_URL}/uploads/thumbnails/${video.thumbnail}`}
                      alt={video.title}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/default-thumbnail.jpg";
                      }}
                    />
                  ) : (
                    <video className="absolute top-0 left-0 w-full h-full object-cover">
                      <source
                        src={`${API_URL}/uploads/videos/${video.filename}`}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/75 px-2 py-1 rounded text-xs text-white">
                    {video.duration || "0:00"}
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-4 flex flex-1">
                  <div className="flex space-x-3 w-full">
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      {video.uploader?.photo ? (
                        <img
                          src={
                            video.uploader.photo.startsWith("http")
                              ? video.uploader.photo
                              : `${API_URL}/uploads/profilepics/${video.uploader.photo}`
                          }
                          alt={video.uploader.name || "Uploader"}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.src = `${API_URL}/uploads/profilepics/default_image.png`;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#E5E5E5] dark:bg-[#303030]"></div>
                      )}
                    </div>

                    {/* Video Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[#0F0F0F] dark:text-[#FFFFFF] text-base mb-1 line-clamp-2 group-hover:text-[#FF0000]">
                        {video.title}
                      </h3>
                      <p className="text-sm text-[#282828] dark:text-[#FFFFFF]/70 truncate">
                        {video.uploader?.name || "Unknown"}
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
        ) : (
          <div className="text-center py-20">
            {searchQuery ? (
              <>
                <p className="text-2xl font-semibold text-[#0F0F0F] dark:text-[#FFFFFF] mb-2">
                  No results found
                </p>
                <p className="text-[#282828] dark:text-[#FFFFFF]/70">
                  Try different keywords or remove search filters
                </p>
              </>
            ) : (
              <p className="text-[#282828] dark:text-[#FFFFFF]/70 text-lg">
                Start searching to discover videos
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
