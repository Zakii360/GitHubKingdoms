
let game, player, cursors;
window.playerName='';

document.getElementById('joinBtn').onclick=()=>{
 window.playerName=document.getElementById('username').value || 'guest';
 startGame();
 setupRealtime();
};

function startGame(){
 if(game) return;

 game=new Phaser.Game({
  type:Phaser.AUTO,
  width:1280,
  height:720,
  parent:'game',
  scene:{
   create(){
    const g=this.add.graphics();
    for(let x=0;x<50;x++){
      for(let y=0;y<50;y++){
        g.fillStyle((x+y)%2?0x2d5a27:0x35682d,1);
        g.fillRect(x*32,y*32,32,32);
      }
    }

    player=this.add.rectangle(200,200,24,24,0x4da6ff);
    this.nameTag=this.add.text(180,170,window.playerName,{fontSize:'14px'});

    this.cameras.main.startFollow(player);
    cursors=this.input.keyboard.createCursorKeys();
   },

   update(){
    const speed=3;
    if(cursors.left.isDown) player.x-=speed;
    if(cursors.right.isDown) player.x+=speed;
    if(cursors.up.isDown) player.y-=speed;
    if(cursors.down.isDown) player.y+=speed;
   }
  }
 });
}
