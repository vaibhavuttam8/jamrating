import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const CLIENT_ID = "770dba681e514748980a75c9d29a2f42";
  const REDIRECT_URI = "http://localhost:3010";
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";
  const RATING_API_URL = "http://localhost:3010/api/rate"; // Example endpoint for rating

  const [token, setToken] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [artists, setArtists] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [rating, setRating] = useState(0);

  const logout = () => {
    setToken("");
    window.localStorage.removeItem("token");
  };

  const searchArtists = async (e) => {
    e.preventDefault();
    const { data } = await axios.get("https://api.spotify.com/v1/search", {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: searchKey, type: "artist" }
    });
    setArtists(data.artists.items);
  };

  const fetchCurrentlyPlaying = async () => {
    try {
      const { data } = await axios.get("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentTrack(data.item);
    } catch (error) {
      console.error('Error fetching currently playing track:', error);
      setCurrentTrack(null);
    }
  };

  const submitRating = async () => {
    try {
      await axios.post(RATING_API_URL, {
        trackId: currentTrack.id,
        rating
      });
      alert('Rating submitted!');
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");

    if (!token && hash) {
      const tokenFragment = hash.substring(1).split("&").find(elem => elem.startsWith("access_token"));
      if (tokenFragment) {
        token = tokenFragment.split("=")[1];
        window.localStorage.setItem("token", token);
        window.location.hash = "";
        setToken(token);
      }
    } else if (token) {
      setToken(token);
    }

    console.log("Token:", token); // Debugging log to check token state
  }, []);

  useEffect(() => {
    if (token) {
      fetchCurrentlyPlaying();
      const interval = setInterval(fetchCurrentlyPlaying, 5000); // Fetch current track every 5 seconds
      return () => clearInterval(interval);
    }
  }, [token]);

  const renderArtists = () => {
    return artists.map(artist => (
      <div key={artist.id}>
        {artist.images.length ? <img width={"50%"} src={artist.images[0].url} alt="" /> : <div>No Image</div>}
        {artist.name}
      </div>
    ));
  };

  const renderCurrentTrack = () => {
    if (currentTrack) {
      return (
        <div>
          <h2>Currently Playing</h2>
          <img src={currentTrack.album.images[0].url} alt="Album cover" style={{ width: 200, height: 200 }} />
          <p><strong>{currentTrack.name}</strong> by {currentTrack.artists.map(artist => artist.name).join(', ')}</p>
          <input
            type="range"
            min="0"
            max="100"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            style={{ width: '100%' }}
          />
          <p>Rating: {rating}</p>
          <button onClick={submitRating}>Submit Rating</button>
        </div>
      );
    }
    return <p>No track is currently playing.</p>;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>JAM RATING</h1>
        {!token ? (
          <a href={`${AUTH_ENDPOINT}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=${RESPONSE_TYPE}`}>
            <button className="login-button">Login to Spotify</button>
          </a>
        ) : (
          <button onClick={logout}>Logout</button>
        )}

        {token ? (
          <form onSubmit={searchArtists}>
            <input
              type="text"
              value={searchKey}
              onChange={(e) => setSearchKey(e.target.value)}
              placeholder="Search for artists"
            />
            <button type="submit">Search</button>
          </form>
        ) : (
          <h2>Please Login</h2>
        )}

        {renderArtists()}
        {renderCurrentTrack()}
      </header>
    </div>
  );
}

export default App;
