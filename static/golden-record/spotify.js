// ABOUTME: Spotify Web API integration using PKCE auth flow
// ABOUTME: Handles search, playlist creation, and track adding — all browser-side, no backend

const Spotify = {
  // Replace with your own Spotify app client ID
  CLIENT_ID: '',
  REDIRECT_URI: '',
  SCOPES: 'playlist-modify-public playlist-modify-private',

  isConfigured() {
    return this.CLIENT_ID && this.REDIRECT_URI;
  },

  isAuthenticated() {
    const token = localStorage.getItem('gr_spotify_token');
    const expiry = localStorage.getItem('gr_spotify_expiry');
    return token && expiry && Date.now() < parseInt(expiry, 10);
  },

  getToken() {
    return localStorage.getItem('gr_spotify_token');
  },

  // PKCE helpers
  generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], '');
  },

  async sha256(plain) {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return window.crypto.subtle.digest('SHA-256', data);
  },

  base64encode(input) {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  },

  async authorize() {
    if (!this.isConfigured()) {
      console.warn('Spotify not configured — set CLIENT_ID and REDIRECT_URI');
      return;
    }

    const verifier = this.generateRandomString(64);
    const hashed = await this.sha256(verifier);
    const challenge = this.base64encode(hashed);
    const state = this.generateRandomString(16);

    localStorage.setItem('gr_spotify_verifier', verifier);
    localStorage.setItem('gr_spotify_state', state);

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.CLIENT_ID,
      scope: this.SCOPES,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      redirect_uri: this.REDIRECT_URI,
      state: state
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params}`;
  },

  async handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedState = localStorage.getItem('gr_spotify_state');

    if (!code || state !== storedState) return false;

    const verifier = localStorage.getItem('gr_spotify_verifier');

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: this.REDIRECT_URI,
        code_verifier: verifier
      })
    });

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('gr_spotify_token', data.access_token);
      localStorage.setItem('gr_spotify_refresh', data.refresh_token);
      localStorage.setItem('gr_spotify_expiry', String(Date.now() + (data.expires_in * 1000)));

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
    return false;
  },

  async refreshToken() {
    const refresh = localStorage.getItem('gr_spotify_refresh');
    if (!refresh) return false;

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.CLIENT_ID,
        grant_type: 'refresh_token',
        refresh_token: refresh
      })
    });

    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('gr_spotify_token', data.access_token);
      localStorage.setItem('gr_spotify_expiry', String(Date.now() + (data.expires_in * 1000)));
      return true;
    }
    return false;
  },

  async api(endpoint, options = {}) {
    const token = this.getToken();
    if (!token) throw new Error('Not authenticated');

    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      if (refreshed) return this.api(endpoint, options);
      throw new Error('Authentication expired');
    }

    return response.json();
  },

  async search(query) {
    const data = await this.api(`/search?q=${encodeURIComponent(query)}&type=track&limit=5`);
    return data.tracks?.items || [];
  },

  async getCurrentUser() {
    return this.api('/me');
  },

  async createPlaylist(name, description, trackUris) {
    // Create playlist
    const playlist = await this.api('/me/playlists', {
      method: 'POST',
      body: JSON.stringify({
        name: name,
        description: description,
        public: true
      })
    });

    // Add tracks (max 100 per request, but we only have 27)
    if (trackUris.length > 0) {
      await this.api(`/playlists/${playlist.id}/items`, {
        method: 'POST',
        body: JSON.stringify({ uris: trackUris })
      });
    }

    return playlist;
  },

  disconnect() {
    localStorage.removeItem('gr_spotify_token');
    localStorage.removeItem('gr_spotify_refresh');
    localStorage.removeItem('gr_spotify_expiry');
    localStorage.removeItem('gr_spotify_verifier');
    localStorage.removeItem('gr_spotify_state');
  }
};
