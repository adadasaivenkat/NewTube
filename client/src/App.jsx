import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useTheme } from "./context/ThemeContext";

// Layouts
import MainLayout from "./layouts/MainLayout";

// Pages
import Home from "./pages/Home";
import VideoPage from "./pages/VideoPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Channel from "./pages/Channel";
import NotFound from "./pages/NotFound";
import Trending from "./pages/Trending";
import Subscriptions from "./pages/Subscriptions";
import History from "./pages/History";
import Studio from "./pages/Studio";
import Search from "./pages/Search";
import Upload from "./pages/Upload";
import Videos from "./pages/Videos";

function App() {
  const { theme } = useTheme();
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <div className="font-roboto bg-light-bg dark:bg-dark-bg min-h-screen text-light-text dark:text-dark-text">
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="trending" element={<Trending />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="history" element={<History />} />
          <Route
            path="/your-videos"
            element={
              userId ? (
                <Videos userId={userId} />
              ) : (
                <div>Please log in to see your videos.</div>
              )
            }
          />
          <Route path="search" element={<Search />} />
          <Route path="video/:videoId" element={<VideoPage />} />
          <Route path="channel/:id" element={<Channel />} />
        </Route>
        <Route path="/studio" element={<Studio />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </div>
  );
}

export default App;
