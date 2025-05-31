import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Video, Users, Clock, Heart, Shield } from "lucide-react";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const Channel = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [videoCount, setVideoCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const [allVideos, setAllVideos] = useState([]);
  const [activeTab, setActiveTab] = useState("HOME");
  const [subscribed, setSubscribed] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadChannelData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          throw new Error("Channel ID is required");
        }

        // Fetch current logged-in user if available
        const token = localStorage.getItem("token");
        if (token) {
          const response = await fetch(`${API_URL}/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) throw new Error("Failed to fetch user data");
          const userData = await response.json();
          if (userData && userData._id) {
            setCurrentUserId(userData._id);
            // Check subscription status
            const subscriptionResponse = await fetch(
              `${API_URL}/api/${userData._id}/isSubscribed/${id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (subscriptionResponse.ok) {
              const { isSubscribed } = await subscriptionResponse.json();
              setSubscribed(isSubscribed);
            }
          }
        }

        // Fetch channel data
        const channelResponse = await fetch(`${API_URL}/api/user/${id}`);
        if (!channelResponse.ok)
          throw new Error("Failed to fetch channel data");
        const channelData = await channelResponse.json();
        setUser(channelData);

        // Fetch videos count
        const countResponse = await fetch(`${API_URL}/api/user/${id}/count`);
        if (!countResponse.ok) throw new Error("Failed to fetch video count");
        const countData = await countResponse.json();
        setVideoCount(countData.totalVideos);

        // Fetch recent videos
        const recentResponse = await fetch(`${API_URL}/api/user/${id}/recent`);
        if (!recentResponse.ok)
          throw new Error("Failed to fetch recent videos");
        const recentData = await recentResponse.json();
        setRecentVideos(recentData.slice(0, 3));

        // Fetch all videos
        const allResponse = await fetch(`${API_URL}/api/user/${id}/videos`);
        if (!allResponse.ok) throw new Error("Failed to fetch all videos");
        const allData = await allResponse.json();
        setAllVideos(allData);
      } catch (err) {
        console.error("Error loading channel data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadChannelData();
  }, [id]);

  const handleSubscribe = async () => {
    try {
      if (!currentUserId) {
        navigate("/login");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/${id}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: currentUserId,
          subscribe: !subscribed,
        }),
      });

      if (response.ok) {
        setSubscribed(!subscribed);
        setUser((prev) => ({
          ...prev,
          subscribers: subscribed
            ? prev.subscribers > 0
              ? prev.subscribers - 1
              : 0
            : prev.subscribers + 1,
        }));
      } else {
        const errorData = await response.json();
        console.error("Subscribe error:", errorData.message || errorData);
      }
    } catch (error) {
      console.error("Error subscribing to channel:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-[1200px] bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading channel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-[1200px] bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600 dark:text-red-400 p-4">
          <p className="text-xl font-semibold mb-2">Error loading channel</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-[1200px] bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p className="text-xl font-semibold">Channel not found</p>
        </div>
      </div>
    );
  }

  const photoUrl = user?.photo?.startsWith("http")
    ? user.photo
    : `${API_URL}/uploads/profilepics/${user.photo || "default_image.png"}`;

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1200px] bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      {/* Channel Header */}
      <div className="relative">
        <div className="h-40 md:h-56 w-full bg-gradient-to-r from-red-500/20 to-gray-500/20"></div>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16 md:-mt-20 pb-6 border-b border-light-hover dark:border-dark-hover">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg transition-transform hover:scale-105">
              <img
                src={photoUrl}
                alt={`${user.name || "Channel"} Avatar`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = `${API_URL}/uploads/profilepics/default_image.png`;
                }}
              />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold text-light-text dark:text-dark-text mb-2">
                {user.name || "No Name Available"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>{user.email || "username"}</span>
                <span className="flex items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 mr-2"></span>
                  {user.subscribers || 0} subscribers
                </span>
                <span className="flex items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-600 mr-2"></span>
                  {videoCount || 0} videos
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3">
                <Shield className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Joined{" "}
                  {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
              {currentUserId !== id && (
                <button
                  onClick={handleSubscribe}
                  className={`px-6 py-2.5 rounded-full font-semibold transition-all duration-300 transform hover:-translate-y-0.5 ${
                    subscribed
                      ? "bg-light-sidebar dark:bg-dark-sidebar text-light-text dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover"
                      : "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg"
                  }`}>
                  {subscribed ? "Subscribed" : "Subscribe"}
                </button>
              )}
            </div>
          </div>

          <nav className="flex items-center gap-8 overflow-x-auto py-4 text-light-text dark:text-dark-text">
            <button
              onClick={() => setActiveTab("HOME")}
              className={`font-medium px-1 py-2 border-b-2 transition-colors duration-200 ${
                activeTab === "HOME"
                  ? "border-red-500 text-red-600 dark:text-red-400"
                  : "border-transparent hover:text-red-500 dark:hover:text-red-400"
              }`}>
              HOME
            </button>
            <button
              onClick={() => setActiveTab("VIDEOS")}
              className={`font-medium px-1 py-2 border-b-2 transition-colors duration-200 ${
                activeTab === "VIDEOS"
                  ? "border-red-500 text-red-600 dark:text-red-400"
                  : "border-transparent hover:text-red-500 dark:hover:text-red-400"
              }`}>
              VIDEOS
            </button>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === "HOME" && (
          <>
            {/* Channel Stats */}
            <div className="max-w-7xl mx-auto py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-light-sidebar dark:bg-dark-sidebar p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-full">
                      <Video className="w-8 h-8 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-light-text dark:text-dark-text">
                        {videoCount || 0}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Videos
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-light-sidebar dark:bg-dark-sidebar p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-full">
                      <Users className="w-8 h-8 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-light-text dark:text-dark-text">
                        {user.subscribers || 0}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Subscribers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Videos */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-6">
                Recent Activity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recentVideos.map((video, index) => (
                  <div
                    key={video._id || index}
                    onClick={() => navigate(`/video/${video._id}`)}
                    className="bg-light-sidebar dark:bg-dark-sidebar rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group">
                    <div className="relative w-full aspect-video overflow-hidden">
                      <img
                        src={`${API_URL}/uploads/thumbnails/${video.thumbnail}`}
                        alt={video.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {video.duration}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-light-text dark:text-dark-text mb-2 truncate group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors duration-200">
                        {video.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />{" "}
                          {new Date(video.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-4 h-4 text-red-500" />{" "}
                          {video.likes?.length || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "VIDEOS" && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-light-text dark:text-dark-text mb-6">
              All Videos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allVideos.map((video, index) => (
                <div
                  key={video._id || index}
                  onClick={() => navigate(`/video/${video._id}`)}
                  className="bg-light-sidebar dark:bg-dark-sidebar rounded-xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 group">
                  <div className="relative w-full aspect-video overflow-hidden">
                    <img
                      src={`${API_URL}/uploads/thumbnails/${video.thumbnail}`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {video.duration}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-light-text dark:text-dark-text mb-2 truncate group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors duration-200">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />{" "}
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" />{" "}
                        {video.likes?.length || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Channel;
