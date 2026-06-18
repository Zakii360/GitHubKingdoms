
let playerName='';
document.getElementById('joinBtn').onclick=()=>{
 playerName=document.getElementById('username').value||'guest';
 startGame();
};

function startGame(){
 const scene={
  preload(){},
  create(){
   this.player=this.add.rectangle(100,100,24,24,0x00ff00);
   this.cursors=this.input.keyboard.createCursorKeys();
   this.add.text(10,10,'GitHub Kingdoms RPG Prototype');
  },
  update(){
   if(this.cursors.left.isDown)this.player.x-=2;
   if(this.cursors.right.isDown)this.player.x+=2;
   if(this.cursors.up.isDown)this.player.y-=2;
   if(this.cursors.down.isDown)this.player.y+=2;
  }
 };
 new Phaser.Game({type:Phaser.AUTO,width:960,height:540,parent:'game',scene});
}
