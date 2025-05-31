import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";

const API_URL = import.meta.env.VITE_BACKEND_URL;

function VideoPage() {
  const { videoId } = useParams();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState(null);
  const [userPic, setUserPic] = useState(null);
  const [userName, setUserName] = useState(null);
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  // Load user and video details
  useEffect(() => {
    if (videoId) {
      fetchUser().then(loadVideo);
    }
  }, [videoId, userId]);

  // Check subscription status
  useEffect(() => {
    if (!video?.uploaderId || !userId) return;

    const checkSubscription = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/${userId}/isSubscribed/${video.uploaderId}`
        );
        setSubscribed(response.data.isSubscribed);
      } catch (error) {
        console.error("Error checking subscription:", error);
      }
    };

    checkSubscription();
  }, [video, userId]);

  // Increment video views (only once per session)
  useEffect(() => {
    if (!videoId) return;

    const incrementViews = async () => {
      try {
        await axios.post(`${API_URL}/api/${videoId}/view`);
      } catch (error) {
        console.error("Error updating views:", error);
      }
    };

    // Prevent duplicate views in the same session
    const viewed = sessionStorage.getItem(`viewed_${videoId}`);
    if (!viewed) {
      incrementViews();
      sessionStorage.setItem(`viewed_${videoId}`, "true");
    }
  }, [videoId]);

  useEffect(() => {
    if (!video?._id) return;

    const history = JSON.parse(localStorage.getItem("watchHistory")) || [];

    const updated = [video._id, ...history.filter((id) => id !== video._id)];

    localStorage.setItem("watchHistory", JSON.stringify(updated.slice(0, 50)));
  }, [video]);

  const loadVideo = async () => {
    try {
      if (!videoId) return;

      const response = await axios.get(`${API_URL}/api/${videoId}`, {
        params: { userId },
      });

      const videoData = response.data;

      setVideo(videoData);
      setLikes(videoData.likeCount || 0);
      setDislikes(videoData.dislikeCount || 0);
      setIsLiked(videoData.isLiked || false);
      setIsDisliked(videoData.isDisliked || false);
      setComments(videoData.comments || []);
    } catch (err) {
      setError("Failed to load video");
      console.error("API Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const { data } = await axios.get(`${API_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (data?._id) {
        setUserId(data._id);
        setUserPic(
          data.photo?.startsWith("http")
            ? data.photo
            : `${API_URL}/uploads/profilepics/${
                data.photo || "default_image.png"
              }`
        );
        setUserName(data.name);
      }
    } catch (err) {
      console.error("Error fetching user:", err.response?.data || err.message);
    }
  };

  const checkUserBeforeAction = (callback) => {
    if (!userId) {
      toast.error("Please sign in to perform this action");
      return;
    }
    callback();
  };

  const handleLike = () => {
    checkUserBeforeAction(async () => {
      try {
        const response = await axios.post(`${API_URL}/api/${videoId}/like`, {
          userId,
        });

        setIsLiked(response.data.likes.includes(userId)); // Now `likes` is an array
        setIsDisliked(response.data.dislikes.includes(userId));
        setLikes(response.data.likes.length);
        setDislikes(response.data.dislikes.length);
      } catch (err) {
        console.error("Error liking video:", err);
      }
    });
  };

  const handleDislike = () => {
    checkUserBeforeAction(async () => {
      try {
        const response = await axios.post(`${API_URL}/api/${videoId}/dislike`, {
          userId,
        });

        setIsDisliked(response.data.dislikes.includes(userId)); // Now `dislikes` is an array
        setIsLiked(response.data.likes.includes(userId));
        setLikes(response.data.likes.length);
        setDislikes(response.data.dislikes.length);
      } catch (err) {
        console.error("Error disliking video:", err);
      }
    });
  };

  const handleSubscribe = (video, userId, setSubscribed, subscribed) => {
    if (!video?.uploaderId) {
      console.log("No uploaderId found");
      toast.error("Uploader not found. Please try again later.");
      return;
    }

    checkUserBeforeAction(async () => {
      try {
        const response = await axios.post(
          `${API_URL}/api/${video.uploaderId}/subscribe`,
          { userId }
        );
        setSubscribed(!subscribed);
        toast.success(response.data.message || "Subscribed successfully!");
      } catch (error) {
        console.error("Error subscribing:", error);

        // Show backend message if available
        if (error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error("Subscription failed! Please try again.");
        }
      }
    });
  };

  const handleComment = () => {
    checkUserBeforeAction(async () => {
      if (!newComment.trim()) return;
      try {
        const response = await axios.post(`${API_URL}/api/${videoId}/comment`, {
          userId,
          text: newComment,
        });

        if (response.data.message === "Comment added") {
          // Create a new comment object
          const newCommentObj = {
            ...response.data.comments[response.data.comments.length - 1], // Get the latest comment
            userName: userName || "Unknown",
            userPic:
              userPic || `${API_URL}/uploads/profilepics/default_image.png`,
            createdAt: new Date().toISOString(),
          };

          // Update the UI optimistically
          setComments((prevComments) => [newCommentObj, ...prevComments]);
          setNewComment(""); // Clear input field
          toast.success("Comment added successfully!");
        }
      } catch (err) {
        console.error("Error adding comment:", err);
        toast.error("Failed to add comment");
      }
    });
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="text-primary text-xl">{error}</div>
      </div>
    );

  if (!video)
    return (
      <div className="flex items-center justify-center min-h-screen bg-light-bg dark:bg-dark-bg">
        <div className="text-xl text-light-text dark:text-dark-text">
          Video not found
        </div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1200px] bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
      <div className="aspect-w-16 aspect-h-9 mb-4 rounded-xl overflow-hidden shadow-lg">
        <video
          src={`${API_URL}/uploads/videos/${video.filename}`}
          controls
          className="w-full h-full object-cover"
          poster={`${API_URL}/uploads/thumbnails/${video.thumbnail}`}
        />
      </div>

      <h1 className="text-2xl font-bold mt-4 text-light-text line-clamp-2 dark:text-dark-text">
        {video.title}
      </h1>

      <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 pb-4 border-b border-light-hover dark:border-dark-hover">
        <div className="flex items-center space-x-4">
          <div
            className="flex items-center space-x-4 cursor-pointer"
            onClick={() => navigate(`/channel/${video.uploaderId}`)}>
            <img
              src={
                video.uploader.photo?.startsWith("http")
                  ? video.uploader.photo
                  : `${API_URL}/uploads/profilepics/${
                      video.uploader.photo || "default_image.png"
                    }`
              }
              alt={video.uploader.name || "Uploader"}
              className="w-10 h-10 rounded-full bg-light-sidebar dark:bg-dark-sidebar object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `${API_URL}/uploads/profilepics/default_image.png`;
              }}
            />

            <div>
              <h3 className="font-semibold text-light-text dark:text-dark-text">
                {video.uploader.name || "Unknown Uploader"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {video.uploader.subscribers?.toLocaleString()} subscribers
              </p>
            </div>
          </div>

          {/* Show subscribe button only if not own channel */}
          {video.uploader._id !== userId && (
            <button
              onClick={() =>
                handleSubscribe(video, userId, setSubscribed, subscribed)
              }
              className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                subscribed
                  ? "bg-light-sidebar dark:bg-dark-sidebar text-light-text dark:text-dark-text"
                  : "bg-primary hover:bg-red-700 text-white"
              }`}>
              {subscribed ? "Subscribed" : "Subscribe"}
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <div className="flex items-center bg-light-sidebar dark:bg-dark-sidebar rounded-full">
            {/* Like Button */}
            <motion.button
              onClick={handleLike}
              initial={{ scale: 1 }}
              animate={{ scale: isLiked ? 1.2 : 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-l-full hover:bg-light-hover dark:hover:bg-dark-hover ${
                isLiked ? "text-primary" : "text-light-text dark:text-dark-text"
              }`}>
              <FaThumbsUp className="text-xl" />
              <motion.span
                key={likes}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}>
                {likes?.toLocaleString()}
              </motion.span>
            </motion.button>

            {/* Divider */}
            <div className="h-8 w-px bg-light-hover dark:bg-dark-hover"></div>

            {/* Dislike Button */}
            <motion.button
              onClick={handleDislike}
              initial={{ scale: 1 }}
              animate={{ scale: isDisliked ? 1.2 : 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-r-full hover:bg-light-hover dark:hover:bg-dark-hover ${
                isDisliked
                  ? "text-primary"
                  : "text-light-text dark:text-dark-text"
              }`}>
              <FaThumbsDown className="text-xl" />
              <motion.span
                key={dislikes}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}>
                {dislikes?.toLocaleString()}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-light-sidebar dark:bg-dark-sidebar rounded-xl p-4">
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{video.views?.toLocaleString()} views</span>
          <span>•</span>
          <span>
            {formatDistanceToNow(new Date(video.createdAt || Date.now()), {
              addSuffix: true,
            })}
          </span>
        </div>

        <div className={`mt-2 ${!showMore && "line-clamp-2"}`}>
          <p className="whitespace-pre-wrap">{video.description}</p>
        </div>

        <button
          onClick={() => setShowMore(!showMore)}
          className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
          Show {showMore ? "less" : "more"}
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">{comments.length} Comments</h2>

        <div className="flex space-x-4">
          <img
            src={userPic || `${API_URL}/uploads/profilepics/default_image.png`}
            alt="User"
            className="w-10 h-10 rounded-full object-cover bg-light-sidebar dark:bg-dark-sidebar"
          />

          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 bg-transparent border-b border-light-hover dark:border-dark-hover focus:border-primary outline-none resize-none text-light-text dark:text-dark-text"
              rows="1"
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={() => setNewComment("")}
                className="px-4 py-2 text-light-text dark:text-dark-text hover:bg-light-hover dark:hover:bg-dark-hover rounded-full">
                Cancel
              </button>
              <button
                onClick={handleComment}
                disabled={!newComment.trim()}
                className={`px-4 py-2 rounded-full font-medium ${
                  newComment.trim()
                    ? "bg-blue-500 hover:bg-blue-600 text-white"
                    : "bg-light-sidebar dark:bg-dark-sidebar text-gray-500 dark:text-gray-400 cursor-not-allowed"
                }`}>
                Comment
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2 max-w-3xl">
          {comments.length > 0 ? (
            comments.map((comment, index) => (
              <div key={index} className="flex space-x-4 py-2 rounded-lg">
                <img
                  src={
                    comment.userPic?.startsWith("http")
                      ? comment.userPic
                      : `${API_URL}/uploads/profilepics/${
                          comment.userPic || "default_image.png"
                        }`
                  }
                  alt={comment.userName || "Commenter"}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `${API_URL}/uploads/profilepics/default_image.png`;
                  }}
                />
                <div className="flex flex-col">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold text-light-text dark:text-dark-text">
                      {comment.userName || "Anonymous"}
                    </h4>
                    <span className="text-xs text-light-secondary dark:text-dark-secondary">
                      {formatDistanceToNow(
                        new Date(comment.createdAt || Date.now()),
                        { addSuffix: true }
                      )}
                    </span>
                  </div>
                  <p className="mt-1 text-light-text dark:text-dark-text whitespace-pre-wrap">
                    {comment.text}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-light-secondary dark:text-dark-secondary">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default VideoPage;
