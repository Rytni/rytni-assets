// Presentation only: one cabinet, no lower data rail or extra clock.
export function installProductShell(game){
 const render=game.render.bind(game),canvas=game.renderer.canvas;
 game.render=()=>{render();const l=game.renderer.last;if(!l||!canvas)return;
  const c=l.cabinet,bottom=c.y+c.h,strip=bottom-38*l.scale,left=c.x+128*l.scale,right=c.x+c.w-128*l.scale;
  // Expose ambient environment through the approved bottom source's empty
  // center padding, while preserving both ornate corner canvases.
  canvas.style.clipPath=`polygon(0 0,100% 0,100% ${bottom}px,${right}px ${bottom}px,${right}px ${strip}px,${left}px ${strip}px,${left}px ${bottom}px,0 ${bottom}px)`;
 };
 return game.root;
}
