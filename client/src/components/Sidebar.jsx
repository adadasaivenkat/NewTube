import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { FiHome, FiTrendingUp, FiYoutube } from "react-icons/fi";
import { MdHistory } from "react-icons/md";

const Sidebar = ({ isOpen }) => {
  const [userId, setUserId] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const location = useLocation();
  const API_URL = import.meta.env.VITE_BACKEND_URL;

  // Fetch logged in user info once
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(`${API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (response.data?._id) {
          setUserId(response.data._id);
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  // Fetch subscriptions whenever userId changes, and poll every 10 seconds
  useEffect(() => {
    if (!userId) return;

    const fetchSubscriptions = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await axios.get(
          `${API_URL}/api/users/${userId}/subscriptions`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        setSubscriptions(response.data);
      } catch (err) {
        console.error("Error fetching subscriptions:", err);
      }
    };

    fetchSubscriptions();
    const interval = setInterval(fetchSubscriptions, 10000);

    return () => clearInterval(interval);
  }, [userId]);

  const isActive = (path) => location.pathname === path;

  return (
    <aside
      className={`fixed left-0 top-16 bottom-0 z-40 bg-light-bg dark:bg-dark-bg border-r border-gray-200 dark:border-gray-800 overflow-y-auto transition-all duration-300 ease-in-out
        ${isOpen ? "w-56" : "w-16"}
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
      <nav className="h-full flex flex-col">
        {/* Main Navigation - Always Visible */}
        <div className="flex-none py-1">
          <Link
            to="/"
            className={`flex items-center px-2.5 py-2 rounded-lg transition-colors duration-200 gap-x-2.5 mx-1.5
              ${
                isActive("/")
                  ? "bg-light-hover dark:bg-dark-hover"
                  : "hover:bg-light-hover dark:hover:bg-dark-hover"
              }`}>
            <FiHome className="text-lg flex-shrink-0" />
            <span
              className={`${
                isOpen ? "opacity-100" : "opacity-0 md:hidden"
              } whitespace-nowrap transition-opacity duration-200 text-sm`}>
              Home
            </span>
          </Link>

          <Link
            to="/trending"
            className={`flex items-center px-2.5 py-2 rounded-lg transition-colors duration-200 gap-x-2.5 mx-1.5 mt-0.5
              ${
                isActive("/trending")
                  ? "bg-light-hover dark:bg-dark-hover"
                  : "hover:bg-light-hover dark:hover:bg-dark-hover"
              }`}>
            <FiTrendingUp className="text-lg flex-shrink-0" />
            <span
              className={`${
                isOpen ? "opacity-100" : "opacity-0 md:hidden"
              } whitespace-nowrap transition-opacity duration-200 text-sm`}>
              Trending
            </span>
          </Link>
        </div>

        {/* You Section with History - Only if Logged In */}
        {userId && (
          <>
            <div className="flex-none py-2 border-t border-gray-200 dark:border-gray-800">
              <h3
                className={`px-4 mb-1 text-xs font-medium text-gray-500 dark:text-gray-400 ${
                  !isOpen && "md:hidden"
                }`}>
                You
              </h3>
              <Link
                to="/your-videos"
                className={`flex items-center px-2.5 py-2 rounded-lg transition-colors duration-200 gap-x-2.5 mx-1.5
                  ${
                    isActive("/your-videos")
                      ? "bg-light-hover dark:bg-dark-hover"
                      : "hover:bg-light-hover dark:hover:bg-dark-hover"
                  }`}>
                <FiYoutube className="text-lg flex-shrink-0" />
                <span
                  className={`${
                    isOpen ? "opacity-100" : "opacity-0 md:hidden"
                  } whitespace-nowrap transition-opacity duration-200 text-sm`}>
                  Your Videos
                </span>
              </Link>
              <Link
                to="/history"
                className={`flex items-center px-2.5 py-2 rounded-lg transition-colors duration-200 gap-x-2.5 mx-1.5 mt-0.5
                  ${
                    isActive("/history")
                      ? "bg-light-hover dark:bg-dark-hover"
                      : "hover:bg-light-hover dark:hover:bg-dark-hover"
                  }`}>
                <MdHistory className="text-lg flex-shrink-0" />
                <span
                  className={`${
                    isOpen ? "opacity-100" : "opacity-0 md:hidden"
                  } whitespace-nowrap transition-opacity duration-200 text-sm`}>
                  History
                </span>
              </Link>
            </div>

            {/* Subscription List - Only when logged in and sidebar is open */}
            {isOpen && (
              <div className="flex-none py-2 border-t border-gray-200 dark:border-gray-800">
                <h3 className="px-4 mb-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                  Subscriptions
                </h3>
                {subscriptions.length > 0 ? (
                  subscriptions.map((sub) => (
                    <Link
                      key={sub._id || sub.name} // fallback to name if _id missing
                      to={`/channel/${sub._id}`}
                      className={`flex items-center px-2.5 py-1.5 rounded-lg transition-colors duration-200 gap-x-2.5 mx-1.5 mt-0.5
            ${
              isActive(`/channel/${sub._id}`)
                ? "bg-light-hover dark:bg-dark-hover"
                : "hover:bg-light-hover dark:hover:bg-dark-hover"
            }`}>
                      <img
                        src={sub.photo}
                        alt={sub.name}
                        className="w-5 h-5 rounded-full flex-shrink-0"
                      />
                      <span className="truncate text-sm">{sub.name}</span>
                    </Link>
                  ))
                ) : (
                  <p className="px-4 text-sm text-gray-500 dark:text-gray-400">
                    No subscriptions found
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        {isOpen && (
          <div className="mt-auto px-4 py-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-800">
            © {new Date().getFullYear()} Sai Venkat Adada
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
