// Presentation only: no stepped canvas clipping through the authored corners.
export function installProductShell(game){
 game.renderer.canvas.style.clipPath='none';
 return game.root;
}
