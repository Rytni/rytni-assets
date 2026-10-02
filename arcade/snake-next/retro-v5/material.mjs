export function hash(n){let x=Math.imul(n+1,2654435761);x=Math.imul(x^(x>>>16),2246822519);return(x^(x>>>13))>>>0}
export function variant(id) {const n=hash(id),p=n%100;return p<7?5:p<11?6:p===11?7:(n>>>8)%5;}
