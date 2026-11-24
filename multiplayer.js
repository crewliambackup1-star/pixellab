'use strict';

(function () {
  const SUPABASE_URL = 'https://gfctivjdghxbcfgytsbs.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_mZjVbKWHRsGboXOGiCw5FQ_Qqc8RS09';
  const SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.119.2/+esm';
  const ALLOWED_GAMES = new Set(['tictactoe', 'connect4']);
  let client = null;

  const ready = import(SDK_URL)
    .then(({ createClient }) => {
      client = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      const api = { showLobby, get client() { return client; } };
      window.PixelLabMultiplayer = api;
      return api;
    })
    .catch((error) => {
      window.PixelLabMultiplayerError = error;
      window.PixelLabMultiplayerReadyError = error && error.message ? error.message : 'Could not load the online service.';
      return null;
    });

  window.PixelLabMultiplayerReady = ready;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function makeButton(label, action, primary) {
    const button = element('button', 'pl-mp-button' + (primary ? ' primary' : ''), label);
    button.type = 'button';
    button.addEventListener('click', action);
    return button;
  }

  function showMessage(container, message, isError) {
    const note = container.querySelector('.pl-mp-message');
    if (!note) return;
    note.textContent = message || '';
    note.classList.toggle('error', !!isError);
  }

  function usernameFor(user) {
    const candidate = user && user.user_metadata && user.user_metadata.username;
    if (typeof candidate === 'string' && /^[A-Za-z0-9_]{3,16}$/.test(candidate)) return candidate;
    return 'Player';
  }

  function showLobby(gameId, container, onReady) {
    if (!ALLOWED_GAMES.has(gameId)) {
      container.replaceChildren(element('p', 'pl-mp-message error', 'Online play is not available for this game yet.'));
      return;
    }
    renderLobby(gameId, container, onReady).catch((error) => {
      container.replaceChildren(element('p', 'pl-mp-message error', error.message || 'Could not open multiplayer.'));
    });
  }

  async function renderLobby(gameId, container, onReady) {
    container.replaceChildren();
    const panel = element('section', 'pl-mp-panel');
    const heading = element('h3', 'pl-mp-heading', 'Online multiplayer');
    const intro = element('p', 'pl-mp-copy', 'Create a private room and share its short code with one friend. No public matchmaking or chat.');
    const message = element('p', 'pl-mp-message', 'Connecting securely…');
    panel.append(heading, intro, message);
    container.append(panel);

    const { data: sessionData, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
      showMessage(panel, sessionError.message, true);
      return;
    }
    if (sessionData.session) {
      renderRoomPicker(gameId, panel, sessionData.session.user, onReady);
    } else {
      renderAuth(gameId, panel, onReady);
    }
  }

  function renderAuth(gameId, panel, onReady) {
    panel.querySelector('.pl-mp-copy').textContent = 'Sign in or create a free PixelLab account to use private online rooms. Offline games still work without an account.';
    const tabs = element('div', 'pl-mp-tabs');
    const formWrap = element('div', 'pl-mp-form-wrap');
    const message = panel.querySelector('.pl-mp-message');
    panel.replaceChildren(panel.querySelector('.pl-mp-heading'), panel.querySelector('.pl-mp-copy'), tabs, formWrap, message);
    let mode = 'signup';

    function draw() {
      tabs.replaceChildren(
        makeButton('Create account', () => { mode = 'signup'; draw(); }, mode === 'signup'),
        makeButton('Sign in', () => { mode = 'signin'; draw(); }, mode === 'signin')
      );
      formWrap.replaceChildren();
      const form = element('form', 'pl-mp-form');
      if (mode === 'signup') {
        const username = element('input', 'pl-mp-input');
        username.name = 'username';
        username.autocomplete = 'nickname';
        username.minLength = 3;
        username.maxLength = 16;
        username.pattern = '[A-Za-z0-9_]{3,16}';
        username.required = true;
        username.placeholder = 'Username (3–16 letters, numbers, _)';
        form.append(username);
      }
      const email = element('input', 'pl-mp-input');
      email.name = 'email';
      email.type = 'email';
      email.autocomplete = 'email';
      email.required = true;
      email.placeholder = 'Email address';
      const password = element('input', 'pl-mp-input');
      password.name = 'password';
      password.type = 'password';
      password.autocomplete = mode === 'signup' ? 'new-password' : 'current-password';
      password.minLength = 8;
      password.required = true;
      password.placeholder = 'Password (at least 8 characters)';
      form.append(email, password);
      const submitButton = makeButton(mode === 'signup' ? 'Create account' : 'Sign in', () => {}, true);
      submitButton.type = 'submit';
      form.append(submitButton);
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        submitButton.disabled = true;
        showMessage(panel, mode === 'signup' ? 'Creating your account…' : 'Signing in…', false);
        try {
          let result;
          if (mode === 'signup') {
            const name = form.elements.username.value.trim();
            if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) throw new Error('Use 3–16 letters, numbers, or underscores for your username.');
            result = await client.auth.signUp({
              email: email.value.trim(),
              password: password.value,
              options: { data: { username: name } },
            });
            if (result.error) throw result.error;
            if (!result.data.session) {
              showMessage(panel, 'Account created. Check your email for the confirmation link, then sign in here.', false);
              mode = 'signin';
              draw();
              return;
            }
            renderRoomPicker(gameId, panel, result.data.session.user, onReady);
          } else {
            result = await client.auth.signInWithPassword({
              email: email.value.trim(),
              password: password.value,
            });
            if (result.error) throw result.error;
            renderRoomPicker(gameId, panel, result.data.user, onReady);
          }
        } catch (error) {
          showMessage(panel, error && error.message ? error.message : 'Authentication failed. Please try again.', true);
        } finally {
          if (submitButton.isConnected) submitButton.disabled = false;
        }
      });
      formWrap.append(form);
      formWrap.append(element('p', 'pl-mp-footnote', 'Email confirmation may be required before a new account can play online.'));
    }
    draw();
  }

  function renderRoomPicker(gameId, panel, user, onReady) {
    const name = usernameFor(user);
    panel.querySelector('.pl-mp-copy').textContent = 'Signed in as ' + name + '. Make a private room or enter a friend’s 10-character invite code.';
    const area = element('div', 'pl-mp-room-picker');
    const create = makeButton('＋ Create private room', async () => {
      create.disabled = true;
      showMessage(panel, 'Creating your room…', false);
      try {
        const { data, error } = await client.rpc('create_game_room', { p_game_id: gameId });
        if (error) throw error;
        const session = await connectRoom(data, user);
        onReady(session);
      } catch (error) {
        showMessage(panel, error && error.message ? error.message : 'Could not create the room.', true);
        create.disabled = false;
      }
    }, true);

    const joinForm = element('form', 'pl-mp-join-form');
    const code = element('input', 'pl-mp-input');
    code.placeholder = '10-character invite code';
    code.maxLength = 10;
    code.minLength = 10;
    code.autocomplete = 'off';
    code.autocapitalize = 'characters';
    code.spellcheck = false;
    code.required = true;
    code.pattern = '[A-Fa-f0-9]{10}';
    code.setAttribute('aria-label', 'Room invite code');
    const join = makeButton('Join room', () => {}, false);
    join.type = 'submit';
    joinForm.append(code, join);
    joinForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const roomCode = code.value.trim().toUpperCase();
      if (!/^[A-F0-9]{10}$/.test(roomCode)) {
        showMessage(panel, 'Enter the 10-character invite code.', true);
        return;
      }
      join.disabled = true;
      showMessage(panel, 'Joining room…', false);
      try {
        const { data, error } = await client.rpc('join_game_room', { p_room_code: roomCode });
        if (error) throw error;
        const session = await connectRoom(data, user);
        onReady(session);
      } catch (error) {
        showMessage(panel, error && error.message ? error.message : 'Could not join the room.', true);
        join.disabled = false;
      }
    });

    const signOut = makeButton('Sign out', async () => {
      const { error } = await client.auth.signOut();
      if (error) showMessage(panel, error.message, true);
      else renderAuth(gameId, panel, onReady);
    }, false);

    area.append(create, element('div', 'pl-mp-or', 'or join a friend'), joinForm, signOut);
    panel.replaceChildren(panel.querySelector('.pl-mp-heading'), panel.querySelector('.pl-mp-copy'), area, panel.querySelector('.pl-mp-message'));
    showMessage(panel, 'Your room is private and expires automatically after two hours.', false);
  }

  async function connectRoom(initialRoom, user) {
    let room = initialRoom;
    const playerNumber = room.host_id === user.id ? 1 : room.guest_id === user.id ? 2 : 0;
    if (!playerNumber) throw new Error('This account is not a player in the room.');
    const channel = client.channel('pl-room:' + room.id, {
      config: { private: true },
    });
    const listeners = new Set();
    let closed = false;

    function emit() {
      for (const listener of listeners) {
        try { listener(room); } catch (error) { console.error('PixelLab room listener failed', error); }
      }
    }
    async function refresh() {
      if (closed) return;
      const { data, error } = await client.rpc('get_game_room', { p_room_id: room.id });
      if (error) {
        if (!/expired/i.test(error.message || '')) console.warn('PixelLab room refresh failed', error.message);
        return;
      }
      room = data;
      emit();
    }
    await new Promise((resolve, reject) => {
      let settled = false;
      channel
        .on('broadcast', { event: 'room-update' }, () => { refresh(); })
        .subscribe((status, error) => {
          if (status === 'SUBSCRIBED' && !settled) {
            settled = true;
            resolve();
          } else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') && !settled) {
            settled = true;
            reject(error || new Error('Could not connect to the private room channel.'));
          }
        });
    });
    const session = {
      userId: user.id,
      playerNumber,
      get room() { return room; },
      onUpdate(callback) {
        listeners.add(callback);
        callback(room);
        return () => listeners.delete(callback);
      },
      async move(move) {
        if (closed) throw new Error('This room connection is closed.');
        const { data, error } = await client.rpc('play_multiplayer_move', {
          p_room_id: room.id,
          p_move: move,
        });
        if (error) throw error;
        room = data;
        emit();
        await channel.send({ type: 'broadcast', event: 'room-update', payload: { changed: true } });
        return room;
      },
      async leave() {
        if (!closed && (room.status === 'waiting' || room.status === 'playing')) {
          const { error } = await client.rpc('cancel_game_room', { p_room_id: room.id });
          if (!error) {
            await channel.send({ type: 'broadcast', event: 'room-update', payload: { cancelled: true } });
          }
          await session.close();
          if (error) throw error;
        } else {
          await session.close();
        }
      },
      async close() {
        if (closed) return;
        closed = true;
        listeners.clear();
        await client.removeChannel(channel);
      },
    };

    if (room.status === 'playing') {
      await channel.send({ type: 'broadcast', event: 'room-update', payload: { joined: true } });
    }
    return session;
  }
})();