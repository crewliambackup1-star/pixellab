'use strict';
(function () {
  const $ = (id) => document.getElementById(id);
  const config = window.PIXELLAB_CONFIG || {};
  const validConfig = () => config.provider === 'supabase'
    && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(String(config.url || ''))
    && String(config.publishableKey || '').startsWith('sb_publishable_')
    && !String(config.publishableKey || '').startsWith('sb_secret_');
  let client = null;
  let user = null;
  let profile = null;
  let currentRoom = null;
  let roomChannel = null;
  let roomPoller = null;
  let busy = false;
  let targetGame = 'tictactoe';

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
  function notify(message) {
    if (typeof window.flash === 'function') window.flash(message);
    else if ($('toast')) { $('toast').textContent = message; $('toast').classList.add('show'); }
  }
  function setStatus(message, kind) {
    const node = $('mpStatus');
    if (node) { node.textContent = message; node.className = 'mp-status' + (kind ? ' ' + kind : ''); }
  }
  function stopRoomWatch() {
    if (roomChannel && client) client.removeChannel(roomChannel);
    roomChannel = null;
    if (roomPoller) window.clearInterval(roomPoller);
    roomPoller = null;
  }
  function loadProfile() {
    if (!client || !user) { profile = null; renderHub(); return; }
    client.from('profiles').select('id,username,avatar_key,wins,losses,draws,created_at')
      .eq('id', user.id).single()
      .then(({ data, error }) => {
        profile = error ? null : data;
        renderHub();
        if (currentRoom) renderRoom(currentRoom);
      });
  }
  function authCard() {
    if (!validConfig()) {
      return '<div class="mp-setup-card"><div class="mp-big-icon">🔐</div>' +
        '<span class="mp-kicker">ACCOUNT SYSTEM</span><h3>Online play is nearly ready.</h3>' +
        '<p>The account and private-room screens are built, but no backend project is connected yet. Solo and same-device games still work without accounts.</p>' +
        '<a class="mp-inline-link" href="V9_SETUP.md" target="_blank" rel="noopener">Open the V9 setup guide ↗</a>' +
        '<p class="mp-safe-note">For security, only a public publishable key belongs in browser configuration. Never add a secret/service-role key.</p></div>';
    }
    if (!client) {
      return '<div class="mp-setup-card"><div class="mp-big-icon">⚠️</div><h3>Account service unavailable</h3>' +
        '<p>The Supabase browser library did not load. Check the connection and reload. Offline and local games are unaffected.</p></div>';
    }
    if (user) return '';
    return '<div class="mp-auth-card"><span class="mp-kicker">PIXELLAB ACCOUNT</span><h3>Sign in to play online</h3>' +
      '<p>Accounts are needed for online rooms only. Keep your username pseudonymous; never use your real name or school.</p>' +
      '<div class="mp-auth-tabs"><button type="button" data-auth-tab="signin" class="mp-tab active">Sign in</button><button type="button" data-auth-tab="signup" class="mp-tab">Create account</button></div>' +
      '<form id="mpSignInForm" class="mp-form"><label>Email<input type="email" name="email" autocomplete="email" required maxlength="254"></label>' +
      '<label>Password<input type="password" name="password" autocomplete="current-password" required minlength="10" maxlength="128"></label>' +
      '<button class="primary" type="submit">Sign in</button><button class="mp-text-button" type="button" id="mpResetPassword">Send password reset email</button></form>' +
      '<form id="mpSignUpForm" class="mp-form" hidden><label>Username <small>3–16 letters, numbers, or underscores</small><input name="username" autocomplete="nickname" pattern="[A-Za-z0-9_]{3,16}" minlength="3" maxlength="16" required></label>' +
      '<label>Email <small>Used for sign-in and account recovery; never shown on your profile</small><input type="email" name="email" autocomplete="email" required maxlength="254"></label>' +
      '<label>Password <small>Use a unique password with at least 10 characters</small><input type="password" name="password" autocomplete="new-password" minlength="10" maxlength="128" required></label>' +
      '<button class="primary" type="submit">Create account</button></form><p class="mp-safe-note">No public chat. Profiles show your username and game stats only.</p></div>';
  }
  function profileCard() {
    if (!user || !profile) return '';
    const total = profile.wins + profile.losses + profile.draws;
    const rate = total ? Math.round(profile.wins * 100 / total) : 0;
    const avatars = { pixel: '🎮', spark: '✨', comet: '☄️', bolt: '⚡', orbit: '🪐', wave: '🌊' };
    return '<div class="mp-profile-card"><div class="mp-profile-top"><div class="mp-avatar">' + (avatars[profile.avatar_key] || '🎮') +
      '</div><div><span class="mp-kicker">SIGNED IN</span><h3>@' + esc(profile.username) + '</h3><p>Your email stays private.</p></div>' +
      '<button type="button" id="mpSignOut" class="mp-quiet-button">Sign out</button></div>' +
      '<div class="mp-profile-controls"><label>Avatar<select id="mpAvatar">' + Object.entries(avatars).map(([k,v]) => '<option value="' + k + '"' + (profile.avatar_key === k ? ' selected' : '') + '>' + v + ' ' + k[0].toUpperCase() + k.slice(1) + '</option>').join('') + '</select></label>' +
      '<label>Username<input id="mpUsername" value="' + esc(profile.username) + '" minlength="3" maxlength="16" pattern="[A-Za-z0-9_]{3,16}"></label><button type="button" id="mpSaveProfile" class="secondary">Save profile</button></div>' +
      '<div class="mp-profile-stats"><div><strong>' + profile.wins + '</strong><span>Wins</span></div><div><strong>' + profile.losses + '</strong><span>Losses</span></div><div><strong>' + profile.draws + '</strong><span>Draws</span></div><div><strong>' + rate + '%</strong><span>Win rate</span></div></div></div>';
  }
  function lobbyCard() {
    if (!user || !profile) return '';
    return '<div class="mp-lobby-card"><span class="mp-kicker">PRIVATE MATCHMAKING</span><h3>Play with a friend</h3>' +
      '<p>Create a room and share its six-character code, or enter a friend’s code. Both players must sign in.</p>' +
      '<label>Game<select id="mpGameSelect"><option value="tictactoe">Tic-Tac-Toe · Online beta</option><option disabled>Connect Four · Online coming next</option><option disabled>Neon Pong · Online coming next</option></select></label>' +
      '<button type="button" id="mpCreateRoom" class="primary">＋ Create private room</button>' +
      '<form id="mpJoinRoomForm" class="mp-join-form"><label>Room code<input id="mpJoinCode" name="code" autocomplete="off" maxlength="6" minlength="6" pattern="[A-HJ-NP-Z2-9]{6}" placeholder="ABC234" required></label><button class="secondary" type="submit">Join room</button></form>' +
      '<p class="mp-safe-note">Room codes are private invitations, not passwords. Only the two joined accounts can access a match. Open chat is intentionally not included.</p></div>';
  }
  function renderHub() {
    const auth = $('mpAuthArea');
    const account = $('mpAccountArea');
    const lobby = $('mpLobbyArea');
    if (!auth || !account || !lobby) return;
    auth.innerHTML = authCard();
    account.innerHTML = user ? (profile ? profileCard() : '<div class="mp-setup-card"><p>Loading your profile…</p></div>') : '';
    lobby.innerHTML = user && profile ? lobbyCard() : '';
    const topButton = $('multiplayerBtn');
    if (topButton) topButton.textContent = user && profile ? '@' + profile.username : '🌐 Online play';
    if (window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const invited = (params.get('room') || '').toUpperCase();
      const input = $('mpJoinCode');
      if (input && /^[A-HJ-NP-Z2-9]{6}$/.test(invited)) input.value = invited;
    }
    bindHubForms();
  }
  function bindHubForms() {
    const tabButtons = document.querySelectorAll('[data-auth-tab]');
    tabButtons.forEach(button => button.addEventListener('click', () => {
      const signup = button.dataset.authTab === 'signup';
      const signinForm = $('mpSignInForm'), signupForm = $('mpSignUpForm');
      if (signinForm) signinForm.hidden = signup;
      if (signupForm) signupForm.hidden = !signup;
      tabButtons.forEach(b => b.classList.toggle('active', b === button));
    }));
    const signin = $('mpSignInForm');
    if (signin) signin.addEventListener('submit', async event => {
      event.preventDefault(); if (busy) return; busy = true;
      const data = new FormData(signin);
      setStatus('Signing in…');
      const { error } = await client.auth.signInWithPassword({ email: String(data.get('email')).trim(), password: String(data.get('password')) });
      busy = false;
      if (error) setStatus(error.message || 'Could not sign in. Check your details.', 'error');
      else setStatus('Signed in. Your profile is loading.', 'success');
    });
    const signup = $('mpSignUpForm');
    if (signup) signup.addEventListener('submit', async event => {
      event.preventDefault(); if (busy) return; busy = true;
      const data = new FormData(signup);
      const username = String(data.get('username') || '').trim().toLowerCase();
      const email = String(data.get('email') || '').trim();
      const password = String(data.get('password') || '');
      if (!/^[a-z0-9_]{3,16}$/.test(username)) { busy = false; setStatus('Use 3–16 letters, numbers, or underscores for your username.', 'error'); return; }
      setStatus('Creating your account…');
      const { data: result, error } = await client.auth.signUp({
        email, password, options: { data: { username }, emailRedirectTo: window.location.origin + window.location.pathname }
      });
      busy = false;
      if (error) setStatus(error.message || 'Could not create account.', 'error');
      else if (result && result.session) setStatus('Account created. Welcome to PixelLab!', 'success');
      else setStatus('Check your email for a confirmation link, then sign in here.', 'success');
    });
    const reset = $('mpResetPassword');
    if (reset) reset.addEventListener('click', async () => {
      const email = $('mpSignInForm')?.elements.email?.value?.trim();
      if (!email) { setStatus('Enter your email in the sign-in form first.', 'error'); return; }
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
      setStatus(error ? error.message : 'If that account exists, a password-reset email is on the way.', error ? 'error' : 'success');
    });
    const logout = $('mpSignOut');
    if (logout) logout.addEventListener('click', async () => {
      stopRoomWatch(); currentRoom = null;
      const { error } = await client.auth.signOut();
      if (error) setStatus(error.message, 'error');
    });
    const save = $('mpSaveProfile');
    if (save) save.addEventListener('click', async () => {
      const username = String($('mpUsername').value || '').trim().toLowerCase();
      const avatar_key = $('mpAvatar').value;
      if (!/^[a-z0-9_]{3,16}$/.test(username)) { setStatus('Username must be 3–16 letters, numbers, or underscores.', 'error'); return; }
      const { error } = await client.from('profiles').update({ username, avatar_key }).eq('id', user.id);
      setStatus(error ? (error.message || 'Profile could not be saved.') : 'Profile saved.', error ? 'error' : 'success');
      if (!error) loadProfile();
    });
    const create = $('mpCreateRoom');
    if (create) create.addEventListener('click', createRoom);
    const join = $('mpJoinRoomForm');
    if (join) join.addEventListener('submit', event => {
      event.preventDefault(); joinRoom(String($('mpJoinCode').value || '').toUpperCase().trim());
    });
  }
  function openHub(gameId) {
    if (gameId) targetGame = gameId;
    const selector = $('mpGameSelect');
    if (selector) selector.value = targetGame;
    const hub = $('multiplayerHub');
    if (hub) {
      hub.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (!validConfig()) setStatus('Online play is not connected yet. See the V9 setup guide.', 'warning');
      else if (!user) setStatus('Sign in or create a PixelLab account to use online rooms.');
    }
  }
  async function createRoom() {
    if (!client || !user || busy) { openHub(); return; }
    busy = true; setStatus('Creating private room…');
    const { data, error } = await client.rpc('create_private_room', { p_game_id: 'tictactoe' });
    busy = false;
    if (error) { setStatus(error.message || 'Could not create room.', 'error'); return; }
    await showRoom(data);
  }
  async function joinRoom(code) {
    if (!client || !user || busy) { openHub(); return; }
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) { setStatus('Enter a valid six-character room code.', 'error'); return; }
    busy = true; setStatus('Joining room…');
    const { data, error } = await client.rpc('join_private_room', { p_code: code });
    busy = false;
    if (error) { setStatus(error.message || 'Could not join room.', 'error'); return; }
    await showRoom(data);
  }
  async function showRoom(room) {
    stopRoomWatch();
    currentRoom = room;
    renderRoom(room);
    const live = $('mpRoomLive');
    if (live) live.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    roomChannel = client.channel('pixellab-room-' + room.id).on('postgres_changes', {
      event: '*', schema: 'public', table: 'rooms', filter: 'id=eq.' + room.id
    }, () => refreshRoom()).subscribe();
    roomPoller = window.setInterval(refreshRoom, 5000);
  }
  async function refreshRoom() {
    if (!client || !currentRoom) return;
    const { data, error } = await client.from('rooms').select('*').eq('id', currentRoom.id).maybeSingle();
    if (error) return;
    if (!data) {
      stopRoomWatch(); currentRoom = null;
      const live = $('mpRoomLive');
      if (live) live.innerHTML = '<div class="mp-room-card"><h3>Room closed</h3><p>The host closed this room or it expired.</p><button type="button" class="secondary" id="mpBackLobby">Back to lobby</button></div>';
      $('mpBackLobby')?.addEventListener('click', () => { renderHub(); });
      return;
    }
    renderRoom(data);
  }
  function renderRoom(room) {
    currentRoom = room;
    const live = $('mpRoomLive');
    if (!live) return;
    const waiting = room.status === 'waiting';
    const finished = room.status === 'finished';
    const isHost = room.host_user_id === (user && user.id);
    const myMark = isHost ? 'X' : 'O';
    let outcome = '';
    if (finished) outcome = room.is_draw ? 'Draw game.' : room.winner_user_id === user.id ? 'You won! 🎉' : 'Your friend won this round.';
    else if (waiting) outcome = 'Waiting for a friend to join…';
    else outcome = room.turn_user_id === user.id ? 'Your turn (' + myMark + ').' : 'Your friend’s turn.';
    const cells = Array.isArray(room.board) ? room.board : [];
    live.innerHTML = '<div class="mp-room-card"><div class="mp-room-head"><div><span class="mp-kicker">PRIVATE TICTACTOE ROOM</span><h3>Room ' + esc(room.code) + '</h3><p>' + esc(outcome) + '</p></div>' +
      '<button type="button" id="mpLeaveRoom" class="mp-quiet-button">Leave room</button></div>' +
      (waiting ? '<div class="mp-waiting"><span class="mp-wait-pulse"></span><strong>Room created</strong><p>Share the code or invite link with your friend. They must sign in and enter this code.</p><div class="mp-code-row"><strong>' + esc(room.code) + '</strong><button type="button" id="mpCopyInvite" class="secondary">Copy invite link</button></div></div>' : '') +
      '<div class="mp-player-row"><span>✳ <b>' + (isHost ? 'You · X' : 'Host · X') + '</b></span><span>✳ <b>' + (isHost ? (room.guest_user_id ? 'Guest · O' : 'Waiting for player') : 'You · O') + '</b></span></div>' +
      (!waiting ? '<div class="mp-online-board" role="group" aria-label="Online Tic-Tac-Toe board">' + Array.from({length:9}, (_, i) => '<button type="button" class="mp-online-cell" data-cell="' + i + '"' + ((cells[i] || finished || room.turn_user_id !== user.id) ? ' disabled' : '') + '>' + esc(cells[i] || '') + '</button>').join('') + '</div>' : '') +
      (finished ? '<p class="mp-room-result">' + esc(outcome) + '</p><button type="button" id="mpNewRoom" class="primary">Create another room</button>' : '') +
      '<p class="mp-safe-note">Moves are checked by the database. Do not share your room code publicly.</p></div>';
    const copy = $('mpCopyInvite');
    if (copy) copy.addEventListener('click', async () => {
      const invite = window.location.origin + window.location.pathname + '?room=' + encodeURIComponent(room.code);
      try { await navigator.clipboard.writeText(invite); notify('Invite link copied.'); }
      catch { setStatus('Invite link: ' + invite, 'success'); }
    });
    document.querySelectorAll('[data-cell]').forEach(cell => cell.addEventListener('click', async () => {
      if (!currentRoom || currentRoom.status !== 'playing' || currentRoom.turn_user_id !== user.id) return;
      cell.disabled = true;
      const { data, error } = await client.rpc('make_ttt_move', { p_room_id: currentRoom.id, p_cell: Number(cell.dataset.cell) });
      if (error) { setStatus(error.message || 'Move was not accepted.', 'error'); await refreshRoom(); }
      else { setStatus('Move sent.', 'success'); if (data) renderRoom(data); await refreshRoom(); }
    }));
    const leave = $('mpLeaveRoom');
    if (leave) leave.addEventListener('click', async () => {
      const id = currentRoom && currentRoom.id;
      stopRoomWatch();
      const { error } = await client.rpc('leave_private_room', { p_room_id: id });
      currentRoom = null;
      if (error) setStatus(error.message || 'Could not leave room.', 'error');
      live.innerHTML = '';
      renderHub();
      setStatus(error ? 'Could not leave room.' : 'You left the room.', error ? 'error' : 'success');
    });
    const newRoom = $('mpNewRoom');
    if (newRoom) newRoom.addEventListener('click', () => { live.innerHTML = ''; createRoom(); });
  }
  async function init() {
    if (validConfig() && window.supabase && typeof window.supabase.createClient === 'function') {
      client = window.supabase.createClient(config.url.replace(/\/$/, ''), config.publishableKey);
      const { data } = await client.auth.getSession();
      user = data?.session?.user || null;
      if (user) await new Promise(resolve => {
        client.from('profiles').select('id,username,avatar_key,wins,losses,draws,created_at').eq('id', user.id).single()
          .then(({ data: row, error }) => { profile = error ? null : row; resolve(); });
      });
      client.auth.onAuthStateChange((event, session) => {
        user = session?.user || null;
        if (!user) { profile = null; stopRoomWatch(); currentRoom = null; }
        else { window.setTimeout(loadProfile, 0); }
        renderHub();
      });
    }
    renderHub();
    if (!validConfig()) setStatus('Online rooms are not connected yet. Solo and same-device play remain available.', 'warning');
    else if (!client) setStatus('The account library is unavailable. Reload the page or check the connection.', 'error');
    else if (!user) setStatus('Sign in or create an account to use private online rooms.');
  }
  window.PixelLabMultiplayer = {
    isConfigured: validConfig,
    openHub,
    openOnlineTicTacToe() {
      if (typeof window.closeGame === 'function') window.closeGame();
      openHub('tictactoe');
      if (!validConfig()) setStatus('Online play is not connected yet. Solo and same-device modes remain available.');
      else if (!client) setStatus('The account library did not load. Reload and try again.', 'error');
      else if (!user) setStatus('Sign in or create an account to create or join a room.');
    }
  };
  init().catch(error => {
    console.error('PixelLab multiplayer initialization failed:', error);
    setStatus('Online services could not start. Offline and local games are still available.', 'error');
    renderHub();
  });
})();
