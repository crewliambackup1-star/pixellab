'use strict';

(function (global) {
  const startThreeGame = global.startThreeGame;
  const material = global.v11Material;
  const boxMesh = global.v11BoxMesh;
  if (!startThreeGame || !material || !boxMesh) {
    console.error('PixelLab V11 could not find the shared 3D runtime.');
    return;
  }

  function addPlane(T, scene, width, depth, color, y) {
    const ground = new T.Mesh(new T.PlaneGeometry(width, depth), material(T, color, 0.9));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = y || 0;
    ground.receiveShadow = true;
    scene.add(ground);
    return ground;
  }

  function addSphere(T, scene, radius, color, x, y, z, emissive) {
    const mesh = new T.Mesh(new T.SphereGeometry(radius, 18, 14), material(T, color, 0.32, 0.12, emissive));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  }

  function addPillar(T, scene, x, z, color, height) {
    const h = height || 3;
    const pillar = boxMesh(T, 1.1, h, 1.1, material(T, color, 0.42, 0.2, color), x, h / 2, z);
    scene.add(pillar);
    return pillar;
  }

  function makeAvatar(T, scene, color) {
    const root = new T.Group();
    const body = new T.Mesh(new T.CapsuleGeometry(0.48, 0.65, 4, 8), material(T, color, 0.48, 0.04));
    body.position.y = 0.95;
    body.castShadow = true;
    root.add(body);
    const head = addSphere(T, root, 0.34, '#f5d8b1', 0, 1.75, 0);
    const badge = new T.Mesh(new T.TorusGeometry(0.55, 0.055, 8, 28), material(T, '#75eaff', 0.25, 0.2, '#21bfe0'));
    badge.rotation.x = Math.PI / 2;
    badge.position.y = 0.1;
    root.add(badge);
    root.position.y = 0;
    scene.add(root);
    return root;
  }

  function makeCar(T, scene, color, truck) {
    const root = new T.Group();
    const body = boxMesh(T, truck ? 2.2 : 1.9, 0.75, truck ? 4.4 : 3.4, material(T, color, 0.34, 0.42), 0, 0.8, 0);
    root.add(body);
    const cabin = boxMesh(T, truck ? 1.7 : 1.45, 0.8, truck ? 1.7 : 1.55, material(T, '#a7d9e8', 0.24, 0.18), 0, 1.45, truck ? 0.35 : -0.12);
    root.add(cabin);
    const wheelMat = material(T, '#131d2a', 0.92);
    [[-0.95,0.43,-1.25],[0.95,0.43,-1.25],[-0.95,0.43,1.25],[0.95,0.43,1.25]].forEach(function (p) {
      const wheel = new T.Mesh(new T.CylinderGeometry(0.43, 0.43, 0.3, 14), wheelMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(p[0], p[1], p[2]);
      root.add(wheel);
    });
    const lamps = material(T, '#fff1aa', 0.25, 0.1, '#ffde65');
    [-0.57,0.57].forEach(function (x) {
      const lamp = new T.Mesh(new T.BoxGeometry(0.3, 0.18, 0.08), lamps);
      lamp.position.set(x, 0.95, -1.73);
      root.add(lamp);
    });
    scene.add(root);
    return root;
  }

  function addTouchMove(ctx) {
    ctx.addControl('↑', 'w');
    ctx.addControl('←', 'a');
    ctx.addControl('↓', 's');
    ctx.addControl('→', 'd');
    ctx.addControl('JUMP', 'space');
  }

  function gameNeonStrike(game) {
    startThreeGame(game, {
      background: '#081224', fogColor: '#0d1b32', fogNear: 25, fogFar: 72,
      camera: function (T) {
        const camera = new T.PerspectiveCamera(72, 1, 0.1, 100);
        camera.position.set(0, 2.1, 15);
        camera.lookAt(0, 2, 0);
        return camera;
      },
      setup: function (T, ctx) {
        const scene = ctx.scene;
        addPlane(T, scene, 40, 40, '#172943');
        const grid = new T.GridHelper(40, 40, '#41d9ef', '#29405e');
        grid.position.y = 0.025; scene.add(grid);
        for (let i=-1;i<=1;i+=2) {
          scene.add(boxMesh(T, 40, 4, 0.7, material(T, '#233c5d', 0.55, 0.22, '#123d72'), 0, 2, i*20));
          scene.add(boxMesh(T, 0.7, 4, 40, material(T, '#233c5d', 0.55, 0.22, '#123d72'), i*20, 2, 0));
        }
        const palettes = [
          {name:'Neon Grid',bg:'#081224',colors:['#65efff','#b88cff','#ff8dc9']},
          {name:'Solar Deck',bg:'#1a1728',colors:['#ffd36d','#ff986d','#9ef3cc']},
          {name:'Deep Pulse',bg:'#091b20',colors:['#77f7c8','#6abaff','#ed9bff']}
        ];
        let arena = 0, score = 0, streak = 0, bestStreak = 0, time = 75;
        const raycaster = new T.Raycaster();
        const targets = [];
        function spawn(target, index) {
          const angle = Math.random()*Math.PI*2;
          const radius = 3.5+Math.random()*8;
          target.root.position.set(Math.cos(angle)*radius, 1.1+Math.random()*5, Math.sin(angle)*radius-2);
          target.phase = Math.random()*6;
          target.speed = 0.8+Math.random()*0.8;
          target.root.visible = true;
          target.cooldown = 0;
          target.core.material.color.set(palettes[arena].colors[index%3]);
          target.core.material.emissive.set(palettes[arena].colors[index%3]);
          target.ring.material.color.set(palettes[arena].colors[index%3]);
        }
        for (let i=0;i<10;i++) {
          const root = new T.Group();
          const core = new T.Mesh(new T.IcosahedronGeometry(0.48,1), material(T,'#67efff',0.2,0.2,'#25c9ee'));
          const ring = new T.Mesh(new T.TorusGeometry(0.77,0.07,8,28), material(T,'#67efff',0.2,0.2,'#25c9ee'));
          root.add(core,ring); scene.add(root);
          const target={root:root,core:core,ring:ring,phase:i,cooldown:0,speed:1};
          targets.push(target); spawn(target,i);
        }
        const arenaTool=ctx.addTool('Arena: Neon Grid',function(){
          arena=(arena+1)%palettes.length;
          scene.background=new T.Color(palettes[arena].bg);
          arenaTool.textContent='Arena: '+palettes[arena].name;
          targets.forEach(function(t,i){t.core.material.color.set(palettes[arena].colors[i%3]);t.core.material.emissive.set(palettes[arena].colors[i%3]);t.ring.material.color.set(palettes[arena].colors[i%3]);});
          streak=0; ctx.setHud('tertiary','STREAK','0');
        });
        ctx.setHud('primary','SCORE','0');ctx.setHud('secondary','TIME','75');ctx.setHud('tertiary','STREAK','0');
        ctx.setHelp('Click or tap moving targets. Use the Arena button to switch between three visual arenas. Clean hits build a score multiplier.');
        function shoot(event) {
          if(ctx.completed)return;
          const rect=ctx.stage.getBoundingClientRect();
          const pointer=new T.Vector2();
          pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
          pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;
          raycaster.setFromCamera(pointer,ctx.camera);
          const live=targets.filter(function(t){return t.root.visible;});
          const meshes=[];
          live.forEach(function(t){meshes.push(t.core,t.ring);});
          const hit=raycaster.intersectObjects(meshes,false)[0];
          if(hit){
            const target=live.find(function(t){return t.core===hit.object||t.ring===hit.object;});
            if(target){
              streak++;bestStreak=Math.max(bestStreak,streak);
              score+=100+Math.min(400,streak*20);
              target.root.visible=false;target.cooldown=0.65+Math.random()*0.35;
              ctx.setHud('primary','SCORE',score);ctx.setHud('tertiary','STREAK',streak);
            }
          }else{streak=0;ctx.setHud('tertiary','STREAK','0');}
        }
        ctx.on(ctx.stage,'pointerdown',shoot);
        ctx.addControl('FIRE','enter','fire');
        ctx.setUpdate(function(dt,elapsed){
          time-=dt;
          if(time<=0){ctx.setHud('secondary','TIME','0');ctx.finish(score,'Arena mastered','You scored '+score+' points and reached a '+bestStreak+' target streak.');return;}
          ctx.setHud('secondary','TIME',Math.ceil(time));
          if(ctx.actions.delete('fire')) {
            const center=new T.Vector2(0,0);raycaster.setFromCamera(center,ctx.camera);
            const live=targets.filter(function(t){return t.root.visible;});
            const meshes=[];live.forEach(function(t){meshes.push(t.core,t.ring);});
            const hit=raycaster.intersectObjects(meshes,false)[0];
            if(hit){const target=live.find(function(t){return t.core===hit.object||t.ring===hit.object;});if(target){streak++;bestStreak=Math.max(bestStreak,streak);score+=100+Math.min(400,streak*20);target.root.visible=false;target.cooldown=0.7;ctx.setHud('primary','SCORE',score);ctx.setHud('tertiary','STREAK',streak);}}
            else{streak=0;ctx.setHud('tertiary','STREAK','0');}
          }
          targets.forEach(function(t,i){
            if(!t.root.visible){t.cooldown-=dt;if(t.cooldown<=0)spawn(t,i);return;}
            t.root.position.x+=Math.sin(elapsed*t.speed+t.phase)*dt*0.55;
            t.root.position.y+=Math.sin(elapsed*1.8+t.phase)*dt*0.8;
            t.root.position.z+=Math.cos(elapsed*0.7+t.phase)*dt*0.25;
            t.ring.rotation.z+=dt*1.3;t.core.rotation.y+=dt*1.5;
          });
          if(ctx.keys.has('arrowleft')||ctx.keys.has('a'))ctx.camera.rotation.y+=dt*0.7;
          if(ctx.keys.has('arrowright')||ctx.keys.has('d'))ctx.camera.rotation.y-=dt*0.7;
          if(ctx.keys.has('arrowup')||ctx.keys.has('w'))ctx.camera.rotation.x=Math.max(-0.35,ctx.camera.rotation.x-dt*0.5);
          if(ctx.keys.has('arrowdown')||ctx.keys.has('s'))ctx.camera.rotation.x=Math.min(0.35,ctx.camera.rotation.x+dt*0.5);
        });
      }
    });
  }

  function gameGravityRush(game) {
    startThreeGame(game, {
      background:'#0c1b30',fogColor:'#132c49',camera:function(T){
        const camera=new T.PerspectiveCamera(65,1,0.1,120);camera.position.set(0,8,15);return camera;
      },
      setup:function(T,ctx){
        const scene=ctx.scene;
        const palettes=[['#244f73','#58d8e8'],['#49386d','#f4b96b'],['#245d57','#87f3b3']];
        let course=0,score=0,shards=0,time=0;
        const courseGroup=new T.Group();scene.add(courseGroup);
        const player=new T.Group();
        const body=new T.Mesh(new T.CapsuleGeometry(.45,.65,4,8),material(T,'#f5f7ff',.5));
        body.position.y=.75;body.castShadow=true;player.add(body);
        const ring=new T.Mesh(new T.TorusGeometry(.55,.06,8,24),material(T,'#75edff',.2,.1,'#22d9f5'));
        ring.rotation.x=Math.PI/2;ring.position.y=.12;player.add(ring);
        scene.add(player);
        const platforms=[],pickups=[];
        let vy=0,grounded=false,jumps=0,checkpoint={x:0,z:7},runTime=0,complete=false;
        const portal=new T.Group();
        const portalRing=new T.Mesh(new T.TorusGeometry(2,0.2,12,40),material(T,'#9ffaff',.2,.15,'#28d8ff'));
        portalRing.rotation.y=Math.PI/2;portal.add(portalRing);scene.add(portal);
        function rebuild(){
          while(courseGroup.children.length){
            const o=courseGroup.children.pop();courseGroup.remove(o);
          }
          platforms.length=0;pickups.length=0;score=0;shards=0;vy=0;jumps=0;grounded=false;runTime=0;complete=false;
          const data=palettes[course];scene.background=new T.Color(course===0?'#0c1b30':course===1?'#1c1730':'#0d2829');
          for(let i=0;i<11;i++){
            const z=7-i*7;
            const offsets=[0,2,-2,3,-3,0,3,-2,2,-1,0];
            const x=offsets[(i+course*3)%offsets.length];
            const width=i===4?5.5:6.2;
            const platform=boxMesh(T,width,.7,6,material(T,i%2?data[0]:'#354c72',.55,.12),x,-.35,z);
            courseGroup.add(platform);platforms.push({mesh:platform,x:x,z:z,width:width,depth:6,index:i,top:0});
            if(i%2===1&&i<10){
              const crystal=new T.Mesh(new T.OctahedronGeometry(.5),material(T,data[1],.2,.15,data[1]));
              crystal.position.set(x,1.15,z);courseGroup.add(crystal);pickups.push({mesh:crystal,taken:false});
            }
            if(i===6){
              const mover=boxMesh(T,3,.55,3,material(T,'#a78bfa',.3,.2,'#7557db'),x,0,z-3);
              courseGroup.add(mover);platforms.push({mesh:mover,x:x,z:z-3,width:3,depth:3,index:100,top:.28,moving:true,baseX:x});
            }
          }
          portal.position.set(0,1.4,-68);portal.visible=true;
          player.position.set(0,.05,7);checkpoint={x:0,z:0};
          ctx.setHud('primary','SHARDS','0');ctx.setHud('secondary','TIME','0');ctx.setHud('tertiary','COURSE',''+(course+1));
        }
        const courseTool=ctx.addTool('Course 1 · Skyway',function(){course=(course+1)%3;courseTool.textContent='Course '+(course+1)+' · '+['Skyway','Emberfall','Verdant'][course];rebuild();});
        addTouchMove(ctx);
        ctx.addControl('JUMP','space','jump');
        ctx.setHelp('Move across the floating route, collect the glowing shards, and reach the portal. A second jump gives you extra airtime; checkpoints keep each run forgiving.');
        rebuild();
        ctx.setUpdate(function(dt,elapsed){
          if(complete)return;
          runTime+=dt;time+=dt;
          const keys=ctx.keys;
          const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
          const side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
          player.position.x+=side*8*dt;player.position.z-=forward*8*dt;
          player.position.x=Math.max(-8,Math.min(8,player.position.x));
          if((keys.has('space')||ctx.actions.delete('jump'))&&!player.userData.jumpLock&&jumps<2){
            vy=8.8;jumps++;grounded=false;player.userData.jumpLock=true;
          }
          if(!keys.has('space'))player.userData.jumpLock=false;
          vy-=22*dt;const oldY=player.position.y;player.position.y+=vy*dt;grounded=false;
          platforms.forEach(function(p){
            if(p.moving){p.mesh.position.x=p.baseX+Math.sin(elapsed*1.3)*1.7;p.x=p.mesh.position.x;}
            const within=Math.abs(player.position.x-p.x)<p.width/2+.35&&Math.abs(player.position.z-p.z)<p.depth/2+.35;
            if(within&&vy<=0&&oldY>=p.top&&player.position.y<=p.top+.8){
              player.position.y=p.top;vy=0;grounded=true;jumps=0;
              if(p.index===3||p.index===6)checkpoint={x:p.x,z:p.z};
            }
          });
          pickups.forEach(function(p){if(p.taken)return;p.mesh.rotation.y+=dt*1.5;p.mesh.position.y=1.15+Math.sin(elapsed*2+p.mesh.position.z)*.22;
            if(player.position.distanceTo(p.mesh.position)<1.8){p.taken=true;p.mesh.visible=false;shards++;score+=100;ctx.setHud('primary','SHARDS',shards);}
          });
          if(player.position.y<-8){player.position.set(checkpoint.x,1,checkpoint.z);vy=0;jumps=0;}
          if(player.position.distanceTo(portal.position)<2.7){complete=true;ctx.finish(score+Math.max(0,Math.round(500-runTime*4)),'Skyway cleared','You collected '+shards+' shards and completed Course '+(course+1)+' in '+Math.round(runTime)+' seconds.');}
          ring.rotation.z+=dt*1.8;
          ctx.camera.position.lerp(new T.Vector3(player.position.x,player.position.y+7,player.position.z+13),Math.min(1,dt*3));
          ctx.camera.lookAt(player.position.x,player.position.y+1,player.position.z-4);
          ctx.setHud('secondary','TIME',Math.floor(runTime));
          ctx.setHud('tertiary','PORTAL',Math.max(0,Math.round(Math.abs(player.position.z+68))));
        });
      }
    });
  }

  function gameVelocityX(game) {
    startThreeGame(game, {
      background:'#101526',fogColor:'#202940',camera:function(T){
        const camera=new T.PerspectiveCamera(58,1,.1,180);camera.position.set(0,25,30);return camera;
      },
      setup:function(T,ctx){
        const scene=ctx.scene;
        addPlane(T,scene,150,150,'#234236');
        let track=0,lap=0,score=0,time=0,speed=0,yaw=0,boost=100;
        let rx=34,rz=49;
        const trackGroup=new T.Group();scene.add(trackGroup);
        const rivals=[];
        const car=makeCar(T,scene,'#ff6f8d',false);
        car.position.set(0,.15,rz-2);
        const trackDefs=[{name:'Coastal Loop',rx:34,rz:49,color:'#303e58'},{name:'Desert Run',rx:41,rz:43,color:'#55463a'},{name:'Skyline Circuit',rx:29,rz:56,color:'#3f3b58'}];
        function buildTrack(){
          while(trackGroup.children.length){const o=trackGroup.children.pop();trackGroup.remove(o);}
          rx=trackDefs[track].rx;rz=trackDefs[track].rz;
          for(let i=0;i<64;i++){
            const a=i/64*Math.PI*2;
            const x=Math.sin(a)*rx,z=Math.cos(a)*rz;
            const next=(i+1)/64*Math.PI*2;
            const nx=Math.sin(next)*rx,nz=Math.cos(next)*rz;
            const angle=Math.atan2(nx-x,nz-z);
            const road=boxMesh(T,13,.26,5.2,material(T,trackDefs[track].color,.87),x,.12,z);
            road.rotation.y=angle;trackGroup.add(road);
            const stripe=boxMesh(T,.18,.04,3.4,material(T,'#e8e5d8',.7),x,.28,z);
            stripe.rotation.y=angle;trackGroup.add(stripe);
          }
          const startLine=boxMesh(T,12,.12,1.2,material(T,'#f4f3e9',.6),0,.35,rz-1);trackGroup.add(startLine);
          for(let i=0;i<10;i++){
            const a=i/10*Math.PI*2;
            const tree=boxMesh(T,1,5,1,material(T,'#426b55',.9),Math.sin(a)*(rx+13),2.5,Math.cos(a)*(rz+13));
            trackGroup.add(tree);
          }
          rivals.forEach(function(r,i){const a=i*2.1;r.position.set(Math.sin(a)*rx,.15,Math.cos(a)*rz);});
          car.position.set(0,.15,rz-2);yaw=0;speed=0;lap=0;
        }
        for(let i=0;i<2;i++)rivals.push(makeCar(T,i?'#76c9ff':'#ffc45e',false));
        const trackTool=ctx.addTool('Track: Coastal Loop',function(){track=(track+1)%trackDefs.length;trackTool.textContent='Track: '+trackDefs[track].name;buildTrack();});
        ctx.addControl('↑','w');ctx.addControl('↓','s');ctx.addControl('←','a');ctx.addControl('→','d');ctx.addControl('BOOST','shift');
        ctx.setHud('primary','LAP','0 / 3');ctx.setHud('secondary','SPEED','0');ctx.setHud('tertiary','BOOST','100%');
        ctx.setHelp('Race three laps on one of three circuits. Ease into turns, use boost on the straights, and keep your wheels on the track for maximum pace.');
        buildTrack();
        ctx.setUpdate(function(dt,elapsed){
          time+=dt;
          const oldZ=car.position.z;
          const keys=ctx.keys;
          const accel=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
          const steer=(keys.has('a')||keys.has('arrowleft')?1:0)-(keys.has('d')||keys.has('arrowright')?1:0);
          const boosting=(keys.has('shift')&&boost>0);
          speed+=accel*(boosting?28:18)*dt;
          speed*=Math.pow(.985,dt*60);
          speed=Math.max(-6,Math.min(boosting?34:25,speed));
          if(boosting){boost=Math.max(0,boost-35*dt);}else{boost=Math.min(100,boost+13*dt);}
          yaw+=steer*dt*(1.1+Math.abs(speed)*.055)*(speed<0?-1:1);
          car.position.x+=Math.sin(yaw)*speed*dt;
          car.position.z-=Math.cos(yaw)*speed*dt;
          car.rotation.y=yaw;
          const normalized=Math.sqrt((car.position.x*car.position.x)/(rx*rx)+(car.position.z*car.position.z)/(rz*rz));
          if(Math.abs(normalized-1)>.16)speed*=Math.pow(.9,dt*60);
          if(oldZ<rz-2&&car.position.z>=rz-2&&Math.abs(car.position.x)<9&&speed>3){
            lap++;ctx.setHud('primary','LAP',Math.min(lap,3)+' / 3');
            if(lap>=3){const result=Math.max(100,Math.round(5000-time*12+boost*5));ctx.finish(result,'Circuit champion','You completed '+trackDefs[track].name+' in '+Math.round(time)+' seconds.');}
          }
          rivals.forEach(function(r,i){
            const a=elapsed*(.16+i*.025)+i*2.5;
            r.position.set(Math.sin(a)*rx,.15,Math.cos(a)*rz);
            r.rotation.y=Math.atan2(Math.cos(a)*rx,-Math.sin(a)*rz);
          });
          ctx.camera.position.lerp(new T.Vector3(car.position.x-Math.sin(yaw)*10,car.position.y+16,car.position.z+Math.cos(yaw)*17),Math.min(1,dt*2.6));
          ctx.camera.lookAt(car.position.x,0,car.position.z);
          ctx.setHud('secondary','SPEED',Math.round(Math.abs(speed)*7));
          ctx.setHud('tertiary','BOOST',Math.round(boost)+'%');
        });
      }
    });
  }

  function gameWildlands(game) {
    startThreeGame(game, {
      background:'#8bb9c2',fogColor:'#a8c5b2',fogNear:30,fogFar:120,camera:function(T){
        const camera=new T.PerspectiveCamera(62,1,.1,180);camera.position.set(0,10,17);return camera;
      },
      setup:function(T,ctx){
        const scene=ctx.scene;
        const biomes=[
          {name:'Pine Coast',ground:'#4d7659',sky:'#8bb9c2',accent:'#75f0d4'},
          {name:'Amber Highlands',ground:'#98764c',sky:'#c5a878',accent:'#ffd27d'},
          {name:'Frostwood',ground:'#718e9c',sky:'#a9d3e4',accent:'#d4f8ff'}
        ];
        let biome=0,score=0,relics=0,discoveries=0;
        const ground=addPlane(T,scene,120,120,biomes[0].ground);
        const player=makeAvatar(T,scene,'#f4d36c');
        player.position.set(0,0,28);
        const relicsGroup=new T.Group();scene.add(relicsGroup);
        const wildlife=[];
        const landmarks=[];
        const beacon=new T.Group();scene.add(beacon);beacon.position.set(0,1,-48);
        const beaconRing=new T.Mesh(new T.TorusGeometry(2.3,.18,10,36),material(T,'#e8ffff',.2,.1,'#ffffff'));
        beaconRing.rotation.x=Math.PI/2;beacon.add(beaconRing);
        function clearGroup(group){while(group.children.length){const child=group.children.pop();group.remove(child);}}
        function buildBiome(){
          ground.material.color.set(biomes[biome].ground);scene.background=new T.Color(biomes[biome].sky);
          clearGroup(relicsGroup);wildlife.forEach(function(w){scene.remove(w.root);});wildlife.length=0;landmarks.length=0;
          const treeMat=material(T,biome===1?'#806342':biome===2?'#d5e8ee':'#315c47',.9);
          for(let i=0;i<26;i++){
            const x=(Math.random()-.5)*90,z=(Math.random()-.5)*90;
            const trunk=boxMesh(T,.55,2.8,.55,material(T,'#76533e',.9),x,1.4,z);
            const crown=new T.Mesh(new T.ConeGeometry(2.1,4.6,7),treeMat);crown.position.set(x,4.8,z);crown.castShadow=true;scene.add(crown);
            scene.add(trunk);
          }
          for(let i=0;i<5;i++){
            const x=(i-2)*11+(biome-1)*3,z=-7-i*8;
            const relic=new T.Mesh(new T.OctahedronGeometry(.72),material(T,biomes[biome].accent,.18,.2,biomes[biome].accent));
            relic.position.set(x,1.35,z);relicsGroup.add(relic);
            relicsGroup.children[relicsGroup.children.length-1].userData={collected:false};
          }
          for(let i=0;i<3;i++){
            const root=new T.Group();
            const creature=addSphere(T,root,.72,['#a8c5b2','#d9b28a','#b7d7ef'][biome],(i-1)*13,0,0);
            const ear=addSphere(T,root,.25,'#e9f1e8',0,.65,0);root.position.set((i-1)*14,0,-14-i*9);scene.add(root);
            wildlife.push({root:root,phase:i*2,speed:.45+i*.14});
          }
          for(let i=0;i<3;i++){
            const marker=addPillar(T,scene, (i-1)*24,-26-biome*4,biomes[biome].accent,2.5);
            landmarks.push({mesh:marker,found:false});
          }
          relics=0;discoveries=0;score=0;
          ctx.setHud('primary','RELICS','0 / 5');ctx.setHud('tertiary','DISCOVERIES','0 / 3');
        }
        const biomeTool=ctx.addTool('Biome: Pine Coast',function(){biome=(biome+1)%3;biomeTool.textContent='Biome: '+biomes[biome].name;buildBiome();});
        addTouchMove(ctx);
        ctx.addControl('SPRINT','shift');
        ctx.setHelp('Walk the island and get close to the floating relics and landmark pillars. Wildlife moves around the world. Find all five relics in each region, then reach the beacon.');
        buildBiome();
        let totalRelics=0;
        ctx.setUpdate(function(dt,elapsed){
          const keys=ctx.keys,forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
          const side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
          const sprint=keys.has('shift')?1.65:1;
          player.position.x+=side*7*dt*sprint;player.position.z-=forward*7*dt*sprint;
          player.position.x=Math.max(-48,Math.min(48,player.position.x));player.position.z=Math.max(-48,Math.min(48,player.position.z));
          relicsGroup.children.forEach(function(relic){
            if(relic.userData.collected)return;
            relic.rotation.y+=dt*1.3;relic.position.y=1.35+Math.sin(elapsed*2+relic.position.z)*.24;
            if(player.position.distanceTo(relic.position)<2.2){relic.userData.collected=true;relic.visible=false;relics++;totalRelics++;score+=120;ctx.setHud('primary','RELICS',relics+' / 5');}
          });
          landmarks.forEach(function(item){if(!item.found&&player.position.distanceTo(item.mesh.position)<4){item.found=true;item.mesh.material.emissive.set('#ffffff');discoveries++;score+=80;ctx.setHud('tertiary','DISCOVERIES',discoveries+' / 3');}});
          wildlife.forEach(function(w){w.root.position.x+=Math.sin(elapsed*w.speed+w.phase)*dt*1.5;w.root.position.z+=Math.cos(elapsed*.55+w.phase)*dt*1.1;});
          beaconRing.rotation.z+=dt*.8;
          ctx.camera.position.lerp(new T.Vector3(player.position.x,player.position.y+9,player.position.z+16),Math.min(1,dt*2.5));
          ctx.camera.lookAt(player.position.x,1,player.position.z-3);
          if(relics===5&&discoveries===3&&player.position.distanceTo(beacon.position)<4){
            ctx.finish(score+totalRelics*20,'Island explorer','You discovered all five relics and three landmarks in '+biomes[biome].name+'.');
          }
        });
      }
    });
  }

  function gameParkEmpire(game) {
    startThreeGame(game, {
      background:'#a8c8cf',fogColor:'#9bbfc4',fogNear:50,fogFar:140,camera:function(T){
        const camera=new T.OrthographicCamera(-19,19,13,-13,.1,180);camera.position.set(26,34,30);camera.lookAt(0,0,0);return camera;
      },
      setup:function(T,ctx){
        const scene=ctx.scene;
        addPlane(T,scene,38,30,'#527b5a');
        const grid=new T.GridHelper(36,12,'#d2e7cb','#8fac9b');grid.position.y=.03;scene.add(grid);
        const rideTypes=[
          {name:'Carousel',cost:150,income:36,color:'#f4a6bf',height:2},
          {name:'Ferris Wheel',cost:280,income:66,color:'#66c9e8',height:6},
          {name:'Coaster',cost:360,income:82,color:'#f6c66b',height:4},
          {name:'Garden',cost:90,income:18,color:'#8de4a5',height:1}
        ];
        let selected=0,cash=1200,visitors=0,rating=1,incomeClock=0,rides=[],score=0;
        const rideGroup=new T.Group();scene.add(rideGroup);
        const guests=[];
        for(let i=0;i<22;i++){
          const guest=addSphere(T,scene,.22,['#f1c47c','#8bd4e4','#e9a3ce'][i%3],(Math.random()-.5)*26,.35,(Math.random()-.5)*20);
          guests.push(guest);
        }
        function hud(){ctx.setHud('primary','CASH','$'+Math.floor(cash));ctx.setHud('secondary','GUESTS',visitors);ctx.setHud('tertiary','RIDES',rides.length+'/10');}
        rideTypes.forEach(function(type,index){
          ctx.addTool(type.name+' $'+type.cost,function(){selected=index;ctx.setHelp('Selected '+type.name+'. Tap or click an empty grid tile to build it.');});
        });
        ctx.setHelp('Build a mix of four attractions and gardens. Every ride adds guests and ticket income. Reach ten attractions and a thriving park balance.');
        const ray=new T.Raycaster(),mouse=new T.Vector2();
        const floorPlane=new T.Plane(new T.Vector3(0,1,0),0),point=new T.Vector3();
        ctx.on(ctx.stage,'pointerdown',function(event){
          const rect=ctx.stage.getBoundingClientRect();mouse.x=((event.clientX-rect.left)/rect.width)*2-1;mouse.y=-((event.clientY-rect.top)/rect.height)*2+1;
          ray.setFromCamera(mouse,ctx.camera);
          if(!ray.ray.intersectPlane(floorPlane,point))return;
          const x=Math.round(point.x/3)*3,z=Math.round(point.z/3)*3;
          if(Math.abs(x)>15||Math.abs(z)>10)return;
          if(rides.some(function(r){return r.x===x&&r.z===z;}))return;
          const type=rideTypes[selected];if(cash<type.cost){ctx.setHelp('Not enough cash for '+type.name+'. Wait for ticket income or choose a smaller attraction.');return;}
          cash-=type.cost;rating=Math.min(5,rating+.18);
          const root=new T.Group();root.position.set(x,0,z);
          const base=boxMesh(T,2.5,.35,2.5,material(T,'#d6e5ed',.8),0,.18,0);root.add(base);
          if(selected===0){
            for(let n=0;n<8;n++){const a=n/8*Math.PI*2;const seat=boxMesh(T,.38,.55,.38,material(T,type.color,.45),Math.cos(a)*.8,1.0,Math.sin(a)*.8);seat.rotation.y=-a;root.add(seat);}
            const pole=boxMesh(T,.25,2,.25,material(T,'#e9eef5',.4),0,1,0);root.add(pole);
          }else if(selected===1){
            const wheel=new T.Mesh(new T.TorusGeometry(1.15,.11,8,30),material(T,type.color,.3,.18));wheel.position.y=3;root.add(wheel);
            const beam=boxMesh(T,.22,5,.22,material(T,'#e8f2fa',.5),0,2.4,0);root.add(beam);
          }else if(selected===2){
            const track=new T.Mesh(new T.TorusGeometry(1.1,.17,8,24),material(T,type.color,.4,.2));track.rotation.x=Math.PI/2;track.position.y=1.7;root.add(track);
            const support=boxMesh(T,.25,3,.25,material(T,'#8b9bab',.6),0,1.5,0);root.add(support);
          }else{
            const tree=new T.Mesh(new T.ConeGeometry(1.1,2.6,7),material(T,type.color,.9));tree.position.y=1.5;root.add(tree);
          }
          rideGroup.add(root);rides.push({x:x,z:z,info:type});
          score+=type.cost;hud();
        });
        function updateHud(){hud();}
        hud();
        ctx.setUpdate(function(dt,elapsed){
          incomeClock+=dt;
          if(incomeClock>=4){
            incomeClock=0;visitors=Math.min(999,visitors+rides.length*2+1);
            const income=rides.reduce(function(sum,r){return sum+r.info.income;},0);
            cash+=income+Math.floor(visitors*.12);rating=Math.min(5,1+rides.length*.35);
            updateHud();
            if(rides.length>=10&&cash>=1800&&visitors>=50&&!ctx.completed){
              ctx.finish(Math.round(cash+visitors*5+rating*100),'Theme park sensation','You built ten attractions, welcomed '+visitors+' guests, and grew the park to $'+Math.floor(cash)+'.');
            }
          }
          guests.forEach(function(g,i){g.position.x+=Math.sin(elapsed*.3+i)*dt*.45;g.position.z+=Math.cos(elapsed*.27+i)*dt*.35;});
        });
      }
    });
  }

  function gameMythicRealms(game) {
    startThreeGame(game, {
      background:'#211d3d',fogColor:'#34345d',fogNear:25,fogFar:105,camera:function(T){
        const camera=new T.PerspectiveCamera(62,1,.1,150);camera.position.set(0,10,17);return camera;
      },
      setup:function(T,ctx){
        const scene=ctx.scene;
        addPlane(T,scene,90,90,'#34465a');
        const skyIslands=[];
        for(let i=0;i<5;i++){
          const island=new T.Mesh(new T.CylinderGeometry(8,5,2,8),material(T,['#52636d','#62516d','#496c66'][i%3],.95));
          island.position.set((i-2)*16,-2,-i*11);scene.add(island);skyIslands.push(island);
        }
        const player=makeAvatar(T,scene,'#9e8bff');player.position.set(0,0,22);
        const runePoints=[[-12,4],[-4,-6],[7,-17],[16,-31],[-8,-39],[0,-51]];
        const runes=[];
        runePoints.forEach(function(p,i){const rune=new T.Mesh(new T.OctahedronGeometry(.62),material(T,['#8bf3ff','#f1a7ff','#f6d17c'][i%3],.2,.2,'#72dfff'));rune.position.set(p[0],1.5,p[1]);scene.add(rune);runes.push(rune);});
        const shrines=[];
        [[-14,-14],[13,-31],[0,-53]].forEach(function(p,i){
          const root=new T.Group();root.position.set(p[0],0,p[1]);
          const base=boxMesh(T,3,.8,3,material(T,'#574c7c',.55),0,.4,0);root.add(base);
          const crystal=new T.Mesh(new T.OctahedronGeometry(1.35),material(T,'#3d506d',.2,.2));crystal.position.y=2;root.add(crystal);
          scene.add(root);shrines.push({root:root,crystal:crystal,active:false});
        });
        const gate=new T.Group();gate.position.set(0,1,-62);scene.add(gate);
        const ring=new T.Mesh(new T.TorusGeometry(2.5,.18,10,38),material(T,'#b6f9ff',.18,.2,'#62edff'));gate.add(ring);
        let collected=0,active=0,score=0,pulse=0;
        const spell=ctx.addTool('Cast pulse ✧',function(){pulse=.45;});
        ctx.addControl('SPELL','enter','spell');
        addTouchMove(ctx);
        ctx.setHud('primary','RUNES','0 / 6');ctx.setHud('secondary','SHRINES','0 / 3');ctx.setHud('tertiary','LEVEL','1');
        ctx.setHelp('Explore the floating valley, gather six runes, then stand beside each shrine and cast a pulse to awaken it. Restore all three shrines to open the sky gate.');
        ctx.setUpdate(function(dt,elapsed){
          const keys=ctx.keys,forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
          const side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
          player.position.x+=side*6.5*dt;player.position.z-=forward*6.5*dt;
          player.position.x=Math.max(-37,Math.min(37,player.position.x));player.position.z=Math.max(-40,Math.min(38,player.position.z));
          runes.forEach(function(r){if(!r.visible)return;r.rotation.y+=dt*1.5;r.position.y=1.5+Math.sin(elapsed*2+r.position.z)*.22;
            if(player.position.distanceTo(r.position)<2.1){r.visible=false;collected++;score+=100;ctx.setHud('primary','RUNES',collected+' / 6');}
          });
          if(ctx.actions.delete('spell'))pulse=.45;
          if(pulse>0){
            pulse-=dt;
            const target=shrines.find(function(s){return !s.active&&player.position.distanceTo(s.root.position)<5;});
            if(target&&pulse>.25&&collected>=2){
              target.active=true;target.crystal.material.color.set('#9ffff0');target.crystal.material.emissive.set('#65f0d0');
              active++;score+=300;ctx.setHud('secondary','SHRINES',active+' / 3');
            }
          }
          shrines.forEach(function(s){s.crystal.rotation.y+=dt*.7;if(s.active)s.crystal.position.y=2+Math.sin(elapsed*2)*.2;});
          ring.rotation.z+=dt*.8;
          ctx.camera.position.lerp(new T.Vector3(player.position.x,player.position.y+9,player.position.z+16),Math.min(1,dt*2.6));
          ctx.camera.lookAt(player.position.x,1,player.position.z-3);
          if(collected===6&&active===3&&player.position.distanceTo(gate.position)<4){ctx.finish(score+500,'The valley is restored','You gathered all six runes and awakened every shrine.');}
        });
      }
    });
  }

  function gameTrailblazer(game) {
    startThreeGame(game, {
      background:'#a5c4d3',fogColor:'#bdd0cc',fogNear:40,fogFar:150,camera:function(T){
        const camera=new T.PerspectiveCamera(60,1,.1,180);camera.position.set(0,24,32);return camera;
      },
      setup:function(T,ctx){
        const scene=ctx.scene;
        addPlane(T,scene,120,120,'#567a52');
        const route=[[0,35],[0,15],[15,0],[22,-15],[5,-32],[-16,-45],[0,-58]];
        const roadGroup=new T.Group();scene.add(roadGroup);
        route.forEach(function(p,i){
          if(i===route.length-1)return;
          const next=route[i+1],dx=next[0]-p[0],dz=next[1]-p[1],len=Math.sqrt(dx*dx+dz*dz);
          const road=boxMesh(T,8,.25,len,material(T,'#505965',.95), (p[0]+next[0])/2,.14,(p[1]+next[1])/2);
          road.rotation.y=Math.atan2(dx,dz);roadGroup.add(road);
          const line=boxMesh(T,.18,.04,len-1,material(T,'#e9e2c9',.8),(p[0]+next[0])/2,.3,(p[1]+next[1])/2);line.rotation.y=road.rotation.y;roadGroup.add(line);
        });
        const truck=makeCar(T,scene,'#f0a84f',true);truck.position.set(0,.2,35);
        const gates=[];
        route.slice(1).forEach(function(p,i){
          const gate=new T.Group();gate.position.set(p[0],1.4,p[1]);
          const ring=new T.Mesh(new T.TorusGeometry(3,.22,10,32),material(T,i%2?'#ffd27b':'#82f0ff',.2,.1,'#79dfff'));ring.rotation.x=Math.PI/2;gate.add(ring);
          scene.add(gate);gates.push({root:gate,ring:ring,index:i,passed:false});
        });
        let checkpoint=0,speed=0,yaw=0,boost=100,time=0,deliveries=0;
        const routeTool=ctx.addTool('Route: Scenic County',function(){ctx.setHelp('Scenic County delivery route: pass the glowing gates in order and make all six stops.');});
        ctx.addControl('↑','w');ctx.addControl('↓','s');ctx.addControl('←','a');ctx.addControl('→','d');ctx.addControl('BOOST','shift');
        ctx.setHud('primary','DELIVERIES','0 / 6');ctx.setHud('secondary','SPEED','0');ctx.setHud('tertiary','BOOST','100%');
        ctx.setHelp('Drive the delivery truck through the glowing gates in order. Make six stops, keep the truck on the route, and use boost for the long stretches.');
        ctx.setUpdate(function(dt,elapsed){
          time+=dt;const keys=ctx.keys;
          const accel=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
          const steer=(keys.has('a')||keys.has('arrowleft')?1:0)-(keys.has('d')||keys.has('arrowright')?1:0);
          const boosting=keys.has('shift')&&boost>0;
          speed+=accel*(boosting?17:12)*dt;speed*=Math.pow(.99,dt*60);speed=Math.max(-4,Math.min(boosting?22:16,speed));
          if(boosting)boost=Math.max(0,boost-27*dt);else boost=Math.min(100,boost+9*dt);
          yaw+=steer*dt*(.8+Math.abs(speed)*.045);
          truck.position.x+=Math.sin(yaw)*speed*dt;truck.position.z-=Math.cos(yaw)*speed*dt;truck.rotation.y=yaw;
          gates.forEach(function(g){
            g.ring.rotation.z+=dt*.5;
            if(!g.passed&&truck.position.distanceTo(g.root.position)<4.2&&checkpoint===g.index){
              g.passed=true;checkpoint++;deliveries++;ctx.setHud('primary','DELIVERIES',deliveries+' / 6');speed+=2;
            }
          });
          ctx.camera.position.lerp(new T.Vector3(truck.position.x-Math.sin(yaw)*9,truck.position.y+18,truck.position.z+Math.cos(yaw)*15),Math.min(1,dt*2.2));
          ctx.camera.lookAt(truck.position.x,0,truck.position.z);
          ctx.setHud('secondary','SPEED',Math.round(Math.abs(speed)*6));ctx.setHud('tertiary','BOOST',Math.round(boost)+'%');
          if(deliveries>=6){ctx.finish(Math.max(100,Math.round(4200-time*10+boost*4)),'Delivery route complete','You completed all six stops in '+Math.round(time)+' seconds.');}
        });
      }
    });
  }

  function gameWildcraft(game) {
    startThreeGame(game, {
      background:'#9fc3b1',fogColor:'#9fc3b1',fogNear:28,fogFar:100,camera:function(T){
        const camera=new T.PerspectiveCamera(62,1,.1,150);camera.position.set(0,10,16);return camera;
      },
      setup:function(T,ctx){
        const scene=ctx.scene;
        addPlane(T,scene,90,90,'#41684e');
        for(let i=0;i<34;i++){
          const x=(Math.random()-.5)*75,z=(Math.random()-.5)*75;
          const trunk=boxMesh(T,.45,2.6,.45,material(T,'#78573d',.95),x,1.3,z);
          const leaves=new T.Mesh(new T.ConeGeometry(1.7,3.9,7),material(T,'#285c45',.9));leaves.position.set(x,4,z);scene.add(trunk,leaves);
        }
        const player=makeAvatar(T,scene,'#d6ca83');player.position.set(0,0,24);
        const nodes=[],counts={wood:0,stone:0,berries:0};
        const defs=[
          ['wood',5,'#c99a62'],['stone',4,'#9daebc'],['berries',3,'#e982aa']
        ];
        defs.forEach(function(def,group){
          for(let i=0;i<def[1]+2;i++){
            const x=(Math.random()-.5)*60,z=(Math.random()-.5)*58-5;
            let mesh;
            if(group===0){mesh=boxMesh(T,.75,1.5,.75,material(T,def[2],.8),x,.75,z);}
            else if(group===1){mesh=new T.Mesh(new T.DodecahedronGeometry(.72),material(T,def[2],.9));mesh.position.set(x,.7,z);scene.add(mesh);}
            else{mesh=addSphere(T,scene,.48,def[2],x,.65,z);}
            if(group===0)scene.add(mesh);
            nodes.push({kind:def[0],mesh:mesh,collected:false});
          }
        });
        const shelter=new T.Group();shelter.visible=false;scene.add(shelter);
        const beacon=new T.Group();beacon.visible=false;beacon.position.set(0,0,-28);scene.add(beacon);
        const beaconCore=new T.Mesh(new T.OctahedronGeometry(1.1),material(T,'#a7f6ff',.2,.2,'#72eaff'));beaconCore.position.y=3;beacon.add(beaconCore);
        let time=180,builtShelter=false,builtBeacon=false;
        function hud(){ctx.setHud('primary','SUPPLIES',counts.wood+'W '+counts.stone+'S '+counts.berries+'B');ctx.setHud('secondary','TIME',Math.ceil(time));ctx.setHud('tertiary','CAMP',builtBeacon?'READY':builtShelter?'SHELTER':'NOT BUILT');}
        const craft=ctx.addTool('Craft shelter',function(){
          if(builtShelter)return;
          if(counts.wood<5||counts.stone<2){ctx.setHelp('A shelter needs 5 wood and 2 stone. Gather supplies from the glowing nodes.');return;}
          counts.wood-=5;counts.stone-=2;builtShelter=true;shelter.visible=true;
          const floor=boxMesh(T,5,.35,4,material(T,'#b88a5d',.9),0,.2,-8);shelter.add(floor);
          const roof=boxMesh(T,5,.3,4,material(T,'#8e684d',.9),0,2.6,-8);shelter.add(roof);
          const postMat=material(T,'#9c764d',.9);
          [[-2,1,-9.5],[2,1,-9.5],[-2,1,-6.5],[2,1,-6.5]].forEach(function(p){shelter.add(boxMesh(T,.25,2,.25,postMat,p[0],p[1],p[2]));});
          hud();ctx.setHelp('Shelter complete! Gather 3 more wood and 2 more berries to build the beacon near the far side of camp.');
        });
        ctx.addTool('Build beacon',function(){
          if(!builtShelter){ctx.setHelp('Build your shelter first.');return;}
          if(builtBeacon)return;
          if(counts.wood<3||counts.berries<2){ctx.setHelp('The beacon needs 3 wood and 2 berries. Explore the forest for more supplies.');return;}
          counts.wood-=3;counts.berries-=2;builtBeacon=true;beacon.visible=true;hud();
        });
        addTouchMove(ctx);
        ctx.setHud('primary','SUPPLIES','0W 0S 0B');ctx.setHud('secondary','TIME','180');ctx.setHud('tertiary','CAMP','NOT BUILT');
        ctx.setHelp('Gather glowing wood, stone, and berries by walking close to them. Craft a shelter with 5 wood and 2 stone, then build the beacon with 3 wood and 2 berries before time runs out.');
        ctx.setUpdate(function(dt,elapsed){
          time=Math.max(0,time-dt);
          const keys=ctx.keys,forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
          const side=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
          player.position.x+=side*6*dt;player.position.z-=forward*6*dt;
          player.position.x=Math.max(-38,Math.min(38,player.position.x));player.position.z=Math.max(-38,Math.min(38,player.position.z));
          nodes.forEach(function(n){if(n.collected)return;
            if(player.position.distanceTo(n.mesh.position)<2.1){n.collected=true;n.mesh.visible=false;counts[n.kind]++;hud();}
          });
          beaconCore.rotation.y+=dt;beaconCore.position.y=3+Math.sin(elapsed*2)*.18;
          ctx.camera.position.lerp(new T.Vector3(player.position.x,player.position.y+9,player.position.z+16),Math.min(1,dt*2.4));
          ctx.camera.lookAt(player.position.x,1,player.position.z-3);
          if(builtBeacon&&player.position.distanceTo(beacon.position)<4){ctx.finish(counts.wood*20+counts.stone*25+counts.berries*15+Math.round(time*8),'Camp established','You crafted a shelter and powered the wilderness beacon with '+Math.ceil(time)+' seconds remaining.');}
          if(time<=0&&!builtBeacon){ctx.finish(0,'The day is over','You gathered supplies, but the beacon was not ready before nightfall.');}
        });
      }
    });
  }

  global.gameNeonStrike = gameNeonStrike;
  global.gameGravityRush = gameGravityRush;
  global.gameVelocityX = gameVelocityX;
  global.gameWildlands = gameWildlands;
  global.gameParkEmpire = gameParkEmpire;
  global.gameMythicRealms = gameMythicRealms;
  global.gameTrailblazer = gameTrailblazer;
  global.gameWildcraft = gameWildcraft;

  const previousRunGame = global.runGame;
  global.runGame = function (game) {
    const launchers = {
      'neon-strike':global.gameNeonStrike,
      'gravity-rush':global.gameGravityRush,
      'velocity-x':global.gameVelocityX,
      'wildlands':global.gameWildlands,
      'park-empire':global.gameParkEmpire,
      'mythic-realms':global.gameMythicRealms,
      'trailblazer':global.gameTrailblazer,
      'wildcraft':global.gameWildcraft
    };
    if(launchers[game.engine]){
      if(typeof cleanup==='function')cleanup();
      cleanup=function(){};
      if(keyHandler)global.removeEventListener('keydown',keyHandler);
      keyHandler=null;
      launchers[game.engine](game);
      return;
    }
    previousRunGame(game);
  };

  const previousFilteredGames = global.filteredGames;
  global.filteredGames = function () {
    if(activeFilter==='3D Games'){
      let list=games.filter(function(g){return g.is3D&&(g.name+' '+g.desc+' '+g.category).toLowerCase().includes(searchText);});
      if(sortMode==='az')list.sort(function(a,b){return a.name.localeCompare(b.name);});
      return list;
    }
    return previousFilteredGames();
  };

  const genres=[
    ['RPG & Fantasy','🧙 RPG & Fantasy'],
    ['Vehicle Simulation','🚚 Vehicle Sim'],
    ['Survival & Crafting','🌲 Survival']
  ];
  const previousRenderChips=global.renderChips;
  global.renderChips=function(){
    previousRenderChips();
    genres.forEach(function(entry){
      const chip=document.createElement('button');
      chip.className='chip v11-genre-chip'+(activeFilter===entry[0]?' active':'');
      chip.dataset.filter=entry[0];chip.textContent=entry[1];
      $('chips').appendChild(chip);
    });
  };
  const previousSetFilter=global.setFilter;
  global.setFilter=function(filter){
    if(filter==='3D Games'||genres.some(function(entry){return entry[0]===filter;})){
      activeFilter=filter;global.render();$('games').scrollIntoView({behavior:'smooth',block:'start'});return;
    }
    previousSetFilter(filter);
  };

  function addV11Navigation(){
    const sidebar=document.querySelector('.sidebar');if(!sidebar)return;
    genres.forEach(function(entry){
      if(sidebar.querySelector('[data-filter="'+entry[0]+'"]'))return;
      const button=document.createElement('button');button.className='navbtn';
      button.dataset.filter=entry[0];button.textContent=entry[1];
      sidebar.insertBefore(button,sidebar.querySelector('.side-note'));
    });
  }
  const previousRender=global.render;
  global.render=function(){
    previousRender();
    addV11Navigation();
    const note=document.getElementById('v11UniverseNote');
    if(!note){
      const showcase=document.getElementById('threeDShowcase');
      if(showcase){
        const n=document.createElement('div');n.className='v11-universe-note';n.id='v11UniverseNote';
        n.innerHTML='<strong>V11 · 3D Universe</strong><span>Eight original 3D worlds across action, racing, exploration, fantasy RPG, vehicle simulation, and survival crafting.</span>';
        showcase.appendChild(n);
      }
    }
    const eyebrow=document.querySelector('.hero .eyebrow');
    const title=document.querySelector('.hero h1');
    const copy=document.querySelector('.hero-copy p');
    if(eyebrow)eyebrow.innerHTML='<span class="pulse"></span> V11 · THE 3D UNIVERSE';
    if(title)title.innerHTML='More worlds.<br><span class="gradient">More ways to play.</span>';
    if(copy)copy.textContent='Eight original 3D experiences now lead the arcade, from fantasy quests and vehicle careers to creative survival worlds. Your classic favorites are still here.';
    const stats=document.querySelectorAll('.stats .stat');
    if(stats[1])stats[1].innerHTML='<strong>35</strong> playable game engines';
    if(stats[2])stats[2].innerHTML='<strong>8</strong> original 3D games';
    const search=document.getElementById('search');if(search)search.placeholder='Search 203 games…';
    const count=document.getElementById('allCount');if(count)count.textContent=String(games.length);
    if(activeFilter==='3D Games'){
      const h=document.getElementById('sectionTitle'),s=document.getElementById('sectionSub');
      if(h)h.textContent='Explore the 3D universe';
      if(s)s.textContent='Eight playable 3D worlds, with more genres and deeper game loops.';
    }else if(genres.some(function(entry){return entry[0]===activeFilter;})){
      const h=document.getElementById('sectionTitle'),s=document.getElementById('sectionSub');
      if(h)h.textContent=activeFilter;
      if(s)s.textContent='Original 3D games in the '+activeFilter.toLowerCase()+' collection.';
    }
    const chips=document.querySelectorAll('.v11-genre-chip');
    chips.forEach(function(chip){chip.classList.toggle('active',chip.dataset.filter===activeFilter);});
  };
  addV11Navigation();
  global.render();
})(window);
