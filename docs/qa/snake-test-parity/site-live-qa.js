async page => {
 const response=await page.request.get('http://127.0.0.1:8775/docs/qa/snake-test-parity/site-candidate-qa.js');
 const run=eval('('+await response.text()+')');
 return run(page,{live:true,runtime:'snake-next-6822599860b1'});
}
