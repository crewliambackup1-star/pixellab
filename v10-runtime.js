'use strict';

(function (global) {
  let threeModulePromise = null;

  function loadThree() {
    if (!threeModulePromise) {
      threeModulePromise = (async function () {
        try {
          return await import('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js');
        } catch (firstError) {
          return await import('https://unpkg.com/three@0.164.1/build/three.module.js');
        }
      })();
    }
    return threeModulePromise;
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function startThreeGame(game, mode) {
    const box = baseBox();
    const shell = makeElement('div', 'three-shell');
    shell.innerHTML =
      '<div class="three-hud">' +
        '<div class="three-hud-title"><span class="three-live-dot"></span><span class="three-game-name"></span></div>' +
        '<div class="three-hud-stats">' +
          '<div><small data-label="primary">SCORE</small><strong data-value="primary">0</strong></div>' +
          '<div><small data-label="secondary">TIME</small><strong data-value="secondary">--</strong></div>' +
          '<div><small data-label="tertiary">GOAL</small><strong data-value="tertiary">--</strong></div>' +
        '</div>' +
      '</div>' +
      '<div class="three-stage" tabindex="0"><div class="three-loading">Loading 3D world…</div></div>' +
      '<div class="three-toolbar"></div>' +
      '<div class="three-controls" aria-label="Touch controls"></div>' +
      '<div class="three-help"></div>';
    box.appendChild(shell);

    const stage = shell.querySelector('.three-stage');
    const toolbar = shell.querySelector('.three-toolbar');
    const controls = shell.querySelector('.three-controls');
    const help = shell.querySelector('.three-help');
    const hudTitle = shell.querySelector('.three-game-name');
    const session = {
      active: true,
      keys: new Set(),
      actions: new Set(),
      removers: [],
      renderer: null,
      scene: null,
      camera: null,
      frame: 0,
      completed: false,
      startedAt: 0
    };
    let ctx = null;

    function listen(target, event, handler, options) {
      target.addEventListener(event, handler, options);
      session.removers.push(function () {
        target.removeEventListener(event, handler, options);
      });
    }

    function setHud(which, label, value) {
      const labelNode = shell.querySelector('[data-label="' + which + '"]');
      const valueNode = shell.querySelector('[data-value="' + which + '"]');
      if (labelNode) labelNode.textContent = label;
      if (valueNode) valueNode.textContent = String(value);
    }

    function finish(score, heading, detail) {
      if (session.completed) return;
      session.completed = true;
      const oldBest = scores[game.id];
      const record = oldBest === undefined || score > oldBest;
      if (record) {
        scores[game.id] = score;
        storage.set('scores', scores);
      }
      awardRun(game, score, record);
      updateBest(game);
      const overlay = makeElement('div', 'three-result');
      const card = makeElement('div', 'three-result-card');
      const title = makeElement('h3', '', heading || 'Run complete');
      const copy = makeElement('p', '', detail || ('Final score: ' + score));
      const scoreLine = makeElement('strong', '', 'SCORE  ' + score);
      const actions = makeElement('div', 'three-result-actions');
      const replay = makeElement('button', 'game-button hot', 'Play again');
      replay.addEventListener('click', function () { global.runGame(game); });
      actions.appendChild(replay);
      card.append(title, copy, scoreLine, actions);
      overlay.appendChild(card);
      stage.appendChild(overlay);
    }

    function showLoadError(error) {
      stage.innerHTML = '';
      const card = makeElement('div', 'three-load-error');
      const title = makeElement('h3', '', '3D world could not load');
      const copy = makeElement('p', '', 'This game needs WebGL and a connection to the 3D graphics library. Check the connection and try again.');
      const retry = makeElement('button', 'game-button hot', 'Try again');
      retry.addEventListener('click', function () { global.runGame(game); });
      card.append(title, copy, retry);
      stage.appendChild(card);
      if (error) console.warn('PixelLab 3D load error:', error);
    }

    hudTitle.textContent = game.name;
    setHud('primary', 'SCORE', '0');
    setHud('secondary', 'TIME', '--');
    setHud('tertiary', 'GOAL', '--');
    help.textContent = 'Loading the world. 3D graphics load only when you open a 3D game.';
    cleanup = function () {
      if (!session.active) return;
      session.active = false;
      if (session.frame) cancelAnimationFrame(session.frame);
      session.removers.splice(0).forEach(function (remove) { try { remove(); } catch (_) {} });
      if (session.renderer) {
        try {
          if (document.pointerLockElement === session.renderer.domElement && document.exitPointerLock) document.exitPointerLock();
          session.scene.traverse(function (object) {
            if (object.geometry && object.geometry.dispose) object.geometry.dispose();
            if (object.material) {
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach(function (material) {
                if (material.map && material.map.dispose) material.map.dispose();
                if (material.dispose) material.dispose();
              });
            }
          });
          session.renderer.dispose();
          session.renderer.domElement.remove();
        } catch (_) {}
      }
    };

    loadThree().then(function (THREE) {
      if (!session.active) return;
      stage.innerHTML = '';
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(mode.background || '#111a2b');
      if (mode.fog !== false) scene.fog = new THREE.Fog(mode.fogColor || mode.background || '#111a2b', mode.fogNear || 30, mode.fogFar || 95);
      const camera = mode.camera(THREE, stage);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(global.devicePixelRatio || 1, 1.6));
      renderer.setSize(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight), false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.domElement.className = 'three-canvas';
      renderer.domElement.setAttribute('aria-label', game.name + ' 3D game area');
      stage.appendChild(renderer.domElement);

      session.scene = scene;
      session.camera = camera;
      session.renderer = renderer;

      const hemi = new THREE.HemisphereLight(0xbddcff, 0x233044, 1.45);
      scene.add(hemi);
      const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
      keyLight.position.set(-14, 24, 12);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      scene.add(keyLight);
      const fillLight = new THREE.PointLight(0x69e9ff, 24, 55);
      fillLight.position.set(8, 7, -8);
      scene.add(fillLight);

      let clock = new THREE.Clock();
      let update = function () {};
      let afterRender = function () {};
      ctx = {
        THREE: THREE,
        game: game,
        scene: scene,
        camera: camera,
        renderer: renderer,
        stage: stage,
        toolbar: toolbar,
        controls: controls,
        keys: session.keys,
        actions: session.actions,
        on: listen,
        setHud: setHud,
        finish: finish,
        setHelp: function (value) { help.textContent = value; },
        addCleanup: function (fn) { session.removers.push(fn); },
        addTool: function (label, fn, active) {
          const button = makeElement('button', 'three-tool' + (active ? ' active' : ''), label);
          button.type = 'button';
          button.addEventListener('click', fn);
          toolbar.appendChild(button);
          return button;
        },
        addControl: function (label, key, action) {
          const button = makeElement('button', 'three-touch-control', label);
          button.type = 'button';
          controls.appendChild(button);
          const down = function (event) {
            event.preventDefault();
            if (key) session.keys.add(key);
          };
          const up = function () {
            if (key) session.keys.delete(key);
          };
          listen(button, 'pointerdown', down);
          listen(button, 'pointerup', up);
          listen(button, 'pointercancel', up);
          listen(button, 'pointerleave', up);
          if (action) listen(button, 'click', function () { session.actions.add(action); });
          return button;
        },
        addLights: function (ambientColor, pointColor) {
          const a = new THREE.AmbientLight(ambientColor || 0xffffff, 0.45);
          scene.add(a);
          const p = new THREE.PointLight(pointColor || 0x70eaff, 38, 60);
          p.position.set(0, 8, 0);
          scene.add(p);
          return p;
        },
        setUpdate: function (fn) { update = fn; },
        setAfterRender: function (fn) { afterRender = fn; },
        elapsed: function () { return clock.elapsedTime; },
        delta: function () { return clock.getDelta(); },
        cameraResize: function () {
          const width = Math.max(1, stage.clientWidth);
          const height = Math.max(1, stage.clientHeight);
          if (camera.isOrthographicCamera) {
            const halfHeight = 19 / Math.max(0.75, width / height);
            camera.left = -19; camera.right = 19; camera.top = halfHeight; camera.bottom = -halfHeight;
          } else {
            camera.aspect = width / height;
          }
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        }
      };

      const keyNames = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift', 'enter'];
      listen(global, 'keydown', function (event) {
        const key = event.key.toLowerCase();
        if (keyNames.includes(key) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) {
          session.keys.add(key === ' ' ? 'space' : key);
          if (key !== 'enter') event.preventDefault();
        }
      });
      listen(global, 'keyup', function (event) {
        const key = event.key.toLowerCase();
        session.keys.delete(key === ' ' ? 'space' : key);
      });
      listen(global, 'blur', function () { session.keys.clear(); session.actions.clear(); });
      listen(global, 'resize', function () { if (session.active) ctx.cameraResize(); });
      if (global.ResizeObserver) {
        const observer = new ResizeObserver(function () { if (session.active) ctx.cameraResize(); });
        observer.observe(stage);
        listen(stage, 'pixellab-disconnect', function () { observer.disconnect(); });
        session.removers.push(function () { observer.disconnect(); });
      }

      try {
        mode.setup(THREE, ctx);
      } catch (error) {
        showLoadError(error);
        return;
      }

      session.startedAt = performance.now();
      function animate() {
        if (!session.active) return;
        session.frame = requestAnimationFrame(animate);
        const dt = Math.min(clock.getDelta(), 0.045);
        if (document.hidden) return;
        try {
          update(dt, clock.elapsedTime);
          afterRender(dt, clock.elapsedTime);
          renderer.render(scene, camera);
        } catch (error) {
          console.error('PixelLab 3D game runtime error:', error);
          help.textContent = 'A game error occurred. Close this game and reopen it to reset the world.';
          if (!session.completed) finish(0, 'Run interrupted', 'The game encountered an error. Your saved progress is safe.');
        }
      }
      animate();
    }).catch(showLoadError);
  }

  function mat(THREE, color, roughness, metalness, emissive) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: roughness === undefined ? 0.62 : roughness,
      metalness: metalness === undefined ? 0.08 : metalness,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissive ? 0.45 : 0
    });
  }

  function boxMesh(THREE, width, height, depth, material, x, y, z) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
    mesh.position.set(x || 0, y || 0, z || 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }

  function gameNeonStrike(game) {
    startThreeGame(game, {
      background: '#090f20',
      fogColor: '#0d1830',
      fogNear: 24,
      fogFar: 60,
      camera: function (THREE) {
        const camera = new THREE.PerspectiveCamera(76, 1, 0.1, 90);
        camera.position.set(0, 1.7, 10);
        camera.rotation.order = 'YXZ';
        return camera;
      },
      setup: function (THREE, ctx) {
        const scene = ctx.scene;
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(34, 34), mat(THREE, '#17233d', 0.88));
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        const grid = new THREE.GridHelper(34, 34, '#39c6ed', '#25385a');
        grid.position.y = 0.015;
        scene.add(grid);
        for (let i = -1; i <= 1; i += 2) {
          scene.add(boxMesh(THREE, 34, 4, 0.7, mat(THREE, '#1d3155', 0.5, 0.25, '#153d75'), 0, 2, i * 17));
          scene.add(boxMesh(THREE, 0.7, 4, 34, mat(THREE, '#1d3155', 0.5, 0.25, '#153d75'), i * 17, 2, 0));
        }
        const pillarPositions = [[-8, -7], [8, -7], [-8, 6], [8, 6], [0, -10], [0, 10]];
        pillarPositions.forEach(function (point, index) {
          const pillar = boxMesh(THREE, 1.45, 3.8, 1.45, mat(THREE, index % 2 ? '#28506f' : '#49356f', 0.38, 0.32, index % 2 ? '#087e9d' : '#5c267e'), point[0], 1.9, point[1]);
          scene.add(pillar);
          const cap = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.055, 8, 32), mat(THREE, '#70edff', 0.3, 0.3, '#16b9ec'));
          cap.rotation.x = Math.PI / 2;
          cap.position.set(point[0], 3.85, point[1]);
          scene.add(cap);
        });

        const drones = [];
        const droneColors = ['#65f2ff', '#bd8aff', '#ff8bce'];
        function spawnDrone(drone, index, time) {
          const angle = Math.random() * Math.PI * 2;
          const radius = 4 + Math.random() * 8;
          drone.root.position.set(Math.cos(angle) * radius, 1.4 + Math.random() * 3.6, Math.sin(angle) * radius);
          drone.baseY = drone.root.position.y;
          drone.phase = Math.random() * Math.PI * 2;
          drone.speed = 0.55 + Math.random() * 0.55;
          drone.alive = true;
          drone.respawnAt = 0;
          drone.core.material.color.set(droneColors[index % droneColors.length]);
          drone.core.material.emissive.set(droneColors[index % droneColors.length]);
          drone.ring.material.color.set(droneColors[index % droneColors.length]);
          drone.ring.material.emissive.set(droneColors[index % droneColors.length]);
          drone.root.visible = true;
        }
        for (let i = 0; i < 8; i++) {
          const root = new THREE.Group();
          const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.48, 1), mat(THREE, droneColors[i % 3], 0.22, 0.18, droneColors[i % 3]));
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.74, 0.075, 8, 26), mat(THREE, '#65f2ff', 0.2, 0.2, '#39c9ff'));
          ring.rotation.x = Math.PI / 2.5;
          root.add(core, ring);
          root.userData.ring = ring;
          scene.add(root);
          const drone = { root: root, core: core, ring: ring, alive: true, phase: i, speed: 0.7 };
          drones.push(drone);
          spawnDrone(drone, i, 0);
        }

        let yaw = 0;
        let pitch = 0;
        let score = 0;
        let streak = 0;
        let hits = 0;
        let timeLeft = 90;
        let lastShot = 0;
        const raycaster = new THREE.Raycaster();
        const center = new THREE.Vector2(0, 0);
        const camera = ctx.camera;
        let pointerLocked = false;
        let lockRequested = false;
        let dragPoint = null;
        const canvas = ctx.renderer ? ctx.renderer.domElement : null;

        function updateLook() {
          camera.rotation.set(pitch, yaw, 0, 'YXZ');
        }
        ctx.on(document, 'pointerlockchange', function () {
          pointerLocked = document.pointerLockElement === ctx.renderer.domElement;
        });
        ctx.on(document, 'mousemove', function (event) {
          if (pointerLocked) {
            yaw -= event.movementX * 0.0022;
            pitch = Math.max(-1.15, Math.min(1.15, pitch - event.movementY * 0.002));
            updateLook();
          }
        });
        ctx.on(ctx.renderer.domElement, 'click', function () {
          if (document.pointerLockElement === ctx.renderer.domElement) { shoot(); return; }
          if (ctx.renderer.domElement.requestPointerLock && !lockRequested) {
            lockRequested = true;
            ctx.renderer.domElement.requestPointerLock();
            return;
          }
          shoot();
        });
        ctx.on(ctx.renderer.domElement, 'pointerdown', function (event) {
          if (event.pointerType === 'touch') dragPoint = { x: event.clientX, y: event.clientY, moved: false };
        });
        ctx.on(ctx.renderer.domElement, 'pointermove', function (event) {
          if (!dragPoint || event.pointerType !== 'touch') return;
          const dx = event.clientX - dragPoint.x;
          const dy = event.clientY - dragPoint.y;
          if (Math.abs(dx) + Math.abs(dy) > 5) dragPoint.moved = true;
          yaw -= dx * 0.004;
          pitch = Math.max(-1.15, Math.min(1.15, pitch - dy * 0.003));
          dragPoint.x = event.clientX;
          dragPoint.y = event.clientY;
          updateLook();
        });
        ctx.on(ctx.renderer.domElement, 'pointerup', function (event) {
          if (event.pointerType === 'touch' && dragPoint && !dragPoint.moved) shoot();
          dragPoint = null;
        });
        ctx.addControl('↑', 'w');
        ctx.addControl('←', 'a');
        ctx.addControl('↓', 's');
        ctx.addControl('→', 'd');
        ctx.addControl('PULSE', null, 'fire');
        ctx.setHelp('Move with WASD. Click the arena to capture your mouse and aim. Click again to fire a pulse. Touch: drag to aim, tap to fire.');
        ctx.setHud('primary', 'SCORE', '0');
        ctx.setHud('secondary', 'TIME', '90s');
        ctx.setHud('tertiary', 'STREAK', '0');

        function shoot() {
          const now = performance.now();
          if (now - lastShot < 180 || timeLeft <= 0) return;
          lastShot = now;
          raycaster.setFromCamera(center, camera);
          const cores = drones.filter(function (drone) { return drone.alive; }).map(function (drone) { return drone.core; });
          const hit = raycaster.intersectObjects(cores, false)[0];
          if (hit) {
            const target = drones.find(function (drone) { return drone.core === hit.object; });
            if (target) {
              target.alive = false;
              target.root.visible = false;
              target.respawnAt = ctx.elapsed() + 0.7;
              hits++;
              streak++;
              score += 100 + Math.min(streak - 1, 8) * 15;
            }
          } else {
            streak = 0;
          }
          ctx.setHud('primary', 'SCORE', score);
          ctx.setHud('tertiary', 'STREAK', streak + 'x');
        }

        ctx.setUpdate(function (dt, elapsed) {
          if (timeLeft <= 0 || ctx.actions.has('fire')) {
            if (ctx.actions.has('fire')) {
              shoot();
              ctx.actions.delete('fire');
            }
          }
          timeLeft = Math.max(0, timeLeft - dt);
          const speed = ctx.keys.has('shift') ? 9.5 : 6.5;
          const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
          const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
          const move = new THREE.Vector3();
          if (ctx.keys.has('w') || ctx.keys.has('arrowup')) move.add(forward);
          if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) move.sub(forward);
          if (ctx.keys.has('d') || ctx.keys.has('arrowright')) move.add(right);
          if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) move.sub(right);
          if (move.lengthSq() > 0) {
            move.normalize().multiplyScalar(speed * dt);
            camera.position.add(move);
          }
          camera.position.x = Math.max(-14.5, Math.min(14.5, camera.position.x));
          camera.position.z = Math.max(-14.5, Math.min(14.5, camera.position.z));
          camera.position.y = 1.7;
          drones.forEach(function (drone, index) {
            if (!drone.alive) {
              if (elapsed >= drone.respawnAt) spawnDrone(drone, index, elapsed);
              return;
            }
            drone.root.position.y = drone.baseY + Math.sin(elapsed * drone.speed + drone.phase) * 0.5;
            drone.root.rotation.y += dt * 0.9;
            drone.ring.rotation.z += dt * 1.1;
          });
          ctx.setHud('secondary', 'TIME', Math.ceil(timeLeft) + 's');
          if (timeLeft <= 0) ctx.finish(score + hits * 25, 'Arena cleared', hits + ' drones tagged. Your best streak was ' + streak + ' and you landed ' + hits + ' hits.');
        });
      }
    });
  }

  function gameGravityRush(game) {
    startThreeGame(game, {
      background: '#102039',
      fogColor: '#142848',
      fogNear: 24,
      fogFar: 80,
      camera: function (THREE) { return new THREE.PerspectiveCamera(62, 1, 0.1, 120); },
      setup: function (THREE, ctx) {
        const scene = ctx.scene;
        const groundMaterial = mat(THREE, '#24435b', 0.82);
        const platforms = [
          { x: 0, top: 0, z: 7, w: 8, d: 8 },
          { x: 0, top: 0.1, z: 0, w: 5, d: 4.8 },
          { x: 2.5, top: 1.1, z: -5, w: 4.8, d: 4.5 },
          { x: 5, top: 2.1, z: -10, w: 4.8, d: 4.5 },
          { x: 2, top: 2.1, z: -15, w: 4.8, d: 4.5 },
          { x: -1.5, top: 1.1, z: -20, w: 4.8, d: 4.5 },
          { x: -4.5, top: 0.1, z: -25, w: 7, d: 6 }
        ];
        platforms.forEach(function (p, index) {
          const mesh = boxMesh(THREE, p.w, 0.5, p.d, mat(THREE, index === 0 || index === platforms.length - 1 ? '#2b6475' : '#34476e', 0.42, 0.15, index % 2 ? '#1d5f88' : '#2d317b'), p.x, p.top - 0.25, p.z);
          scene.add(mesh);
          const edge = new THREE.Mesh(new THREE.BoxGeometry(p.w + 0.12, 0.12, p.d + 0.12), mat(THREE, '#52dfff', 0.25, 0.2, '#22bde0'));
          edge.position.set(p.x, p.top - 0.02, p.z);
          scene.add(edge);
          mesh.position.y = p.top - 0.25;
          mesh.userData.platformIndex = index;
        });
        const starMaterial = mat(THREE, '#8df7ff', 0.2, 0.15, '#39cfff');
        const stars = [];
        platforms.forEach(function (p, index) {
          if (index === 0) return;
          const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 1), starMaterial.clone());
          star.position.set(p.x + (index % 2 ? -0.6 : 0.6), p.top + 1.05, p.z);
          star.castShadow = true;
          scene.add(star);
          stars.push({ mesh: star, taken: false });
        });
        const portal = new THREE.Group();
        const portalRing = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.16, 12, 36), mat(THREE, '#d4a4ff', 0.23, 0.22, '#9d52ff'));
        portalRing.position.y = 1.45;
        const portalCore = new THREE.Mesh(new THREE.CircleGeometry(1.05, 32), new THREE.MeshBasicMaterial({ color: '#4f43a4', transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
        portalCore.position.y = 1.45;
        portal.add(portalRing, portalCore);
        portal.position.set(-4.5, 0.1, -25);
        scene.add(portal);
        const character = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.43, 0.85, 5, 10), mat(THREE, '#e2f6ff', 0.45, 0.08));
        body.position.y = 0.9;
        const visor = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 12), mat(THREE, '#69eaff', 0.18, 0.15, '#39b6ff'));
        visor.position.set(0, 1.62, -0.18);
        character.add(body, visor);
        character.position.set(0, 0, 7);
        scene.add(character);
        const sky = new THREE.Mesh(new THREE.SphereGeometry(70, 20, 14), new THREE.MeshBasicMaterial({ color: '#223b6a', side: THREE.BackSide }));
        scene.add(sky);

        const player = { x: 0, y: 0, z: 7, vy: 0, grounded: true, checkpoint: 0, coins: 0 };
        let timeLeft = 180;
        let previousSpace = false;
        ctx.addControl('↑', 'w');
        ctx.addControl('←', 'a');
        ctx.addControl('↓', 's');
        ctx.addControl('→', 'd');
        ctx.addControl('JUMP', null, 'jump');
        ctx.setHelp('Reach the portal at the end of the floating route. Collect at least 5 energy shards. Falling sends you back to a checkpoint. WASD/arrows to move, Space to jump.');
        ctx.setHud('primary', 'SHARDS', '0 / 6');
        ctx.setHud('secondary', 'TIME', '180s');
        ctx.setHud('tertiary', 'CHECKPOINT', '1 / 3');

        ctx.setUpdate(function (dt, elapsed) {
          const left = ctx.keys.has('a') || ctx.keys.has('arrowleft');
          const right = ctx.keys.has('d') || ctx.keys.has('arrowright');
          const forward = ctx.keys.has('w') || ctx.keys.has('arrowup');
          const backward = ctx.keys.has('s') || ctx.keys.has('arrowdown');
          const moving = left || right || forward || backward;
          const speed = ctx.keys.has('shift') ? 9 : 7;
          if (left) player.x -= speed * dt;
          if (right) player.x += speed * dt;
          if (forward) player.z -= speed * dt;
          if (backward) player.z += speed * dt;
          const jumping = ctx.keys.has('space') || ctx.actions.has('jump');
          if (jumping && !previousSpace && player.grounded) {
            player.vy = 9.4;
            player.grounded = false;
          }
          previousSpace = jumping;
          ctx.actions.delete('jump');
          const oldY = player.y;
          player.vy -= 22 * dt;
          player.y += player.vy * dt;
          player.x = Math.max(-12, Math.min(12, player.x));
          let landing = false;
          if (player.vy <= 0) {
            platforms.forEach(function (p) {
              const inside = Math.abs(player.x - p.x) <= p.w / 2 - 0.32 && Math.abs(player.z - p.z) <= p.d / 2 - 0.32;
              if (inside && oldY >= p.top - 0.04 && player.y <= p.top + 0.04) {
                player.y = p.top;
                player.vy = 0;
                player.grounded = true;
                landing = true;
                player.checkpoint = Math.max(player.checkpoint, p.top > 1.5 ? 2 : p.top > 0.5 ? 1 : 0);
              }
            });
          }
          if (!landing && player.y > 0.08) player.grounded = false;
          if (player.y < -8) {
            const respawn = platforms[player.checkpoint === 2 ? 4 : player.checkpoint === 1 ? 2 : 0];
            player.x = respawn.x;
            player.z = respawn.z;
            player.y = respawn.top + 0.08;
            player.vy = 0;
            player.grounded = true;
          }
          character.position.set(player.x, player.y, player.z);
          if (moving) character.rotation.y = Math.atan2((right ? 1 : 0) - (left ? 1 : 0), (backward ? 1 : 0) - (forward ? 1 : 0));
          stars.forEach(function (star) {
            if (star.taken) return;
            star.mesh.rotation.y += dt * 1.8;
            star.mesh.rotation.x += dt * 0.6;
            star.mesh.position.y += Math.sin(elapsed * 2 + star.mesh.position.z) * dt * 0.08;
            if (character.position.distanceTo(star.mesh.position) < 1.35) {
              star.taken = true;
              star.mesh.visible = false;
              player.coins++;
              ctx.setHud('primary', 'SHARDS', player.coins + ' / 6');
            }
          });
          portal.rotation.y += dt * 0.65;
          const cameraTarget = new THREE.Vector3(player.x, player.y + 5.8, player.z + 8.2);
          ctx.camera.position.lerp(cameraTarget, Math.min(1, dt * 4.5));
          ctx.camera.lookAt(player.x, player.y + 1.0, player.z - 2.1);
          timeLeft = Math.max(0, timeLeft - dt);
          ctx.setHud('secondary', 'TIME', Math.ceil(timeLeft) + 's');
          ctx.setHud('tertiary', 'CHECKPOINT', (player.checkpoint + 1) + ' / 3');
          if (player.coins >= 5 && character.position.distanceTo(new THREE.Vector3(-4.5, 1.2, -25)) < 2.2) {
            const score = player.coins * 120 + Math.ceil(timeLeft) * 3;
            ctx.finish(score, 'Portal reached!', 'You collected ' + player.coins + ' energy shards and cleared the course.');
          } else if (character.position.distanceTo(new THREE.Vector3(-4.5, 1.2, -25)) < 2.2 && player.coins < 5) {
            ctx.setHelp('The portal needs 5 energy shards. You have ' + player.coins + '. Find more glowing shards along the route.');
          }
          if (timeLeft <= 0) ctx.finish(player.coins * 80, 'Time is up', 'You collected ' + player.coins + ' of the 6 energy shards. Try a cleaner route.');
        });
      }
    });
  }

  function gameVelocityX(game) {
    startThreeGame(game, {
      background: '#101627',
      fogColor: '#18243a',
      fogNear: 38,
      fogFar: 105,
      camera: function (THREE) { return new THREE.PerspectiveCamera(60, 1, 0.1, 160); },
      setup: function (THREE, ctx) {
        const scene = ctx.scene;
        const grass = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mat(THREE, '#1d453d', 0.98));
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = -0.18;
        scene.add(grass);
        const radiusX = 19;
        const radiusZ = 27;
        const roadWidth = 9.2;
        const points = [];
        const vertices = [];
        const indices = [];
        const segments = 160;
        for (let i = 0; i <= segments; i++) {
          const angle = i / segments * Math.PI * 2;
          const center = new THREE.Vector3(radiusX * Math.cos(angle), 0, radiusZ * Math.sin(angle));
          const tangent = new THREE.Vector3(-radiusX * Math.sin(angle), 0, radiusZ * Math.cos(angle)).normalize();
          const side = new THREE.Vector3(tangent.z, 0, -tangent.x);
          const left = center.clone().addScaledVector(side, roadWidth / 2);
          const right = center.clone().addScaledVector(side, -roadWidth / 2);
          vertices.push(left.x, 0.03, left.z, right.x, 0.03, right.z);
          points.push(center);
          if (i < segments) {
            const n = i * 2;
            indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
          }
        }
        const roadGeometry = new THREE.BufferGeometry();
        roadGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        roadGeometry.setIndex(indices);
        roadGeometry.computeVertexNormals();
        const road = new THREE.Mesh(roadGeometry, mat(THREE, '#303747', 0.95));
        road.receiveShadow = true;
        scene.add(road);
        const edgePointsOuter = [];
        const edgePointsInner = [];
        for (let i = 0; i <= segments; i++) {
          const angle = i / segments * Math.PI * 2;
          const center = new THREE.Vector3(radiusX * Math.cos(angle), 0.15, radiusZ * Math.sin(angle));
          const tangent = new THREE.Vector3(-radiusX * Math.sin(angle), 0, radiusZ * Math.cos(angle)).normalize();
          const side = new THREE.Vector3(tangent.z, 0, -tangent.x);
          edgePointsOuter.push(center.clone().addScaledVector(side, roadWidth / 2));
          edgePointsInner.push(center.clone().addScaledVector(side, -roadWidth / 2));
        }
        const outerCurve = new THREE.CatmullRomCurve3(edgePointsOuter, true);
        const innerCurve = new THREE.CatmullRomCurve3(edgePointsInner, true);
        const railMaterial = mat(THREE, '#55d9ef', 0.28, 0.3, '#119ec7');
        scene.add(new THREE.Mesh(new THREE.TubeGeometry(outerCurve, 180, 0.16, 8, true), railMaterial));
        scene.add(new THREE.Mesh(new THREE.TubeGeometry(innerCurve, 180, 0.12, 8, true), mat(THREE, '#a58bff', 0.26, 0.24, '#8259da')));
        const dashMaterial = mat(THREE, '#d9e0e8', 0.75, 0.05);
        for (let i = 0; i < 36; i++) {
          const angle = i / 36 * Math.PI * 2;
          const dash = boxMesh(THREE, 0.18, 0.04, 1.5, dashMaterial, radiusX * Math.cos(angle), 0.06, radiusZ * Math.sin(angle));
          dash.rotation.y = -angle;
          scene.add(dash);
        }
        for (let i = 0; i < 4; i++) {
          const angle = i / 4 * Math.PI * 2;
          const group = new THREE.Group();
          const arch = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.11, 8, 32), mat(THREE, '#b990ff', 0.25, 0.22, '#8555ff'));
          arch.position.y = 3.1;
          group.add(arch);
          group.position.set(radiusX * Math.cos(angle), 0, radiusZ * Math.sin(angle));
          scene.add(group);
        }

        const car = new THREE.Group();
        const chassis = boxMesh(THREE, 1.8, 0.56, 3.4, mat(THREE, '#e94d77', 0.34, 0.42), 0, 0.72, 0);
        const nose = boxMesh(THREE, 1.45, 0.3, 0.78, mat(THREE, '#ff91ab', 0.3, 0.38), 0, 0.82, 1.2);
        const cabin = boxMesh(THREE, 1.28, 0.78, 1.45, mat(THREE, '#31536a', 0.22, 0.22), 0, 1.28, -0.25);
        car.add(chassis, nose, cabin);
        const wheelMaterial = mat(THREE, '#10131a', 0.72, 0.02);
        [[-0.98, 0.45, -1], [0.98, 0.45, -1], [-0.98, 0.45, 1], [0.98, 0.45, 1]].forEach(function (p) {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.26, 16), wheelMaterial);
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(p[0], p[1], p[2]);
          car.add(wheel);
        });
        const lightMaterial = new THREE.MeshBasicMaterial({ color: '#d8f8ff' });
        car.add(boxMesh(THREE, 0.35, 0.12, 0.08, lightMaterial, -0.55, 0.78, 1.78));
        car.add(boxMesh(THREE, 0.35, 0.12, 0.08, lightMaterial, 0.55, 0.78, 1.78));
        scene.add(car);

        const state = { x: radiusX, z: 0, heading: 0, speed: 0, laps: 0, lastAngle: 0, time: 0, boost: 100, finished: false };
        const props = [];
        for (let i = 0; i < 24; i++) {
          const angle = i / 24 * Math.PI * 2;
          const tree = new THREE.Group();
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.3, 1.4, 7), mat(THREE, '#624732'));
          trunk.position.y = 0.7;
          const crown = new THREE.Mesh(new THREE.ConeGeometry(1.1, 2.2, 8), mat(THREE, '#2a7351', 0.82));
          crown.position.y = 2.25;
          tree.add(trunk, crown);
          tree.position.set(27 * Math.cos(angle), 0, 36 * Math.sin(angle));
          scene.add(tree);
          props.push(tree);
        }
        ctx.addControl('◀', 'a');
        ctx.addControl('BRAKE', 's');
        ctx.addControl('▶', 'd');
        ctx.addControl('GAS', 'w');
        ctx.addControl('BOOST', 'shift');
        ctx.setHelp('Complete 3 laps. W/↑ to accelerate, S/↓ to brake, A/D or ←/→ to steer, Shift to boost. Stay on the asphalt to keep your speed.');
        ctx.setHud('primary', 'LAP', '0 / 3');
        ctx.setHud('secondary', 'TIME', '0.0s');
        ctx.setHud('tertiary', 'SPEED', '0');

        ctx.setUpdate(function (dt) {
          if (state.finished) return;
          state.time += dt;
          const accelerate = ctx.keys.has('w') || ctx.keys.has('arrowup') || ctx.keys.has('gas');
          const brake = ctx.keys.has('s') || ctx.keys.has('arrowdown');
          const steer = (ctx.keys.has('d') || ctx.keys.has('arrowright') ? 1 : 0) - (ctx.keys.has('a') || ctx.keys.has('arrowleft') ? 1 : 0);
          const boosting = ctx.keys.has('shift') && state.boost > 0 && state.speed > 5;
          if (accelerate) state.speed += (boosting ? 24 : 16) * dt;
          else state.speed -= 4.2 * dt;
          if (brake) state.speed -= 22 * dt;
          if (boosting) state.boost = Math.max(0, state.boost - 30 * dt);
          else state.boost = Math.min(100, state.boost + 10 * dt);
          state.speed = Math.max(0, Math.min(boosting ? 32 : 25, state.speed));
          state.heading += steer * (0.35 + state.speed / 25 * 1.4) * dt;
          state.x += Math.sin(state.heading) * state.speed * dt;
          state.z += Math.cos(state.heading) * state.speed * dt;
          const angle = Math.atan2(state.z / radiusZ, state.x / radiusX);
          const centerX = radiusX * Math.cos(angle);
          const centerZ = radiusZ * Math.sin(angle);
          const offTrack = Math.hypot(state.x - centerX, state.z - centerZ);
          if (offTrack > 4.1) state.speed = Math.max(0, state.speed - (offTrack > 6.4 ? 18 : 7) * dt);
          if (offTrack > 8) {
            state.x = centerX;
            state.z = centerZ;
            state.speed *= 0.25;
          }
          if (state.lastAngle > 5.35 && angle < 0.9 && state.speed > 5) {
            state.laps++;
            if (state.laps >= 3) {
              state.finished = true;
              const score = Math.max(100, Math.round(3600 - state.time * 12 + state.boost * 2));
              ctx.finish(score, 'Race finished!', 'Three laps completed in ' + state.time.toFixed(1) + ' seconds.');
            }
          }
          state.lastAngle = angle;
          car.position.set(state.x, 0, state.z);
          car.rotation.y = state.heading;
          car.position.y = 0.05 + Math.sin(state.time * 20) * Math.min(0.025, state.speed * 0.001);
          const forward = new THREE.Vector3(Math.sin(state.heading), 0, Math.cos(state.heading));
          const chase = new THREE.Vector3(state.x, 0, state.z).addScaledVector(forward, -9).add(new THREE.Vector3(0, 6.5, 0));
          ctx.camera.position.lerp(chase, Math.min(1, dt * 4.5));
          ctx.camera.lookAt(state.x + forward.x * 3, 0.8, state.z + forward.z * 3);
          ctx.setHud('primary', 'LAP', state.laps + ' / 3');
          ctx.setHud('secondary', 'TIME', state.time.toFixed(1) + 's');
          ctx.setHud('tertiary', 'SPEED', Math.round(state.speed * 5) + ' km/h');
          if (state.time >= 150 && !state.finished) {
            state.finished = true;
            ctx.finish(Math.max(0, Math.round(state.laps * 350)), 'Time trial ended', 'You completed ' + state.laps + ' of 3 laps.');
          }
        });
      }
    });
  }

  function gameWildlands(game) {
    startThreeGame(game, {
      background: '#a7d3df',
      fogColor: '#9bbfbc',
      fogNear: 35,
      fogFar: 105,
      camera: function (THREE) {
        const camera = new THREE.PerspectiveCamera(72, 1, 0.1, 150);
        camera.position.set(0, 3, 8);
        camera.rotation.order = 'YXZ';
        return camera;
      },
      setup: function (THREE, ctx) {
        const scene = ctx.scene;
        function terrainHeight(x, z) {
          return 0.8 * Math.sin(x * 0.09) * Math.cos(z * 0.1) +
            1.2 * Math.sin((x + z) * 0.045) +
            0.45 * Math.cos(z * 0.2);
        }
        const terrainGeometry = new THREE.PlaneGeometry(92, 92, 88, 88);
        terrainGeometry.rotateX(-Math.PI / 2);
        const positions = terrainGeometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
          const x = positions.getX(i);
          const z = positions.getZ(i);
          positions.setY(i, terrainHeight(x, z));
        }
        terrainGeometry.computeVertexNormals();
        const terrain = new THREE.Mesh(terrainGeometry, mat(THREE, '#4c815b', 0.95));
        terrain.receiveShadow = true;
        scene.add(terrain);
        const water = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), new THREE.MeshStandardMaterial({ color: '#3f8fa9', roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.72 }));
        water.rotation.x = -Math.PI / 2;
        water.position.y = -1.6;
        scene.add(water);

        const treeMaterial = mat(THREE, '#2f694b', 0.9);
        const trunkMaterial = mat(THREE, '#6b5238', 0.95);
        for (let i = 0; i < 64; i++) {
          const x = (Math.random() - 0.5) * 78;
          const z = (Math.random() - 0.5) * 78;
          if (Math.hypot(x, z) < 8 || Math.hypot(x - 31, z + 30) < 8) continue;
          const tree = new THREE.Group();
          const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.32, 2.2, 7), trunkMaterial);
          trunk.position.y = 1.1;
          const crown = new THREE.Mesh(new THREE.ConeGeometry(1.35, 3.5, 8), treeMaterial);
          crown.position.y = 3.1;
          tree.add(trunk, crown);
          tree.position.set(x, terrainHeight(x, z), z);
          tree.rotation.y = Math.random() * Math.PI;
          scene.add(tree);
        }
        for (let i = 0; i < 22; i++) {
          const x = (Math.random() - 0.5) * 78;
          const z = (Math.random() - 0.5) * 78;
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7 + Math.random() * 0.8, 0), mat(THREE, '#687b77', 0.9));
          rock.position.set(x, terrainHeight(x, z) + 0.45, z);
          rock.rotation.set(Math.random(), Math.random(), Math.random());
          rock.castShadow = true;
          scene.add(rock);
        }

        const relicPositions = [[-18, 8], [-11, -13], [-2, 20], [8, -18], [17, 9], [24, -4], [-25, -18], [4, 5], [-7, 28], [18, 25]];
        const relics = [];
        relicPositions.forEach(function (point, index) {
          const relic = new THREE.Mesh(new THREE.OctahedronGeometry(0.62, 1), mat(THREE, index % 2 ? '#8bf5ff' : '#c2a0ff', 0.18, 0.2, index % 2 ? '#4be5ff' : '#985bff'));
          relic.position.set(point[0], terrainHeight(point[0], point[1]) + 1.1, point[1]);
          relic.castShadow = true;
          scene.add(relic);
          relics.push({ mesh: relic, found: false });
        });
        const beacon = new THREE.Group();
        const beaconBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.6, 0.6, 8), mat(THREE, '#405f70', 0.35, 0.2));
        beaconBase.position.y = 0.3;
        const beaconBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 7, 12), new THREE.MeshBasicMaterial({ color: '#8cf4ff', transparent: true, opacity: 0.58 }));
        beaconBeam.position.y = 4.0;
        const beaconRing = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.1, 8, 32), mat(THREE, '#a1fbff', 0.2, 0.2, '#4de8ff'));
        beaconRing.position.y = 1.5;
        beaconRing.rotation.x = Math.PI / 2;
        beacon.add(beaconBase, beaconBeam, beaconRing);
        beacon.position.set(31, terrainHeight(31, -30), -30);
        scene.add(beacon);

        let yaw = 0;
        let pitch = 0;
        let timeLeft = 210;
        let found = 0;
        let pointerLocked = false;
        let lastTouch = null;
        const camera = ctx.camera;
        function look() { camera.rotation.set(pitch, yaw, 0, 'YXZ'); }
        ctx.on(document, 'pointerlockchange', function () { pointerLocked = document.pointerLockElement === ctx.renderer.domElement; });
        ctx.on(document, 'mousemove', function (event) {
          if (!pointerLocked) return;
          yaw -= event.movementX * 0.002;
          pitch = Math.max(-1.05, Math.min(1.05, pitch - event.movementY * 0.0018));
          look();
        });
        ctx.on(ctx.renderer.domElement, 'click', function () {
          if (ctx.renderer.domElement.requestPointerLock && document.pointerLockElement !== ctx.renderer.domElement) ctx.renderer.domElement.requestPointerLock();
        });
        ctx.on(ctx.renderer.domElement, 'pointerdown', function (event) {
          if (event.pointerType === 'touch') lastTouch = { x: event.clientX, y: event.clientY };
        });
        ctx.on(ctx.renderer.domElement, 'pointermove', function (event) {
          if (event.pointerType !== 'touch' || !lastTouch) return;
          yaw -= (event.clientX - lastTouch.x) * 0.004;
          pitch = Math.max(-1.05, Math.min(1.05, pitch - (event.clientY - lastTouch.y) * 0.003));
          lastTouch = { x: event.clientX, y: event.clientY };
          look();
        });
        ctx.on(ctx.renderer.domElement, 'pointerup', function () { lastTouch = null; });
        camera.position.set(0, terrainHeight(0, 8) + 2.1, 8);
        ctx.addControl('↑', 'w');
        ctx.addControl('←', 'a');
        ctx.addControl('↓', 's');
        ctx.addControl('→', 'd');
        ctx.addControl('SPRINT', 'shift');
        ctx.setHelp('Explore the island. Find all 10 glowing relics, then walk into the beacon at the far side. Click to capture the mouse; drag to look on touch screens.');
        ctx.setHud('primary', 'RELICS', '0 / 10');
        ctx.setHud('secondary', 'TIME', '210s');
        ctx.setHud('tertiary', 'STAMINA', '100%');
        let stamina = 100;
        ctx.setUpdate(function (dt, elapsed) {
          const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
          const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
          const move = new THREE.Vector3();
          if (ctx.keys.has('w') || ctx.keys.has('arrowup')) move.add(forward);
          if (ctx.keys.has('s') || ctx.keys.has('arrowdown')) move.sub(forward);
          if (ctx.keys.has('d') || ctx.keys.has('arrowright')) move.add(right);
          if (ctx.keys.has('a') || ctx.keys.has('arrowleft')) move.sub(right);
          const sprint = ctx.keys.has('shift') && stamina > 1 && move.lengthSq() > 0;
          if (sprint) stamina = Math.max(0, stamina - 28 * dt);
          else stamina = Math.min(100, stamina + 17 * dt);
          if (move.lengthSq() > 0) {
            move.normalize().multiplyScalar((sprint ? 12 : 7) * dt);
            camera.position.add(move);
          }
          camera.position.x = Math.max(-43, Math.min(43, camera.position.x));
          camera.position.z = Math.max(-43, Math.min(43, camera.position.z));
          camera.position.y = terrainHeight(camera.position.x, camera.position.z) + 2.05;
          relics.forEach(function (relic, index) {
            if (relic.found) return;
            relic.mesh.rotation.y += dt * 1.5;
            relic.mesh.rotation.x += dt * 0.55;
            relic.mesh.position.y = terrainHeight(relic.mesh.position.x, relic.mesh.position.z) + 1.1 + Math.sin(elapsed * 2 + index) * 0.18;
            if (camera.position.distanceTo(relic.mesh.position) < 1.8) {
              relic.found = true;
              relic.mesh.visible = false;
              found++;
              ctx.setHud('primary', 'RELICS', found + ' / 10');
            }
          });
          beacon.rotation.y += dt * 0.45;
          timeLeft = Math.max(0, timeLeft - dt);
          ctx.setHud('secondary', 'TIME', Math.ceil(timeLeft) + 's');
          ctx.setHud('tertiary', 'STAMINA', Math.round(stamina) + '%');
          if (found === 10 && camera.position.distanceTo(new THREE.Vector3(31, terrainHeight(31, -30) + 1.6, -30)) < 3.2) {
            ctx.finish(1000 + Math.ceil(timeLeft) * 4, 'Island discovered', 'All 10 relics found. You reached the beacon with ' + Math.ceil(timeLeft) + ' seconds left.');
          }
          if (timeLeft <= 0) ctx.finish(found * 90, 'Expedition ended', 'You found ' + found + ' of 10 relics. Explore again to complete the island.');
        });
      }
    });
  }

  function gameParkEmpire(game) {
    startThreeGame(game, {
      background: '#132333',
      fogColor: '#1b3540',
      fogNear: 30,
      fogFar: 100,
      camera: function (THREE) {
        const camera = new THREE.OrthographicCamera(-19, 19, 13, -13, 0.1, 120);
        camera.position.set(21, 27, 23);
        camera.lookAt(0, 0, 0);
        return camera;
      },
      setup: function (THREE, ctx) {
        const scene = ctx.scene;
        const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), mat(THREE, '#32634d', 0.98));
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        scene.add(ground);
        const grid = new THREE.GridHelper(40, 20, '#9bd7b6', '#4c806b');
        grid.position.y = 0.015;
        scene.add(grid);
        const pathMaterial = mat(THREE, '#b7a28a', 0.96);
        const path = boxMesh(THREE, 38, 0.08, 2.1, pathMaterial, 0, 0.02, 0);
        scene.add(path);
        const cells = new Set();
        const rides = [];
        const rideTypes = {
          carousel: { name: 'Carousel', cost: 140, income: 24, guests: 5, color: '#f1b84c' },
          ferris: { name: 'Sky Wheel', cost: 260, income: 42, guests: 8, color: '#76c9e8' },
          coaster: { name: 'Mini Coaster', cost: 340, income: 58, guests: 11, color: '#e879a7' }
        };
        let selected = 'carousel';
        let cash = 850;
        let visitors = 0;
        let rating = 1;
        let incomeClock = 0;
        let guestClock = 0;
        let elapsed = 0;
        const visitorMeshes = [];
        const visitorMaterial = mat(THREE, '#ffe7b2', 0.82);
        for (let i = 0; i < 18; i++) {
          const visitor = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), visitorMaterial.clone());
          visitor.position.set(-17 + Math.random() * 34, 0.26, (Math.random() > 0.5 ? 1.5 : -1.5));
          scene.add(visitor);
          visitorMeshes.push({ mesh: visitor, phase: Math.random() * 20 });
        }
        function updateHud() {
          ctx.setHud('primary', 'CASH', '$' + Math.floor(cash));
          ctx.setHud('secondary', 'GUESTS', visitors);
          ctx.setHud('tertiary', 'RIDES', rides.length + ' / 8');
        }
        function createRide(type, x, z) {
          const info = rideTypes[type];
          const group = new THREE.Group();
          if (type === 'carousel') {
            const base = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.4, 0.45, 20), mat(THREE, '#e7bb65', 0.4, 0.08));
            base.position.y = 0.28;
            const roof = new THREE.Mesh(new THREE.ConeGeometry(1.55, 1.2, 20), mat(THREE, '#e86d8c', 0.36, 0.12));
            roof.position.y = 2.0;
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 2.7, 10), mat(THREE, '#f0e1bc', 0.32));
            pole.position.y = 1.25;
            group.add(base, roof, pole);
            for (let i = 0; i < 6; i++) {
              const a = i / 6 * Math.PI * 2;
              const horse = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.45, 3, 7), mat(THREE, i % 2 ? '#5ec8c5' : '#f6d06d', 0.36));
              horse.position.set(Math.cos(a) * 0.88, 1.0, Math.sin(a) * 0.88);
              group.add(horse);
            }
            group.userData.spin = true;
          } else if (type === 'ferris') {
            const wheel = new THREE.Mesh(new THREE.TorusGeometry(1.65, 0.12, 8, 32), mat(THREE, '#72d7f2', 0.25, 0.2, '#1b9bc1'));
            wheel.position.y = 2.2;
            wheel.rotation.x = Math.PI / 2;
            const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.6, 12), mat(THREE, '#c5d9df'));
            axle.position.y = 2.2;
            const supportA = boxMesh(THREE, 0.18, 2.6, 0.18, mat(THREE, '#9eafba'), -0.85, 1.15, 0);
            const supportB = boxMesh(THREE, 0.18, 2.6, 0.18, mat(THREE, '#9eafba'), 0.85, 1.15, 0);
            group.add(wheel, axle, supportA, supportB);
            for (let i = 0; i < 8; i++) {
              const a = i / 8 * Math.PI * 2;
              const pod = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.34), mat(THREE, i % 2 ? '#f19b62' : '#a38ce8'));
              pod.position.set(Math.cos(a) * 1.65, 2.2 + Math.sin(a) * 1.65, 0);
              group.add(pod);
            }
            group.userData.spin = true;
          } else {
            const track = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.12, 8, 36), mat(THREE, '#e778a1', 0.28, 0.25, '#b83771'));
            track.position.y = 1.05;
            track.scale.set(1.3, 0.72, 1);
            const support1 = boxMesh(THREE, 0.16, 1.5, 0.16, mat(THREE, '#a7b6c7'), -1.45, 0.65, 0.4);
            const support2 = boxMesh(THREE, 0.16, 1.5, 0.16, mat(THREE, '#a7b6c7'), 1.45, 0.65, -0.4);
            const cart = boxMesh(THREE, 0.56, 0.3, 0.76, mat(THREE, '#f6d16b'), 0, 1.4, 0);
            group.add(track, support1, support2, cart);
            group.userData.cart = cart;
          }
          group.position.set(x, 0, z);
          group.traverse(function (object) { if (object.isMesh) object.castShadow = true; });
          scene.add(group);
          rides.push({ group: group, type: type, info: info, x: x, z: z });
          cells.add(Math.round((x + 16) / 4) + ':' + Math.round((z + 16) / 4));
          cash -= info.cost;
          return group;
        }

        ctx.addTool('🎠 Carousel $140', function () { selected = 'carousel'; ctx.setHelp('Carousel selected. Click an empty grass tile to place it for $140.'); });
        ctx.addTool('🎡 Sky Wheel $260', function () { selected = 'ferris'; ctx.setHelp('Sky Wheel selected. Click an empty grass tile to place it for $260.'); });
        ctx.addTool('🎢 Mini Coaster $340', function () { selected = 'coaster'; ctx.setHelp('Mini Coaster selected. Click an empty grass tile to place it for $340.'); });
        ctx.setHelp('Choose a ride, then click an empty tile to build. Rides attract guests and earn ticket income. Build 8 rides and reach $1,500 cash.');
        ctx.setHud('primary', 'CASH', '$850');
        ctx.setHud('secondary', 'GUESTS', '0');
        ctx.setHud('tertiary', 'RIDES', '0 / 8');

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const groundMeshes = [ground];
        ctx.on(ctx.renderer.domElement, 'pointerdown', function (event) {
          const rect = ctx.renderer.domElement.getBoundingClientRect();
          pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(pointer, ctx.camera);
          const hit = raycaster.intersectObjects(groundMeshes, false)[0];
          if (!hit) return;
          const x = Math.round(hit.point.x / 4) * 4;
          const z = Math.round(hit.point.z / 4) * 4;
          const key = Math.round((x + 16) / 4) + ':' + Math.round((z + 16) / 4);
          if (Math.abs(x) > 16 || Math.abs(z) > 16 || Math.abs(z) < 2.1 || cells.has(key)) {
            ctx.setHelp('That tile is reserved for paths or already has a ride. Choose another grass tile.');
            return;
          }
          const info = rideTypes[selected];
          if (cash < info.cost) {
            ctx.setHelp('Not enough cash for a ' + info.name + '. Wait for ticket income or choose a less expensive ride.');
            return;
          }
          createRide(selected, x, z);
          rating = Math.min(5, 1 + rides.length * 0.4);
          ctx.setHelp(info.name + ' built! Guests are starting to arrive. Keep expanding your park.');
          updateHud();
          if (rides.length >= 8 && cash >= 1500) {
            const score = Math.round(cash + visitors * 12 + rating * 100);
            ctx.finish(score, 'Park of the year!', 'You built ' + rides.length + ' rides and welcomed ' + visitors + ' guests.');
          }
        });

        ctx.setUpdate(function (dt, now) {
          elapsed += dt;
          incomeClock += dt;
          guestClock += dt;
          rides.forEach(function (ride, index) {
            if (ride.group.userData.spin) ride.group.rotation.y += dt * (ride.type === 'ferris' ? 0.55 : 0.8);
            if (ride.group.userData.cart) ride.group.userData.cart.position.x = Math.sin(elapsed * 1.4 + index) * 1.3;
          });
          visitorMeshes.forEach(function (visitor) {
            const t = elapsed * 0.32 + visitor.phase;
            visitor.mesh.position.set(Math.sin(t) * 15, 0.22, Math.cos(t * 0.7) * 6 + (Math.sin(t * 0.4) > 0 ? 2.6 : -2.6));
          });
          if (guestClock >= 3) {
            guestClock = 0;
            visitors = Math.min(999, visitors + rides.length * 2);
          }
          if (incomeClock >= 5) {
            incomeClock = 0;
            const income = rides.reduce(function (sum, ride) { return sum + ride.info.income; }, 0);
            cash += income + Math.floor(visitors * 0.25);
            updateHud();
            if (rides.length >= 8 && cash >= 1500 && !ctx.completed) {
              const score = Math.round(cash + visitors * 12 + rating * 100);
              ctx.finish(score, 'Park of the year!', 'You built ' + rides.length + ' rides and welcomed ' + visitors + ' guests.');
            }
          }
        });
      }
    });
  }

  global.gameNeonStrike = gameNeonStrike;
  global.gameGravityRush = gameGravityRush;
  global.gameVelocityX = gameVelocityX;
  global.gameWildlands = gameWildlands;
  global.gameParkEmpire = gameParkEmpire;

  const originalRunGame = global.runGame;
  global.runGame = function (game) {
    const launchers = {
      'neon-strike': global.gameNeonStrike,
      'gravity-rush': global.gameGravityRush,
      'velocity-x': global.gameVelocityX,
      'wildlands': global.gameWildlands,
      'park-empire': global.gameParkEmpire
    };
    if (launchers[game.engine]) {
      if (typeof cleanup === 'function') cleanup();
      cleanup = function () {};
      if (keyHandler) global.removeEventListener('keydown', keyHandler);
      keyHandler = null;
      launchers[game.engine](game);
      return;
    }
    originalRunGame(game);
  };

  const originalFilteredGames = global.filteredGames;
  global.filteredGames = function () {
    if (activeFilter === '3D Games') {
      let list = games.filter(function (game) {
        return game.is3D && (game.name + ' ' + game.desc + ' ' + game.category).toLowerCase().includes(searchText);
      });
      if (sortMode === 'az') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
      return list;
    }
    return originalFilteredGames();
  };

  const originalRenderChips = global.renderChips;
  global.renderChips = function () {
    originalRenderChips();
    const entries = [
      ['3D Games', '🧊 3D Games · ' + games.filter(function (game) { return game.is3D; }).length],
      ['Racing', '🏎️ Racing'],
      ['Adventure', '🌿 Adventure'],
      ['Simulation', '🎡 Simulation']
    ];
    entries.forEach(function (entry) {
      const chip = makeElement('button', 'chip' + (activeFilter === entry[0] ? ' active' : ''), entry[1]);
      chip.dataset.filter = entry[0];
      $('chips').appendChild(chip);
    });
  };

  const originalSetFilter = global.setFilter;
  global.setFilter = function (filter) {
    if (filter === '3D Games') {
      activeFilter = filter;
      global.render();
      $('games').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    originalSetFilter(filter);
  };

  const originalCardHTML = global.cardHTML;
  global.cardHTML = function (game) {
    let html = originalCardHTML(game);
    if (game.is3D) html = html.replace('>ORIGINAL</span>', '>3D ORIGINAL</span>');
    return html;
  };

  function add3DNavigation() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    const entries = [
      ['3D Games', '🧊 3D Games'],
      ['Racing', '🏎️ Racing'],
      ['Adventure', '🌿 Adventure'],
      ['Simulation', '🎡 Simulation']
    ];
    entries.forEach(function (entry) {
      if (sidebar.querySelector('[data-filter="' + entry[0] + '"]')) return;
      const button = makeElement('button', 'navbtn', entry[1]);
      button.dataset.filter = entry[0];
      sidebar.insertBefore(button, sidebar.querySelector('.side-note'));
    });
  }

  function addShowcase() {
    if (document.getElementById('threeDShowcase')) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const section = makeElement('section', 'v10-showcase');
    section.id = 'threeDShowcase';
    section.innerHTML =
      '<div class="v10-showcase-head">' +
        '<div><span class="v10-eyebrow">✦ PIXELLAB 3D UNIVERSE</span><h2>Step into a bigger arcade.</h2><p>Five original 3D worlds. Built to play, explore, race, and come back to.</p></div>' +
        '<button class="v10-see-all" type="button" data-filter="3D Games">Explore all 3D games <span>↗</span></button>' +
      '</div>' +
      '<div class="v10-three-grid" id="threeDFeatured"></div>';
    hero.insertAdjacentElement('afterend', section);
  }

  const originalRender = global.render;
  global.render = function () {
    originalRender();
    add3DNavigation();
    addShowcase();
    const grid = document.getElementById('threeDFeatured');
    if (grid) {
      const featured = games.filter(function (game) { return game.is3D; });
      grid.innerHTML = featured.map(function (game) { return global.cardHTML(game); }).join('');
    }
    const heroEyebrow = document.querySelector('.hero .eyebrow');
    const heroTitle = document.querySelector('.hero h1');
    const heroCopy = document.querySelector('.hero-copy p');
    if (heroEyebrow) heroEyebrow.innerHTML = '<span class="pulse"></span> V10 · THE 3D EVOLUTION';
    if (heroTitle) heroTitle.innerHTML = 'Your next world.<br><span class="gradient">Ready to explore.</span>';
    if (heroCopy) heroCopy.textContent = 'A redesigned arcade with five original 3D games, classic favorites, and fresh challenges. Open a game and jump straight in.';
    const stats = document.querySelectorAll('.stats .stat');
    if (stats[1]) stats[1].innerHTML = '<strong>32</strong> playable game engines';
    if (stats[2]) stats[2].innerHTML = '<strong>5</strong> original 3D games';
    const search = document.getElementById('search');
    if (search) search.placeholder = 'Search 200 games…';
    const topPill = document.querySelector('.top-pill');
    if (topPill) topPill.textContent = '✦ 3D worlds · No downloads · No account';
    if (activeFilter === '3D Games') {
      const sectionTitle = document.getElementById('sectionTitle');
      const sectionSub = document.getElementById('sectionSub');
      if (sectionTitle) sectionTitle.textContent = 'Explore 3D games';
      if (sectionSub) sectionSub.textContent = 'Five original real-time 3D experiences. Pick a world and jump in.';
    }
  };

  global.startThreeGame = startThreeGame;
  global.v11Material = mat;
  global.v11BoxMesh = boxMesh;

  add3DNavigation();
  addShowcase();
  global.render();
})(window);
