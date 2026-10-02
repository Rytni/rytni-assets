/** Presentation-only bounded dead-zone follow; fixed option fits entire arena. */
export class Camera {
  constructor(){this.x=0;this.y=0;this.ready=false;this.fixed=false;}
  update(head,width,height,cssWidth,cssHeight,dt,reset=false){
    this.scale=this.fixed?Math.min(cssWidth/width,cssHeight/height):Math.max(12,Math.min(cssWidth/38,cssHeight/22));
    const halfW=cssWidth/this.scale/2,halfH=cssHeight/this.scale/2;
    const clamp=(v,max,half)=>max<=half*2?max/2:Math.max(half,Math.min(max-half,v));
    const targetX=this.fixed?width/2:head.x+head.dx*3,targetY=this.fixed?height/2:head.y+head.dy*3;
    if(reset||!this.ready){this.x=clamp(targetX,width,halfW);this.y=clamp(targetY,height,halfH);this.ready=true;}
    else {
      const k=1-Math.exp(-Math.min(.05,dt)*7),zone=1.5;
      if(Math.abs(targetX-this.x)>zone)this.x+=(targetX-this.x-Math.sign(targetX-this.x)*zone)*k;
      if(Math.abs(targetY-this.y)>zone)this.y+=(targetY-this.y-Math.sign(targetY-this.y)*zone)*k;
      this.x=clamp(this.x,width,halfW);this.y=clamp(this.y,height,halfH);
    }
  }
}
