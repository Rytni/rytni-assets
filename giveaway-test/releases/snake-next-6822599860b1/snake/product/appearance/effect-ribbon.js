import {RibbonSprites} from '../../forest-training/ribbon-sprites.js';
import {EffectMaterial} from './material.js';

/** Product-only material owner. Geometry, sources and draw stay in V4. */
export class EffectRibbonSprites extends RibbonSprites {
 constructor(art){super(art);this.material=new EffectMaterial();this.raster.painter=this.material.painter;this.materialKey='';}
 setSession(session,options){
  if(this.material.setSession(session,options)){this.key=null;this.materialKey=this.material.key;}
  return this;
 }
}
