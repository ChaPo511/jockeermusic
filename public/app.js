document.addEventListener('DOMContentLoaded', () => {
  let selectedGuildId = '';
  let currentGuildData = null;
  let currentUser = null;

  // DOM Elements
  const loginOverlay = document.getElementById('loginOverlay');
  const mainWrapper = document.getElementById('mainWrapper');
  const btnLoginDiscord = document.getElementById('btnLoginDiscord');
  
  const userProfileSection = document.getElementById('userProfileSection');
  const userAvatar = document.getElementById('userAvatar');
  const userTag = document.getElementById('userTag');
  const btnLogoutDiscord = document.getElementById('btnLogoutDiscord');

  const botAvatar = document.getElementById('botAvatar');
  const botName = document.getElementById('botName');
  const botId = document.getElementById('botId');
  const botPing = document.getElementById('botPing');
  const statQueues = document.getElementById('statQueues');
  const guildSelect = document.getElementById('guildSelect');
  
  const voiceChannelName = document.getElementById('voiceChannelName');
  const voiceChannelSelect = document.getElementById('voiceChannelSelect');
  const btnConnectVoice = document.getElementById('btnConnectVoice');

  const trackArt = document.getElementById('trackArt');
  const trackTitle = document.getElementById('trackTitle');
  const trackArtist = document.getElementById('trackArtist');
  const trackSourceBadge = document.getElementById('trackSourceBadge');
  const visualizer = document.getElementById('visualizer');

  const progressBarFill = document.getElementById('progressBarFill');
  const timeElapsed = document.getElementById('timeElapsed');
  const timeTotal = document.getElementById('timeTotal');

  const btnPrevious = document.getElementById('btnPrevious');
  const btnPlayPause = document.getElementById('btnPlayPause');
  const btnSkip = document.getElementById('btnSkip');
  const btnStop = document.getElementById('btnStop');

  const volumeSlider = document.getElementById('volumeSlider');
  const volumeValue = document.getElementById('volumeValue');
  const volumeIcon = document.getElementById('volumeIcon');

  const btnLoop = document.getElementById('btnLoop');
  const loopStateText = document.getElementById('loopStateText');
  const btnShuffle = document.getElementById('btnShuffle');

  const musicQueryInput = document.getElementById('musicQueryInput');
  const btnAddMusic = document.getElementById('btnAddMusic');
  const quickTags = document.querySelectorAll('.hud-tag');

  const queueCount = document.getElementById('queueCount');
  const queueListContainer = document.getElementById('queueListContainer');
  const btnClearQueue = document.getElementById('btnClearQueue');

  // API URL Config Modal Elements
  const btnOpenApiModal = document.getElementById('btnOpenApiModal');
  const btnCloseApiModal = document.getElementById('btnCloseApiModal');
  const btnSaveBackendUrl = document.getElementById('btnSaveBackendUrl');
  const apiModal = document.getElementById('apiModal');
  const inputBackendUrl = document.getElementById('inputBackendUrl');

  if (btnOpenApiModal) {
    btnOpenApiModal.addEventListener('click', () => {
      const current = localStorage.getItem('bot_backend_url') || '';
      inputBackendUrl.value = current || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? window.location.origin : 'http://localhost:3000');
      apiModal.style.display = 'flex';
    });
  }

  if (btnCloseApiModal) {
    btnCloseApiModal.addEventListener('click', () => {
      apiModal.style.display = 'none';
    });
  }

  if (btnSaveBackendUrl) {
    btnSaveBackendUrl.addEventListener('click', () => {
      let url = inputBackendUrl.value.trim();
      if (!url) {
        localStorage.removeItem('bot_backend_url');
        showToast('Backend URL reset.', 'info');
      } else {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'http://' + url;
        }
        localStorage.setItem('bot_backend_url', url);
        showToast(`Backend URL set to: ${url}`, 'success');
      }
      apiModal.style.display = 'none';
      fetchBotStatus();
      fetchGuilds();
    });
  }

  // Check Auth State On Startup
  checkAuthStatus();

  function getApiUrl(path) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const saved = localStorage.getItem('bot_backend_url');
      return saved ? saved.replace(/\/+$/, '') + path : path;
    }
    const customBackend = localStorage.getItem('bot_backend_url');
    if (customBackend) {
      return customBackend.replace(/\/+$/, '') + path;
    }
    return 'http://localhost:3000' + path;
  }

  // Login Button Handler (Discord OAuth with Netlify Fallback)
  btnLoginDiscord.addEventListener('click', async () => {
    try {
      const res = await fetch(getApiUrl('/api/auth/config'));
      if (res.ok) {
        const data = await res.json();
        if (data.authUrl) {
          window.location.href = data.authUrl;
          return;
        }
      }
    } catch (e) {}

    // Fallback client-side generator (for Netlify / static hosts)
    const clientId = '1354292017685073970';
    const redirectUri = window.location.origin + '/auth/callback.html';
    const fallbackAuthUrl = `https://discord.com/oauth2/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify+guilds`;
    window.location.href = fallbackAuthUrl;
  });

  // Logout Button Handler (لوكاوتي)
  btnLogoutDiscord.addEventListener('click', () => {
    localStorage.removeItem('discord_token');
    currentUser = null;
    showToast('Logged out of Discord.', 'info');
    showLoginScreen();
  });

  async function checkAuthStatus() {
    const token = localStorage.getItem('discord_token');
    if (!token) {
      showLoginScreen();
      return;
    }

    try {
      let res = await fetch(getApiUrl('/api/auth/me'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        currentUser = await res.json();
        renderUserProfile(currentUser);
        showDashboard();
        return;
      }

      // Direct Discord API fallback (for Netlify / static hosting)
      res = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const u = await res.json();
        currentUser = {
          id: u.id,
          username: u.username,
          globalName: u.global_name || u.username,
          avatar: u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png?size=128` : `https://cdn.discordapp.com/embed/avatars/${parseInt(u.discriminator || '0', 10) % 5}.png`
        };
        renderUserProfile(currentUser);
        showDashboard();
      } else {
        localStorage.removeItem('discord_token');
        showLoginScreen();
      }
    } catch(e) {
      showLoginScreen();
    }
  }

  function showLoginScreen() {
    loginOverlay.style.display = 'flex';
    mainWrapper.style.display = 'none';
  }

  function showDashboard() {
    loginOverlay.style.display = 'none';
    mainWrapper.style.display = 'block';

    fetchBotStatus();
    fetchGuilds();
    setInterval(fetchBotStatus, 10000);
    setInterval(fetchCurrentGuildQueue, 1500);
  }

  function renderUserProfile(user) {
    if (!user) return;
    if (user.avatar) userAvatar.src = user.avatar;
    userTag.textContent = `@${user.username}`;
  }

  function getAuthHeader() {
    const token = localStorage.getItem('discord_token') || '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Guild Select Event
  guildSelect.addEventListener('change', (e) => {
    selectedGuildId = e.target.value;
    updateVoiceChannelsDropdown();
    fetchCurrentGuildQueue();
  });

  // Connect Voice Channel
  btnConnectVoice.addEventListener('click', async () => {
    const vcId = voiceChannelSelect.value;
    if (!selectedGuildId) return showToast('Please select a server first.', 'error');
    if (!vcId) return showToast('Please select a voice channel.', 'error');

    showToast('Connecting to voice channel...', 'info');
    try {
      const res = await fetch(getApiUrl('/api/play'), {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ guildId: selectedGuildId, query: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', voiceChannelId: vcId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Connected to voice channel!', 'success');
        fetchCurrentGuildQueue();
      } else {
        if (res.status === 401) {
          showToast('Session expired. Log in with Discord again.', 'error');
          showLoginScreen();
        } else {
          showToast(data.error || 'Connection failed', 'error');
        }
      }
    } catch(e) {
      showToast('Error connecting to voice channel', 'error');
    }
  });

  // Control Action Helper
  async function sendControl(action, value = null) {
    if (!selectedGuildId) {
      showToast('Select a server first.', 'error');
      return;
    }

    try {
      const res = await fetch(getApiUrl('/api/control'), {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ guildId: selectedGuildId, action, value })
      });
      const data = await res.json();
      if (res.ok) {
        fetchCurrentGuildQueue();
      } else {
        if (res.status === 401) {
          showToast('Session expired. Log in with Discord again.', 'error');
          showLoginScreen();
        } else {
          showToast(data.error || 'Action failed', 'error');
        }
      }
    } catch (e) {
      showToast('Network error while controlling playback', 'error');
    }
  }

  // Playback Control Handlers
  btnPlayPause.addEventListener('click', () => {
    if (!currentGuildData) return;
    if (currentGuildData.isPlaying) {
      sendControl('pause');
    } else {
      sendControl('resume');
    }
  });

  btnSkip.addEventListener('click', () => sendControl('skip'));
  btnPrevious.addEventListener('click', () => sendControl('previous'));
  btnStop.addEventListener('click', () => sendControl('stop'));
  btnShuffle.addEventListener('click', () => {
    sendControl('shuffle');
    showToast('Queue shuffled! 🔀', 'success');
  });

  btnLoop.addEventListener('click', () => {
    if (!currentGuildData) return;
    const current = currentGuildData.loopMode;
    const next = current === 'off' ? 'track' : current === 'track' ? 'queue' : 'off';
    sendControl('loop', next);
    showToast(`Loop mode: ${next.toUpperCase()}`, 'info');
  });

  volumeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    volumeValue.textContent = `${val}%`;
    updateVolumeIcon(val);
  });

  volumeSlider.addEventListener('change', (e) => {
    sendControl('volume', e.target.value);
  });

  btnClearQueue.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the entire queue?')) {
      sendControl('clear');
      showToast('Queue cleared! 🧹', 'success');
    }
  });

  // Add Track Handler
  async function addTrack() {
    const query = musicQueryInput.value.trim();
    if (!selectedGuildId) {
      showToast('Please select a server first.', 'error');
      return;
    }
    if (!query) {
      showToast('Please enter a song name or URL.', 'error');
      return;
    }

    showToast('Resolving song details...', 'info');
    btnAddMusic.disabled = true;

    try {
      const res = await fetch(getApiUrl('/api/play'), {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({
          guildId: selectedGuildId,
          query,
          voiceChannelId: voiceChannelSelect.value || null
        })
      });

      const data = await res.json();
      btnAddMusic.disabled = false;

      if (res.ok) {
        musicQueryInput.value = '';
        if (data.playlistName) {
          showToast(`Added playlist "${data.playlistName}" (${data.added} tracks)! 🎉`, 'success');
        } else {
          showToast(`Added "${data.firstTrack.title}" to queue! 🎵`, 'success');
        }
        fetchCurrentGuildQueue();
      } else {
        if (res.status === 401) {
          showToast('Session expired. Log in with Discord again.', 'error');
          showLoginScreen();
        } else {
          showToast(data.error || 'Failed to add track.', 'error');
        }
      }
    } catch(e) {
      btnAddMusic.disabled = false;
      showToast('Error sending play request.', 'error');
    }
  }

  btnAddMusic.addEventListener('click', addTrack);
  musicQueryInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTrack();
  });

  // Quick Tags
  quickTags.forEach(tag => {
    tag.addEventListener('click', () => {
      musicQueryInput.value = tag.getAttribute('data-query');
      addTrack();
    });
  });

  // API Fetchers
  async function fetchBotStatus() {
    try {
      const res = await fetch(getApiUrl('/api/status'));
      if (!res.ok) {
        botPing.innerHTML = `<i class="fas fa-exclamation-circle" style="color:var(--danger-red);"></i> Offline`;
        return;
      }
      const data = await res.json();
      if (data.online) {
        if (data.avatar) botAvatar.src = data.avatar;
        botName.textContent = data.botName;
        if (botId && data.botId) botId.textContent = `ID: ${data.botId}`;
        botPing.innerHTML = `<i class="fas fa-signal"></i> ${data.ping} ms`;
        statQueues.textContent = `${data.activeQueues} Active Queue(s)`;
      }
    } catch(e) {
      botPing.innerHTML = `<i class="fas fa-exclamation-circle" style="color:var(--danger-red);"></i> Offline`;
    }
  }

  async function fetchGuilds() {
    try {
      const res = await fetch(getApiUrl('/api/guilds'), { headers: getAuthHeader() });
      if (res.status === 401) {
        localStorage.removeItem('discord_token');
        showLoginScreen();
        return;
      }
      if (!res.ok) {
        guildSelect.innerHTML = '<option value="">⚠️ Bot Backend Offline</option>';
        return;
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        guildSelect.innerHTML = '';
        if (data.length === 0) {
          guildSelect.innerHTML = '<option value="">No bot servers found</option>';
          return;
        }

        data.forEach(g => {
          const opt = document.createElement('option');
          opt.value = g.id;
          opt.textContent = `${g.name} (${g.memberCount} members)`;
          guildSelect.appendChild(opt);
        });

        if (!selectedGuildId && data.length > 0) {
          selectedGuildId = data[0].id;
          guildSelect.value = selectedGuildId;
        }

        window._guildsData = data;
        updateVoiceChannelsDropdown();
        fetchCurrentGuildQueue();
      }
    } catch(e) {
      guildSelect.innerHTML = '<option value="">⚠️ Bot Backend Offline</option>';
    }
  }

  function updateVoiceChannelsDropdown() {
    if (!window._guildsData) return;
    const currentG = window._guildsData.find(g => g.id === selectedGuildId);
    voiceChannelSelect.innerHTML = '<option value="">Select Voice Channel...</option>';

    if (currentG && currentG.voiceChannels) {
      currentG.voiceChannels.forEach(vc => {
        const opt = document.createElement('option');
        opt.value = vc.id;
        opt.textContent = `🔊 ${vc.name} (${vc.membersCount} members)`;
        voiceChannelSelect.appendChild(opt);
      });
      if (currentG.voiceChannelId) {
        voiceChannelSelect.value = currentG.voiceChannelId;
      }
    }
  }

  async function fetchCurrentGuildQueue() {
    if (!selectedGuildId) return;

    try {
      const res = await fetch(getApiUrl(`/api/queue/${selectedGuildId}`), { headers: getAuthHeader() });
      if (res.status === 401) {
        localStorage.removeItem('discord_token');
        showLoginScreen();
        return;
      }
      if (!res.ok) return;

      const data = await res.json();
      currentGuildData = data;

      // Voice Status
      if (data.voiceChannelName) {
        voiceChannelName.textContent = `🔊 ${data.voiceChannelName}`;
      } else {
        voiceChannelName.textContent = 'Not Connected';
      }

      // Now Playing Details
      if (data.currentTrack) {
        trackTitle.textContent = data.currentTrack.title;
        trackArtist.textContent = data.currentTrack.artist || (data.currentTrack.requester ? `Requested by @${data.currentTrack.requester}` : 'Unknown Artist');
        if (data.currentTrack.thumbnail) {
          trackArt.src = data.currentTrack.thumbnail;
        } else {
          trackArt.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop';
        }

        timeElapsed.textContent = data.currentTrack.elapsed || '00:00';
        timeTotal.textContent = data.currentTrack.total || '00:00';
        progressBarFill.style.width = `${Math.min(100, Math.max(0, data.currentTrack.percentage || 0))}%`;

        // Source badge
        const src = (data.currentTrack.source || 'youtube').toLowerCase();
        trackSourceBadge.className = `hud-source-tag ${src}`;
        if (src === 'spotify') {
          trackSourceBadge.innerHTML = '<i class="fab fa-spotify"></i> SPOTIFY';
        } else if (src === 'soundcloud') {
          trackSourceBadge.innerHTML = '<i class="fab fa-soundcloud"></i> SOUNDCLOUD';
        } else {
          trackSourceBadge.innerHTML = '<i class="fab fa-youtube"></i> YOUTUBE';
        }
      } else {
        trackTitle.textContent = 'NO TRACK PLAYING';
        trackArtist.textContent = 'Paste a URL or search above to play music';
        timeElapsed.textContent = '00:00';
        timeTotal.textContent = '00:00';
        progressBarFill.style.width = '0%';
        trackArt.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop';
      }

      // Play / Pause Icon State & Visualizer
      if (data.isPlaying) {
        btnPlayPause.innerHTML = '<i class="fas fa-pause"></i>';
        visualizer.style.display = 'flex';
      } else {
        btnPlayPause.innerHTML = '<i class="fas fa-play"></i>';
        visualizer.style.display = 'none';
      }

      // Volume & Loop
      if (document.activeElement !== volumeSlider) {
        volumeSlider.value = data.volume;
        volumeValue.textContent = `${data.volume}%`;
        updateVolumeIcon(data.volume);
      }

      loopStateText.textContent = (data.loopMode || 'off').toUpperCase();
      btnLoop.classList.toggle('active', data.loopMode !== 'off');

      // Queue List Rendering
      renderQueue(data.queue);

    } catch (e) {}
  }

  function renderQueue(queue) {
    queueCount.textContent = `${queue ? queue.length : 0} Track(s) Enqueued`;
    queueListContainer.innerHTML = '';

    if (!queue || queue.length === 0) {
      queueListContainer.innerHTML = `
        <div class="empty-queue-state">
          <i class="fas fa-compact-disc"></i>
          <p>QUEUE IS CURRENTLY EMPTY</p>
          <span>Paste a URL or search above to add songs</span>
        </div>
      `;
      return;
    }

    queue.forEach((item) => {
      const div = document.createElement('div');
      div.className = 'queue-item';

      const thumb = item.thumbnail || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600&auto=format&fit=crop';

      div.innerHTML = `
        <span class="index">#${item.index}</span>
        <img src="${thumb}" alt="Thumb" />
        <div class="queue-item-info">
          <h5 title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h5>
          <p>${escapeHtml(item.artist || (item.requester ? `@${item.requester}` : 'Music Track'))}</p>
        </div>
        <span class="duration">${item.durationFormatted}</span>
        <button class="btn-remove" title="Remove Track"><i class="fas fa-times"></i></button>
      `;

      div.querySelector('.btn-remove').addEventListener('click', () => {
        sendControl('remove', item.index);
        showToast(`Removed #${item.index} from queue`, 'info');
      });

      queueListContainer.appendChild(div);
    });
  }

  function updateVolumeIcon(vol) {
    if (vol == 0) {
      volumeIcon.className = 'fas fa-volume-mute';
    } else if (vol < 50) {
      volumeIcon.className = 'fas fa-volume-down';
    } else {
      volumeIcon.className = 'fas fa-volume-up';
    }
  }

  function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';

    toast.innerHTML = `<i class="fas ${icon}"></i> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function escapeHtml(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
