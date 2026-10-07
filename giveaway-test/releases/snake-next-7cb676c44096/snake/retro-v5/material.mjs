export function hash(n){let x=Math.imul(n+1,2654435761);x=Math.imul(x^(x>>>16),2246822519);return(x^(x>>>13))>>>0}
export function variant(id) {
  const n=hash(id);
  // Non-periodic local-minimum anchors: spacing >=3 material cells, mean ~5.
  // No fixed every-N interval; stable id semantics are unchanged.
  const anchor=[-2,-1,1,2].every(offset=>n<hash(id+offset));
  return anchor?(n%97===0?7:n%2?5:6):(n>>>8)%5;
}
