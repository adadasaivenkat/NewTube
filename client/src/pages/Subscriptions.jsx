import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) {
      setSubscriptions([]);
      return;
    }

    let isMounted = true;

    const fetchSubscriptions = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/api/users/${userId}/subscriptions`
        );
        if (isMounted) {
          setSubscriptions(res.data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Failed to fetch subscriptions", err);
          setError("Failed to load subscriptions");
        }
      }
    };

    fetchSubscriptions();
    const interval = setInterval(fetchSubscriptions, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [userId]);

  if (!userId) {
    return <p>Please log in to see your subscriptions.</p>;
  }

  return (
    <div>
      <h2>Your Subscriptions</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {subscriptions.length === 0 && !error ? (
        <p>No subscriptions yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {subscriptions.map((channel) => (
            <li
              key={channel._id}
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: 10,
              }}>
              <img
                src={`${API_URL}/uploads/profilepics/${channel.photo}`}
                alt={channel.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `${API_URL}/uploads/profilepics/default_image.png`;
                }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  marginRight: 10,
                  objectFit: "cover",
                }}
              />
              <span>{channel.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Subscriptions;
