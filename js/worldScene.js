import { CONFIG } from "./config.js";
import { state } from "./state.js";
import { pushPlayerPosition, fetchPlayers } from "./supabaseClient.js";
import { kingdomFlavor } from "./kingdom.js";

const tile = CONFIG.TILE;

function makePlayerTexture(scene, key, body="#7fb4ff", trim="#1f2f57") {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x:0, y:0, add:false });
  g.fillStyle(0x000000, 0);
  g.fillRect(0,0,16,16);
  g.fillStyle(parseInt(body.replace("#","0x")),1);
  g.fillRect(4,3,8,8);
  g.fillRect(5,11,2,3);
  g.fillRect(9,11,2,3);
  g.fillStyle(parseInt(trim.replace("#","0x")),1);
  g.fillRect(4,2,8,2);
  g.fillRect(6,5,1,1);
  g.fillRect(9,5,1,1);
  g.generateTexture(key,16,16);
  g.destroy();
}

function makeWorldTextures(scene) {
  if (scene.textures.exists("grass")) return;
  const tex = [
    ["grass",0x4b7a4d,0x3d6b43],
    ["path",0x9b7c52,0x826746],
    ["water",0x346aa0,0x295785],
    ["stone",0x9fa4b7,0x858aa0],
    ["roof",0x8b4d4d,0x6b3939],
    ["wood",0x7d5a38,0x5f4329],
    ["tree",0x2f5f34,0x214826],
    ["sign",0xb38d55,0x6d512f],
  ];
  for (const [key,a,b] of tex) {
    const g = scene.make.graphics({x:0,y:0,add:false});
    g.fillStyle(a,1); g.fillRect(0,0,16,16);
    g.fillStyle(b,1);
    for (let y=0;y<16;y+=4) for (let x=(y%8===0?0:2);x<16;x+=4) g.fillRect(x,y,2,2);
    g.generateTexture(key,16,16); g.destroy();
  }
}

export class WorldScene extends Phaser.Scene {
  constructor() { super("world"); }
  preload() {}
  async create() {
    state.worldScene = this;
    makeWorldTextures(this);
    makePlayerTexture(this, "me", "#b8d0ff", "#304e8d");
    makePlayerTexture(this, "other", "#ffd37a", "#7f5d19");
    this.cameras.main.setRoundPixels(true);
    this.physics.world.setBounds(0,0,CONFIG.WORLD_WIDTH*tile,CONFIG.WORLD_HEIGHT*tile);

    this.buildMap();
    this.buildKingdomPlots();

    const me = state.me;
    this.player = this.physics.add.sprite(me.x*tile, me.y*tile, "me").setOrigin(.5,.5);
    this.player.body.setSize(10,12).setOffset(3,3);
    this.player.setDepth(1000);
    this.playerName = this.add.text(this.player.x, this.player.y-18, state.githubProfile.login, {
      fontFamily:"monospace", fontSize:"12px", color:"#ffffff", stroke:"#000000", strokeThickness:3
    }).setOrigin(.5).setDepth(1001);

    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    this.cameras.main.setZoom(CONFIG.SCALE);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,E,ENTER");
    this.otherSprites = new Map();

    await this.refreshPlayers();
    this.time.addEvent({ delay: 2500, loop: true, callback: () => this.refreshPlayers() });
    this.time.addEvent({ delay: 120, loop: true, callback: () => this.syncPresence() });

    this.keys.E.on("down", () => this.tryInspectKingdom());
  }

  buildMap() {
    const w = CONFIG.WORLD_WIDTH, h = CONFIG.WORLD_HEIGHT;
    this.ground = this.add.group();
    for (let y=0;y<h;y++) {
      for (let x=0;x<w;x++) {
        let key = "grass";
        if (x < 5 || y < 5 || x > w-6 || y > h-6) key = "water";
        if (y === 40 && x > 8 && x < w-8) key = "path";
        if (x === 60 && y > 8 && y < h-8) key = "path";
        this.add.image(x*tile, y*tile, key).setOrigin(0).setDepth(0);
      }
    }
    for (let i=0;i<40;i++){
      const tx = 8 + (i*7)%100, ty = 10 + (i*11)%55;
      if (Math.abs(ty-40) < 3 || Math.abs(tx-60) < 3) continue;
      this.add.image(tx*tile, ty*tile, "tree").setOrigin(0).setDepth(30);
    }
  }

  buildKingdomPlots() {
    const signs = [
      {x:22,y:18,label:"Starter Kingdom Plaza"},
      {x:44,y:24,label:"JavaScript Quarter"},
      {x:78,y:18,label:"Forge District"},
      {x:92,y:50,label:"Scholar Garden"},
      {x:28,y:56,label:"Harbor Ward"},
    ];
    this.kingdomSigns = signs;
    for (const s of signs) {
      this.add.image(s.x*tile, s.y*tile, "sign").setOrigin(0).setDepth(40);
      this.add.text(s.x*tile-8, s.y*tile-10, s.label, {
        fontFamily:"monospace", fontSize:"10px", color:"#fff", stroke:"#000", strokeThickness:3
      }).setDepth(41);
      this.drawHouse(s.x+2, s.y-2);
    }
  }

  drawHouse(x,y) {
    this.add.image(x*tile, y*tile, "wood").setOrigin(0).setDepth(20);
    this.add.image((x+1)*tile, y*tile, "wood").setOrigin(0).setDepth(20);
    this.add.image(x*tile, (y+1)*tile, "stone").setOrigin(0).setDepth(20);
    this.add.image((x+1)*tile, (y+1)*tile, "stone").setOrigin(0).setDepth(20);
    this.add.image(x*tile, (y-1)*tile, "roof").setOrigin(0).setDepth(19);
    this.add.image((x+1)*tile, (y-1)*tile, "roof").setOrigin(0).setDepth(19);
  }

  update() {
    if (!this.player) return;
    const speed = CONFIG.PLAYER_SPEED;
    let vx = 0, vy = 0, dir = "down";
    if (this.cursors.left.isDown || this.keys.A.isDown) { vx = -speed; dir="left"; }
    else if (this.cursors.right.isDown || this.keys.D.isDown) { vx = speed; dir="right"; }
    if (this.cursors.up.isDown || this.keys.W.isDown) { vy = -speed; dir="up"; }
    else if (this.cursors.down.isDown || this.keys.S.isDown) { vy = speed; dir="down"; }
    this.player.body.setVelocity(vx, vy);
    if (vx && vy) this.player.body.velocity.normalize().scale(speed);
    this.dir = dir;

    this.playerName.setPosition(this.player.x, this.player.y-18);
  }

  async syncPresence() {
    if (!state.user || !this.player) return;
    const tx = Math.round(this.player.x / tile), ty = Math.round(this.player.y / tile);
    if (state.lastKnownTile && state.lastKnownTile.x === tx && state.lastKnownTile.y === ty && this.dir === state.lastKnownTile.dir) return;
    state.lastKnownTile = { x:tx, y:ty, dir:this.dir||"down" };
    state.me.x = tx; state.me.y = ty; state.me.dir = this.dir || "down";
    await pushPlayerPosition({ x:tx, y:ty, dir:this.dir || "down" });
  }

  async refreshPlayers() {
    const rows = await fetchPlayers();
    const mine = state.user.id;
    const alive = new Set();
    for (const p of rows) {
      if (p.user_id === mine) continue;
      alive.add(p.user_id);
      let entry = this.otherSprites.get(p.user_id);
      if (!entry) {
        const sprite = this.add.sprite(p.x*tile, p.y*tile, "other").setDepth(900);
        const name = this.add.text(sprite.x, sprite.y-18, p.github_username, {
          fontFamily:"monospace", fontSize:"12px", color:"#fff", stroke:"#000", strokeThickness:3
        }).setOrigin(.5).setDepth(901);
        entry = { sprite, name };
        this.otherSprites.set(p.user_id, entry);
      }
      entry.sprite.setPosition(p.x*tile, p.y*tile);
      entry.name.setPosition(p.x*tile, p.y*tile-18);
    }
    for (const [id, entry] of [...this.otherSprites.entries()]) {
      if (!alive.has(id)) {
        entry.sprite.destroy(); entry.name.destroy();
        this.otherSprites.delete(id);
      }
    }
  }

  tryInspectKingdom() {
    const tx = Math.round(this.player.x / tile), ty = Math.round(this.player.y / tile);
    const near = this.kingdomSigns.find(s => Math.abs(s.x - tx) <= 2 && Math.abs(s.y - ty) <= 2);
    if (!near) return;
    const panel = document.getElementById("kingdom-panel");
    panel.style.display = "block";
    panel.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
        <div><div style="font-weight:900;font-size:20px">${state.kingdom.display_name}'s Kingdom</div>
        <div style="color:#93a4c9;font-size:13px">${near.label}</div></div>
        <button id="close-kingdom" class="ghost">Close</button>
      </div>
      <div style="margin-top:10px;line-height:1.6">${kingdomFlavor(state.kingdom)}</div>
      <div class="list">
        <div><span class="pill">${state.kingdom.rank}</span><span class="pill">${state.kingdom.biome}</span><span class="pill">${state.kingdom.stars_total} stars</span></div>
        <div><b>Followers:</b> ${state.kingdom.followers} · <b>Repos:</b> ${state.kingdom.repo_count} · <b>Castle level:</b> ${state.kingdom.castle_level}</div>
        <div><b>Top languages:</b> ${(state.kingdom.top_languages || []).map(l=>l.name).join(", ") || "Unknown"}</div>
      </div>`;
    document.getElementById("close-kingdom").onclick = () => panel.style.display = "none";
  }
}
