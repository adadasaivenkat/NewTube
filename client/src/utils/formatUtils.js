export const formatViewCount = (views) => {
  if (!views && views !== 0) return "0";

  if (views < 1000) {
    return views.toString();
  } else if (views < 1000000) {
    return `${(views / 1000).toFixed(views < 10000 ? 1 : 0)}K`;
  } else {
    return `${(views / 1000000).toFixed(views < 10000000 ? 1 : 0)}M`;
  }
};

export const formatSubscriberCount = (count) => {
  if (!count && count !== 0) return "0";

  if (count < 1000) {
    return count.toString();
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(count < 10000 ? 1 : 0)}K`;
  } else {
    return `${(count / 1000000).toFixed(count < 10000000 ? 1 : 0)}M`;
  }
};

export const formatDuration = (seconds) => {
  if (!seconds) return "0:00";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
};
