// ABOUTME: Main application logic for Your Golden Record
// ABOUTME: Manages screen navigation, track list state, and connects UI to sleeve generator and Spotify

const App = {
  tracks: [],
  maxTracks: 27,

  screens: {
    intro: null,
    tracks: null,
    greeting: null,
    result: null
  },

  init() {
    // Cache screen elements
    this.screens.intro = document.getElementById('intro');
    this.screens.tracks = document.getElementById('tracks');
    this.screens.greeting = document.getElementById('greeting');
    this.screens.result = document.getElementById('result');

    // Restore saved state if any
    this.loadState();

    // Init spinning record
    Record.init();

    // Handle Spotify OAuth callback
    this.handleSpotifyCallback();

    // Bind events
    this.bindEvents();

    // Update UI
    this.updateTrackCounter();
  },

  bindEvents() {
    // Navigation
    document.getElementById('start-btn').addEventListener('click', () => {
      this.showScreen('tracks');
    });

    document.getElementById('to-greeting-btn').addEventListener('click', () => {
      this.showScreen('greeting');
    });

    document.getElementById('back-to-tracks-btn').addEventListener('click', () => {
      this.showScreen('tracks');
    });

    document.getElementById('start-over-btn').addEventListener('click', () => {
      this.tracks = [];
      document.getElementById('greeting-input').value = '';
      this.renderTrackList();
      this.updateTrackCounter();
      this.saveState();
      this.showScreen('intro');
    });

    // Track input
    const trackInput = document.getElementById('track-input');
    const addBtn = document.getElementById('add-track-btn');

    const addTrack = () => {
      const value = trackInput.value.trim();
      if (!value) return;
      if (this.tracks.length >= this.maxTracks) return;

      // Parse "title - artist" or just "title"
      let title, artist;
      if (value.includes(' - ')) {
        const parts = value.split(' - ');
        title = parts[0].trim();
        artist = parts.slice(1).join(' - ').trim();
      } else {
        title = value;
        artist = '';
      }

      this.tracks.push({ title, artist, spotifyUri: null });
      trackInput.value = '';
      this.renderTrackList();
      this.updateTrackCounter();
      this.saveState();

      // Hide search results
      document.getElementById('spotify-search-results').classList.add('hidden');

      trackInput.focus();
    };

    addBtn.addEventListener('click', addTrack);
    trackInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') addTrack();
    });

    // Spotify search as you type (debounced)
    let searchTimeout;
    trackInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      const query = trackInput.value.trim();
      if (query.length < 3 || !Spotify.isAuthenticated()) {
        document.getElementById('spotify-search-results').classList.add('hidden');
        return;
      }
      searchTimeout = setTimeout(() => this.spotifySearch(query), 400);
    });

    // Greeting char counter
    const greetingInput = document.getElementById('greeting-input');
    greetingInput.addEventListener('input', () => {
      document.getElementById('char-count').textContent = greetingInput.value.length;
    });

    // Generate — wait for font to be ready
    document.getElementById('generate-btn').addEventListener('click', async () => {
      await document.fonts.ready;
      // Force font load by checking if Press Start 2P is available
      await document.fonts.load('8px "Press Start 2P"');
      this.generateSleeve();
      this.showScreen('result');
    });

    // Downloads
    document.getElementById('download-front-btn').addEventListener('click', () => {
      Sleeve.downloadCanvas(document.getElementById('sleeve-front'), 'golden-record-front.png');
    });

    document.getElementById('download-back-btn').addEventListener('click', () => {
      Sleeve.downloadCanvas(document.getElementById('sleeve-back'), 'golden-record-back.png');
    });

    // Spotify playlist creation
    document.getElementById('spotify-btn').addEventListener('click', () => {
      this.saveToSpotify();
    });
  },

  showScreen(name) {
    Object.values(this.screens).forEach(s => s.classList.remove('active'));
    this.screens[name].classList.add('active');

    if (name === 'intro') {
      Record.init();
    } else {
      Record.stop();
    }
  },

  renderTrackList() {
    const list = document.getElementById('track-list');
    list.innerHTML = '';

    this.tracks.forEach((track, i) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="track-info">
          <span class="track-title">${this.escapeHtml(track.title)}</span>
          ${track.artist ? `<br><span class="track-artist">${this.escapeHtml(track.artist)}</span>` : ''}
        </div>
        <span class="remove-track" data-index="${i}">&times;</span>
      `;
      list.appendChild(li);
    });

    // Bind remove buttons
    list.querySelectorAll('.remove-track').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        this.tracks.splice(idx, 1);
        this.renderTrackList();
        this.updateTrackCounter();
        this.saveState();
      });
    });
  },

  updateTrackCounter() {
    document.getElementById('track-count').textContent = this.tracks.length;

    const nextBtn = document.getElementById('to-greeting-btn');
    nextBtn.disabled = this.tracks.length === 0;

    // Update add button state
    const addBtn = document.getElementById('add-track-btn');
    if (this.tracks.length >= this.maxTracks) {
      addBtn.disabled = true;
      document.getElementById('track-input').placeholder = 'Your record is full.';
      document.getElementById('track-input').disabled = true;
    } else {
      addBtn.disabled = false;
      document.getElementById('track-input').placeholder = 'Enter a song title and artist...';
      document.getElementById('track-input').disabled = false;
    }
  },

  async spotifySearch(query) {
    const resultsDiv = document.getElementById('spotify-search-results');
    try {
      const results = await Spotify.search(query);
      if (results.length === 0) {
        resultsDiv.classList.add('hidden');
        return;
      }

      resultsDiv.innerHTML = '';
      results.forEach(track => {
        const div = document.createElement('div');
        div.className = 'search-result-item';
        div.innerHTML = `${this.escapeHtml(track.name)} <span class="artist">— ${this.escapeHtml(track.artists.map(a => a.name).join(', '))}</span>`;
        div.addEventListener('click', () => {
          if (this.tracks.length >= this.maxTracks) return;
          this.tracks.push({
            title: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            spotifyUri: track.uri
          });
          document.getElementById('track-input').value = '';
          resultsDiv.classList.add('hidden');
          this.renderTrackList();
          this.updateTrackCounter();
          this.saveState();
          document.getElementById('track-input').focus();
        });
        resultsDiv.appendChild(div);
      });
      resultsDiv.classList.remove('hidden');
    } catch (err) {
      console.error('Spotify search failed:', err);
      resultsDiv.classList.add('hidden');
    }
  },

  generateSleeve() {
    const greeting = document.getElementById('greeting-input').value;
    const frontCanvas = document.getElementById('sleeve-front');
    const backCanvas = document.getElementById('sleeve-back');

    Sleeve.generateFront(frontCanvas, this.tracks, greeting);
    Sleeve.generateBack(backCanvas, this.tracks, greeting);
  },

  async saveToSpotify() {
    if (!Spotify.isConfigured()) {
      alert('Spotify integration is not configured yet. Download the sleeve images instead!');
      return;
    }

    if (!Spotify.isAuthenticated()) {
      await Spotify.authorize();
      return;
    }

    const uris = this.tracks
      .filter(t => t.spotifyUri)
      .map(t => t.spotifyUri);

    if (uris.length === 0) {
      alert('No Spotify tracks to save. Try searching for tracks with Spotify connected.');
      return;
    }

    try {
      const greeting = document.getElementById('greeting-input').value;
      const desc = greeting
        ? `My Golden Record. "${greeting.substring(0, 200)}"`
        : 'My Golden Record — assembled at yourgoldenrecord.com';

      const playlist = await Spotify.createPlaylist(
        'My Golden Record',
        desc,
        uris
      );

      alert(`Playlist created! Opening in Spotify...`);
      window.open(playlist.external_urls.spotify, '_blank');
    } catch (err) {
      console.error('Failed to create playlist:', err);
      alert('Failed to create playlist. Try reconnecting to Spotify.');
    }
  },

  async handleSpotifyCallback() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('code')) {
      const success = await Spotify.handleCallback();
      if (success) {
        const user = await Spotify.getCurrentUser();
        this.showSpotifyStatus(user.display_name);
      }
    } else if (Spotify.isAuthenticated()) {
      try {
        const user = await Spotify.getCurrentUser();
        this.showSpotifyStatus(user.display_name);
      } catch (e) {
        // Token expired or invalid
      }
    }
  },

  showSpotifyStatus(name) {
    const status = document.getElementById('spotify-status');
    document.getElementById('spotify-user').textContent = `Spotify: ${name}`;
    status.classList.remove('hidden');

    document.getElementById('spotify-disconnect').addEventListener('click', () => {
      Spotify.disconnect();
      status.classList.add('hidden');
    });
  },

  // State persistence (survives page refresh)
  saveState() {
    const state = {
      tracks: this.tracks,
      greeting: document.getElementById('greeting-input')?.value || ''
    };
    localStorage.setItem('gr_state', JSON.stringify(state));
  },

  loadState() {
    const saved = localStorage.getItem('gr_state');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.tracks = state.tracks || [];
        if (state.greeting) {
          const input = document.getElementById('greeting-input');
          if (input) {
            input.value = state.greeting;
            document.getElementById('char-count').textContent = state.greeting.length;
          }
        }
        this.renderTrackList();
      } catch (e) {
        // Corrupted state, ignore
      }
    }
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
document.fonts.ready.then(() => {
  // Re-render if font loads after initial draw
  if (App.tracks.length > 0) {
    App.renderTrackList();
  }
});
