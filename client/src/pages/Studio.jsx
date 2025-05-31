import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Eye,
  MessageCircle,
  ThumbsUp,
  Upload,
  Home,
  Menu,
  X,
  LayoutGrid,
} from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const Studio = () => {
  const [user, setUser] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No token found in localStorage.");
          return;
        }

        const { data } = await axios.get(`${API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (!data || !data._id) {
          console.error("Invalid user data received:", data);
          return;
        }

        setUser({
          _id: data._id,
          name: data.name,
          photo: data.photo?.startsWith("http")
            ? data.photo
            : `${API_URL}/uploads/profilepics/${
                data.photo || "default_image.png"
              }`,
        });

        fetchVideos(data._id);
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    const fetchVideos = async (userId) => {
      try {
        if (!userId) {
          console.warn("User ID is not available, skipping video fetch.");
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("No token found in localStorage.");
          return;
        }

        const { data } = await axios.get(`${API_URL}/api/videos`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        setVideos(data);
      } catch (err) {
        console.error("Error fetching videos:", err);
      }
    };

    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#0F0F0F]">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!isSidebarOpen)}
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-[#F2F2F2] dark:bg-[#212121] shadow-lg md:hidden">
        {isSidebarOpen ? (
          <X className="w-6 h-6 text-[#0F0F0F] dark:text-[#FFFFFF]" />
        ) : (
          <Menu className="w-6 h-6 text-[#0F0F0F] dark:text-[#FFFFFF]" />
        )}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#F2F2F2] dark:bg-[#212121] transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-lg md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}>
        <div className="p-6">
          <div className="flex items-center space-x-4 mb-8">
            <img
              src={
                user?.photo ||
                `${API_URL}/uploads/profilepics/default_image.png`
              }
              alt="Profile"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#FF0000]"
              onError={(e) => {
                e.target.src = `${API_URL}/uploads/profilepics/default_image.png`;
              }}
            />
            <div>
              <h2 className="font-semibold text-[#0F0F0F] dark:text-[#FFFFFF]">
                {user?.name || "User"}
              </h2>
              <p className="text-sm text-[#282828] dark:text-[#FFFFFF]/70">
                Creator Studio
              </p>
            </div>
          </div>

          <nav className="space-y-3">
            <div className="px-3 py-2 rounded-lg bg-[#E5E5E5] dark:bg-[#303030] flex items-center space-x-3">
              <LayoutGrid className="w-5 h-5 text-[#FF0000]" />
              <span className="text-[#FF0000] font-medium">Content</span>
            </div>
            <Link
              to="/upload"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg text-[#0F0F0F] dark:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#303030] transition-colors">
              <Upload className="w-5 h-5" />
              <span>Upload Video</span>
            </Link>
            <Link
              to="/"
              className="flex items-center space-x-3 px-3 py-2 text-[#0F0F0F] dark:text-[#FFFFFF] hover:bg-[#E5E5E5] dark:hover:bg-[#303030] rounded-lg transition-colors">
              <Home className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full md:pl-64 p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0F0F0F] dark:text-[#FFFFFF] mb-6 md:mb-8">
            Your Content
          </h1>

          <div className="bg-[#F2F2F2] dark:bg-[#212121] rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 grid grid-cols-12 text-sm font-medium text-[#282828] dark:text-[#FFFFFF]/70 bg-[#E5E5E5] dark:bg-[#303030]">
              <span className="col-span-6 md:col-span-6">Videos</span>
              <span className="hidden md:block md:col-span-1 text-center">
                Date
              </span>
              <span className="col-span-2 text-center">Likes</span>
              <span className="col-span-2 text-center">Comments</span>
              <span className="col-span-2 md:col-span-1 text-center">
                Views
              </span>
            </div>

            {user && Array.isArray(videos) ? (
              videos.length > 0 &&
              videos.filter(
                (video) => String(video.uploaderId) === String(user._id)
              ).length > 0 ? (
                videos
                  .filter(
                    (video) => String(video.uploaderId) === String(user._id)
                  )
                  .map((video, index) => (
                    <div
                      key={index}
                      className="p-4 grid grid-cols-12 gap-2 md:gap-4 items-center border-b border-[#E5E5E5] dark:border-[#303030] hover:bg-[#E5E5E5] dark:hover:bg-[#404040] transition-colors">
                      <div className="col-span-6 md:col-span-6 flex items-center space-x-2 md:space-x-4">
                        <div className="relative w-24 md:w-32 h-16 md:h-18 flex-shrink-0">
                          <img
                            src={`${API_URL}/uploads/thumbnails/${video.thumbnail}`}
                            alt={video.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <span className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded">
                            {video.duration}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-[#0F0F0F] dark:text-[#FFFFFF] text-sm md:text-base mb-1 truncate">
                            {video.title}
                          </h3>
                          <p className="text-[#282828] dark:text-[#FFFFFF]/70 text-xs md:text-sm truncate">
                            {video.description}
                          </p>
                        </div>
                      </div>

                      <div className="hidden md:block md:col-span-1 text-right text-[#282828] dark:text-[#FFFFFF]/70">
                        {video.createdAt
                          ? new Date(video.createdAt).toLocaleDateString()
                          : "Unknown"}
                      </div>

                      <div className="col-span-2 flex items-center justify-center space-x-1 text-[#282828] dark:text-[#FFFFFF]/70">
                        <ThumbsUp className="w-4 h-4" />
                        <span>
                          {Array.isArray(video.likes) ? video.likes.length : 0}
                        </span>
                      </div>

                      <div className="col-span-2 flex items-center justify-center space-x-1 text-[#282828] dark:text-[#FFFFFF]/70">
                        <MessageCircle className="w-4 h-4" />
                        <span>
                          {Array.isArray(video.comments)
                            ? video.comments.length
                            : 0}
                        </span>
                      </div>

                      <div className="col-span-2 md:col-span-1 flex items-center justify-center space-x-1 text-[#282828] dark:text-[#FFFFFF]/70">
                        <Eye className="w-4 h-4" />
                        <span>{video.views ?? 0}</span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="py-12 px-4 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E5E5E5] dark:bg-[#303030] mb-4">
                    <Upload className="w-8 h-8 text-[#282828] dark:text-[#FFFFFF]/50" />
                  </div>
                  <h3 className="text-lg font-medium text-[#0F0F0F] dark:text-[#FFFFFF] mb-2">
                    No videos yet
                  </h3>
                  <p className="text-[#282828] dark:text-[#FFFFFF]/70 mb-6">
                    Start building your content library by uploading your first
                    video
                  </p>
                  <Link
                    to="/upload"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-[#FFFFFF] bg-[#FF0000] hover:bg-[#FF0000]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FF0000]">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Video
                  </Link>
                </div>
              )
            ) : (
              <div className="py-20 text-center text-[#282828] dark:text-[#FFFFFF]/70">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-[#E5E5E5] dark:border-[#303030] border-t-[#FF0000] rounded-full mb-4"></div>
                <p>Loading your content...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Studio;
