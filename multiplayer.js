'use strict';

(function () {
  const $ = (id) => document.getElementById(id);
  const config = window.PIXELLAB_CONFIG || {};
  const state = {
    client: null,
    user: null,
    profile: null,
    room: null,
    recent: [],
    names: {},
    roomChannel: null,
    pollTimer: null,
    busy: false,
    passwordRecovery: false
  };

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function validConfig() {
    const url = String(config.url || '').trim();
    const key = String(config.publishableKey || '').trim();
    const allowedKey = key.startsWith('sb_publishable_') || (key.startsWith('eyJ') && !key.includes('service_role'));
    return config.provider === 'supabase'
      && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url)
      && allowedKey
      && !key.startsWith('sb_secret_');
  }

  function setStatus(message, kind) {
    const node = $('mpStatus');
    if (!node) return;
    node.textContent = message;
    node.className = 'mp-status' + (kind ? ' ' + kind : '');
  }

  function toast(message) {
    if (typeof window.flash === 'function') window.flash(message);
    else if ($('toast')) {
      $('toast').textContent = message;
      $('toast').classList.add('show');
    }
  }

  function stopRoomUpdates() {
    if (state.roomChannel && state.client) state.client.removeChannel(state.roomChannel);
    state.roomChannel = null;
    if (state.pollTimer) window.clearInterval(state.pollTimer);
    state.pollTimer = null;
  }

  async function loadProfile() {
    if (!state.client || !state.user) {
      state.profile = null;
      state.recent = [];
      state.names = {};
      renderHub();
      return;
    }

    const playerId = state.user.id;
    const { data: profile, error } = await state.client
      .from('profiles')
      .select('id,username,avatar_key,wins,losses,draws')
      .eq('id', playerId)
      .single();

    if (!state.user || state.user.id !== playerId) return;
    state.profile = error ? null : profile;
    state.recent = [];
    state.names = {};

    if (state.profile) {
      const { data: matches } = await state.client
        .from('match_history')
        .select('id,player_x,player_o,winner_user_id,is_draw,created_at')
        .or('player_x.eq.' + playerId + ',player_o.eq.' + playerId)
        .order('created_at', { ascending: false })
        .limit(5);

      state.recent = matches || [];
      const ids = [...new Set(state.recent.flatMap(match => [match.player_x, match.player_o]))];
      if (ids.length) {
        const { data: players } = await state.client
          .from('profiles')
          .select('id,username')
          .in('id', ids);
        state.names = Object.fromEntries((players || []).map(player => [player.id, player.username]));
      }

      const { data: rooms } = await state.client
        .from('rooms')
        .select('*')
        .or('host_user_id.eq.' + playerId + ',guest_user_id.eq.' + playerId)
        .in('status', ['waiting', 'playing'])
        .gt('expires_at', new Date().toISOString())
        .order('updated_at', { ascending: false })
        .limit(1);

      state.room = rooms && rooms.length ? rooms[0] : null;
    } else {
      state.room = null;
    }

    if (!state.user || state.user.id !== playerId) return;
    renderHub();
    if (state.room) watchRoom(state.room);
  }

  function backendCard() {
    if (!validConfig()) {
      return '<section class="mp-panel mp-backend-card">' +
        '<div class="mp-icon">🔐</div><span class="mp-kicker">ONLINE PLAY</span>' +
        '<h3>Multiplayer is being prepared.</h3>' +
        '<p>The account and private-room screens are ready for setup. Online matches stay unavailable until the project owner configures the backend and tests it.</p>' +
        '<a class="mp-guide-link" href="V9_SETUP.md" target="_blank" rel="noopener">Open the setup guide ↗</a>' +
        '<p class="mp-muted-note">Solo and same-device games still work without an account.</p></section>';
    }

    if (!state.client) {
      return '<section class="mp-panel"><div class="mp-icon">⚠️</div><h3>Account service unavailable</h3>' +
        '<p>The account library could not load. Check the connection and reload the page.</p></section>';
    }

    if (state.user && !state.passwordRecovery) return '';

    if (state.passwordRecovery) {
      return '<section class="mp-panel mp-auth-card"><span class="mp-kicker">ACCOUNT RECOVERY</span>' +
        '<h3>Choose a new password</h3><form id="mpRecoveryForm" class="mp-form">' +
        '<label>New password<input type="password" name="password" minlength="10" maxlength="128" autocomplete="new-password" required></label>' +
        '<button class="primary" type="submit">Update password</button></form></section>';
    }

    return '<section class="mp-panel mp-auth-card"><span class="mp-kicker">PIXELLAB ACCOUNT</span>' +
      '<h3>Sign in to play online</h3>' +
      '<p>Accounts are required for online rooms only. Use a made-up username; never put your real name, school, or location on your profile.</p>' +
      '<div class="mp-auth-tabs"><button type="button" data-auth-tab="signin" class="mp-tab active">Sign in</button>' +
      '<button type="button" data-auth-tab="signup" class="mp-tab">Create account</button></div>' +
      '<form id="mpSignInForm" class="mp-form">' +
      '<label>Email<input type="email" name="email" maxlength="254" autocomplete="email" required></label>' +
      '<label>Password<input type="password" name="password" minlength="10" maxlength="128" autocomplete="current-password" required></label>' +
      '<button class="primary" type="submit">Sign in</button>' +
      '<button type="button" id="mpResetPassword" class="mp-text-button">Send password reset email</button></form>' +
      '<form id="mpSignUpForm" class="mp-form" hidden>' +
      '<label>Username <small>3–16 letters, numbers, or underscores</small><input name="username" autocomplete="nickname" pattern="[A-Za-z0-9_]{3,16}" minlength="3" maxlength="16" required></label>' +
      '<label>Email <small>Private; used only for sign-in and recovery</small><input type="email" name="email" maxlength="254" autocomplete="email" required></label>' +
      '<label>Password <small>Use a unique password with at least 10 characters</small><input type="password" name="password" minlength="10" maxlength="128" autocomplete="new-password" required></label>' +
      '<button class="primary" type="submit">Create account</button></form>' +
      '<p class="mp-muted-note">Profiles show only your username, avatar, and match results. PixelLab has no public chat.</p></section>';
  }

  function profileCard() {
    if (!state.user || !state.profile) return '';
    const profile = state.profile;
    const total = profile.wins + profile.losses + profile.draws;
    const winRate = total ? Math.round(profile.wins * 100 / total) : 0;
    const avatars = { pixel: '🎮', spark: '✨', comet: '☄️', bolt: '⚡', orbit: '🪐', wave: '🌊' };
    const history = state.recent.length ? state.recent.map(match => {
      const opponentId = match.player_x === state.user.id ? match.player_o : match.player_x;
      const opponent = state.names[opponentId] || 'PixelLab player';
      const result = match.is_draw ? 'Draw' : match.winner_user_id === state.user.id ? 'Win' : 'Loss';
      return '<div class="mp-history-row"><span class="mp-result ' + result.toLowerCase() + '">' + result +
        '</span><strong>@' + escapeHtml(opponent) + '</strong><small>' +
        escapeHtml(new Date(match.created_at).toLocaleDateString()) + '</small></div>';
    }).join('') : '<p class="mp-muted-note">Your completed online matches will show up here.</p>';

    return '<section class="mp-panel mp-profile-card"><div class="mp-profile-head">' +
      '<div class="mp-avatar">' + (avatars[profile.avatar_key] || '🎮') + '</div>' +
      '<div><span class="mp-kicker">YOUR PIXELLAB PROFILE</span><h3>@' + escapeHtml(profile.username) +
      '</h3><p>Your email is never shown on your public profile.</p></div>' +
      '<button type="button" id="mpSignOut" class="mp-quiet-button">Sign out</button></div>' +
      '<div class="mp-profile-edit"><label>Avatar<select id="mpAvatar">' +
      Object.entries(avatars).map(([key, value]) => '<option value="' + key + '"' +
        (profile.avatar_key === key ? ' selected' : '') + '>' + value + ' ' + key[0].toUpperCase() + key.slice(1) +
        '</option>').join('') + '</select></label>' +
      '<label>Username<input id="mpUsername" value="' + escapeHtml(profile.username) +
      '" pattern="[A-Za-z0-9_]{3,16}" minlength="3" maxlength="16"></label>' +
      '<button type="button" id="mpSaveProfile" class="secondary">Save</button></div>' +
      '<div class="mp-profile-stats"><div><strong>' + profile.wins + '</strong><span>Wins</span></div>' +
      '<div><strong>' + profile.losses + '</strong><span>Losses</span></div>' +
      '<div><strong>' + profile.draws + '</strong><span>Draws</span></div>' +
      '<div><strong>' + winRate + '%</strong><span>Win rate</span></div></div>' +
      '<div class="mp-history"><h4>Recent online matches</h4>' + history + '</div></section>';
  }

  function lobbyCard() {
    if (!state.user || !state.profile) return '';
    const resume = state.room
      ? '<div class="mp-resume"><span>Active room <b>' + escapeHtml(state.room.code) + '</b></span>' +
        '<button type="button" id="mpResumeRoom" class="secondary">Resume</button></div>'
      : '';

    return '<section class="mp-panel mp-lobby-card"><span class="mp-kicker">PRIVATE MATCHMAKING</span>' +
      '<h3>Play with a friend</h3><p>Create a room and share its six-character code, or enter your friend’s code.</p>' +
      resume + '<div class="mp-online-game"><label>Game<select id="mpGameSelect">' +
      '<option value="tictactoe">Tic-Tac-Toe · Online first</option>' +
      '<option disabled>Connect Four · Coming in a later V9 stage</option>' +
      '<option disabled>Neon Pong · Coming in a later V9 stage</option></select></label>' +
      '<button type="button" id="mpCreateRoom" class="primary">＋ Create private room</button></div>' +
      '<form id="mpJoinRoomForm" class="mp-join-form"><label>Room code<input id="mpJoinCode" name="code" ' +
      'autocomplete="off" maxlength="6" minlength="6" pattern="[A-HJ-NP-Z2-9]{6}" placeholder="ABC234" required></label>' +
      '<button class="secondary" type="submit">Join room</button></form>' +
      '<p class="mp-muted-note">Both players must sign in. Room codes are invitations, not passwords. Do not share them publicly.</p></section>';
  }

  function renderHub() {
    const authArea = $('mpAuthArea');
    const profileArea = $('mpProfileArea');
    const lobbyArea = $('mpLobbyArea');
    if (!authArea || !profileArea || !lobbyArea) return;

    authArea.innerHTML = backendCard();
    profileArea.innerHTML = state.user
      ? (state.profile ? profileCard() : '<section class="mp-panel"><p>Loading your profile…</p></section>')
      : '';
    lobbyArea.innerHTML = state.user && state.profile ? lobbyCard() : '';

    const topButton = $('multiplayerBtn');
    if (topButton) topButton.textContent = state.user && state.profile
      ? '@' + state.profile.username : '🌐 Online play';

    const inviteCode = (new URLSearchParams(window.location.search).get('room') || '').toUpperCase();
    const codeInput = $('mpJoinCode');
    if (codeInput && /^[A-HJ-NP-Z2-9]{6}$/.test(inviteCode)) codeInput.value = inviteCode;

    bindForms();
  }

  function bindForms() {
    const tabs = document.querySelectorAll('[data-auth-tab]');
    tabs.forEach(tab => tab.addEventListener('click', () => {
      const signingUp = tab.dataset.authTab === 'signup';
      if ($('mpSignInForm')) $('mpSignInForm').hidden = signingUp;
      if ($('mpSignUpForm')) $('mpSignUpForm').hidden = !signingUp;
      tabs.forEach(item => item.classList.toggle('active', item === tab));
    }));

    const signIn = $('mpSignInForm');
    if (signIn) signIn.addEventListener('submit', async event => {
      event.preventDefault();
      if (state.busy) return;
      state.busy = true;
      const form = new FormData(signIn);
      setStatus('Signing in…');
      const { error } = await state.client.auth.signInWithPassword({
        email: String(form.get('email')).trim(),
        password: String(form.get('password'))
      });
      state.busy = false;
      setStatus(error ? (error.message || 'Could not sign in.') : 'Signed in. Loading your profile…',
        error ? 'error' : 'success');
    });

    const signUp = $('mpSignUpForm');
    if (signUp) signUp.addEventListener('submit', async event => {
      event.preventDefault();
      if (state.busy) return;
      const form = new FormData(signUp);
      const username = String(form.get('username') || '').trim().toLowerCase();
      const email = String(form.get('email') || '').trim();
      const password = String(form.get('password') || '');
      if (!/^[a-z0-9_]{3,16}$/.test(username)) {
        setStatus('Use 3–16 letters, numbers, or underscores for your username.', 'error');
        return;
      }
      if (password.length < 10) {
        setStatus('Use a unique password with at least 10 characters.', 'error');
        return;
      }
      state.busy = true;
      setStatus('Creating your account…');
      const { data, error } = await state.client.auth.signUp({
        email,
        password,
        options: {
          data: { username },
          emailRedirectTo: window.location.origin + window.location.pathname
        }
      });
      state.busy = false;
      if (error) setStatus(error.message || 'Could not create the account.', 'error');
      else if (data && data.session) setStatus('Account created. Welcome to PixelLab!', 'success');
      else setStatus('Check the email address you entered for a confirmation link.', 'success');
    });

    const reset = $('mpResetPassword');
    if (reset) reset.addEventListener('click', async () => {
      const email = $('mpSignInForm')?.elements.email?.value?.trim();
      if (!email) {
        setStatus('Enter your email address in the sign-in form first.', 'error');
        return;
      }
      const { error } = await state.client.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname
      });
      setStatus(error ? error.message : 'If the account exists, a password reset email is on the way.',
        error ? 'error' : 'success');
    });

    const recovery = $('mpRecoveryForm');
    if (recovery) recovery.addEventListener('submit', async event => {
      event.preventDefault();
      const password = String(new FormData(recovery).get('password') || '');
      if (password.length < 10) {
        setStatus('Use at least 10 characters for the new password.', 'error');
        return;
      }
      const { error } = await state.client.auth.updateUser({ password });
      if (error) setStatus(error.message || 'Password could not be updated.', 'error');
      else {
        state.passwordRecovery = false;
        renderHub();
        setStatus('Password updated.', 'success');
      }
    });

    const signOut = $('mpSignOut');
    if (signOut) signOut.addEventListener('click', async () => {
      stopRoomUpdates();
      state.room = null;
      const { error } = await state.client.auth.signOut();
      if (error) setStatus(error.message || 'Could not sign out.', 'error');
    });

    const saveProfile = $('mpSaveProfile');
    if (saveProfile) saveProfile.addEventListener('click', async () => {
      const username = String($('mpUsername').value || '').trim().toLowerCase();
      const avatar_key = $('mpAvatar').value;
      if (!/^[a-z0-9_]{3,16}$/.test(username)) {
        setStatus('Username must be 3–16 letters, numbers, or underscores.', 'error');
        return;
      }
      const { error } = await state.client.from('profiles')
        .update({ username, avatar_key })
        .eq('id', state.user.id);
      if (error) setStatus(error.message || 'Could not save the profile.', 'error');
      else {
        setStatus('Profile saved.', 'success');
        await loadProfile();
      }
    });

    const resume = $('mpResumeRoom');
    if (resume && state.room) resume.addEventListener('click', () => watchRoom(state.room));

    const create = $('mpCreateRoom');
    if (create) create.addEventListener('click', createRoom);

    const join = $('mpJoinRoomForm');
    if (join) join.addEventListener('submit', event => {
      event.preventDefault();
      joinRoom(String($('mpJoinCode').value || '').trim().toUpperCase());
    });
  }

  function openHub() {
    const hub = $('multiplayerHub');
    if (hub) hub.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (!validConfig()) setStatus('Online play is not connected yet. Solo and same-device play remain available.', 'warning');
    else if (!state.client) setStatus('The account service could not load. Reload the page and try again.', 'error');
    else if (!state.user) setStatus('Sign in or create a PixelLab account to use private rooms.');
  }

  async function createRoom() {
    if (!state.client || !state.user || state.busy) {
      openHub();
      return;
    }
    state.busy = true;
    setStatus('Creating your private room…');
    const { data, error } = await state.client.rpc('create_private_ttt_room');
    state.busy = false;
    if (error) {
      setStatus(error.message || 'Could not create the room.', 'error');
      return;
    }
    await showRoom(data);
  }

  async function joinRoom(code) {
    if (!state.client || !state.user || state.busy) {
      openHub();
      return;
    }
    if (!/^[A-HJ-NP-Z2-9]{6}$/.test(code)) {
      setStatus('Enter a valid six-character room code.', 'error');
      return;
    }
    state.busy = true;
    setStatus('Joining room…');
    const { data, error } = await state.client.rpc('join_private_ttt_room', { p_code: code });
    state.busy = false;
    if (error) {
      setStatus(error.message || 'Could not join the room.', 'error');
      return;
    }
    await showRoom(data);
  }

  async function showRoom(room) {
    stopRoomUpdates();
    state.room = room;
    renderRoom(room);
    $('mpRoomLive')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    state.roomChannel = state.client.channel('pixellab-room-' + room.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rooms',
        filter: 'id=eq.' + room.id
      }, () => refreshRoom())
      .subscribe();

    state.pollTimer = window.setInterval(refreshRoom, 4500);
  }

  async function refreshRoom() {
    if (!state.client || !state.room) return;
    const roomId = state.room.id;
    const { data, error } = await state.client.from('rooms')
      .select('*')
      .eq('id', roomId)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (error) return;
    if (!data) {
      stopRoomUpdates();
      state.room = null;
      const live = $('mpRoomLive');
      if (live) live.innerHTML = '<section class="mp-panel"><h3>Room closed or expired</h3>' +
        '<p>You can create or join another private room from the lobby.</p></section>';
      return;
    }
    renderRoom(data);
  }

  function renderRoom(room) {
    state.room = room;
    const live = $('mpRoomLive');
    if (!live) return;

    const isHost = room.host_user_id === state.user.id;
    const waiting = room.status === 'waiting';
    const finished = room.status === 'finished';
    const mark = isHost ? 'X' : 'O';
    let message = 'Your friend’s turn.';
    if (finished) {
      message = room.is_draw ? 'Draw game.' : room.winner_user_id === state.user.id ? 'You won! 🎉' : 'Your friend won this round.';
    } else if (waiting) {
      message = 'Waiting for a friend to join…';
    } else if (room.turn_user_id === state.user.id) {
      message = 'Your turn (' + mark + ').';
    }

    const board = Array.isArray(room.board) ? room.board : Array(9).fill('');
    const cells = board.map((value, index) => {
      const disabled = !!value || finished || waiting || room.turn_user_id !== state.user.id;
      return '<button type="button" class="mp-ttt-cell" data-ttt-cell="' + index + '"' +
        (disabled ? ' disabled' : '') + '>' + escapeHtml(value) + '</button>';
    }).join('');

    live.innerHTML = '<section class="mp-panel mp-room-card"><div class="mp-room-head">' +
      '<div><span class="mp-kicker">PRIVATE TIC-TAC-TOE ROOM</span><h3>Room ' + escapeHtml(room.code) +
      '</h3><p>' + escapeHtml(message) + '</p></div>' +
      '<button type="button" id="mpLeaveRoom" class="mp-quiet-button">Leave room</button></div>' +
      (waiting ? '<div class="mp-waiting"><span class="mp-wait-dot"></span><strong>Room created</strong>' +
        '<p>Share this code or invite link with your friend. They must sign in and join the room.</p>' +
        '<div class="mp-code-row"><strong>' + escapeHtml(room.code) + '</strong>' +
        '<button type="button" id="mpCopyInvite" class="secondary">Copy invite link</button></div></div>' : '') +
      '<div class="mp-player-line"><span><b>' + (isHost ? 'You · X' : 'Host · X') + '</b></span>' +
      '<span><b>' + (isHost ? (room.guest_user_id ? 'Guest · O' : 'Waiting for player') : 'You · O') + '</b></span></div>' +
      (!waiting ? '<div class="mp-ttt-board" aria-label="Tic-Tac-Toe board">' + cells + '</div>' : '') +
      (finished ? '<p class="mp-room-finished">' + escapeHtml(message) + '</p>' : '') +
      '<p class="mp-muted-note">The database checks whose turn it is and whether each move is valid.</p></section>';

    const copy = $('mpCopyInvite');
    if (copy) copy.addEventListener('click', async () => {
      const url = window.location.origin + window.location.pathname + '?room=' + encodeURIComponent(room.code);
      try {
        await navigator.clipboard.writeText(url);
        toast('Invite link copied.');
      } catch {
        setStatus('Copy this invite link: ' + url, 'success');
      }
    });

    document.querySelectorAll('[data-ttt-cell]').forEach(cell => cell.addEventListener('click', async () => {
      if (!state.room || state.room.status !== 'playing' || state.room.turn_user_id !== state.user.id) return;
      cell.disabled = true;
      const { error } = await state.client.rpc('make_ttt_move', {
        p_room_id: state.room.id,
        p_cell: Number(cell.dataset.tttCell)
      });
      if (error) {
        setStatus(error.message || 'Move was not accepted.', 'error');
        await refreshRoom();
      } else {
        await refreshRoom();
        setStatus('Move sent.', 'success');
      }
    }));

    const leave = $('mpLeaveRoom');
    if (leave) leave.addEventListener('click', async () => {
      const roomId = state.room && state.room.id;
      stopRoomUpdates();
      const { error } = await state.client.rpc('leave_private_ttt_room', { p_room_id: roomId });
      state.room = null;
      $('mpRoomLive').innerHTML = '';
      await loadProfile();
      setStatus(error ? (error.message || 'Could not leave the room.') : 'You left the room.',
        error ? 'error' : 'success');
    });
  }

  function bindInviteLink() {
    const code = (new URLSearchParams(window.location.search).get('room') || '').toUpperCase();
    const input = $('mpJoinCode');
    if (input && /^[A-HJ-NP-Z2-9]{6}$/.test(code)) input.value = code;
  }

  async function init() {
    if (validConfig() && window.supabase && typeof window.supabase.createClient === 'function') {
      state.client = window.supabase.createClient(config.url.replace(/\/$/, ''), config.publishableKey);
      state.client.auth.onAuthStateChange((event, session) => {
        if (event === 'INITIAL_SESSION') return;
        state.user = session?.user || null;
        if (event === 'PASSWORD_RECOVERY') state.passwordRecovery = true;
        if (!state.user) {
          state.profile = null;
          state.room = null;
          state.recent = [];
          state.names = {};
          state.passwordRecovery = false;
          stopRoomUpdates();
          if ($('mpRoomLive')) $('mpRoomLive').innerHTML = '';
        } else {
          window.setTimeout(() => loadProfile().catch(() =>
            setStatus('Could not load your profile. Refresh and try again.', 'error')), 0);
        }
        renderHub();
      });

      const { data } = await state.client.auth.getSession();
      state.user = data?.session?.user || null;
      if (state.user) await loadProfile();
    }

    renderHub();
    bindInviteLink();

    if (!validConfig()) setStatus('Online rooms are not connected yet. Solo and same-device play remain available.', 'warning');
    else if (!state.client) setStatus('The account library did not load. Check the connection and reload.', 'error');
    else if (!state.user) setStatus('Sign in or create an account to use private rooms.');
  }

  window.PixelLabMultiplayer = {
    openHub,
    openOnlineTicTacToe() {
      if (typeof window.closeGame === 'function') window.closeGame();
      openHub();
      if (!validConfig()) setStatus('Online play is not connected yet. Solo and local modes still work.', 'warning');
      else if (!state.client) setStatus('The account library did not load. Reload and try again.', 'error');
      else if (!state.user) setStatus('Sign in or create an account to create or join a room.');
    }
  };

  init().catch(error => {
    console.error('PixelLab online setup failed:', error);
    setStatus('Online services could not start. Solo and same-device games are unaffected.', 'error');
    renderHub();
  });
})();
