console.log('start...');
console.log('now time: ' + Date(/\d{10,10}/.exec(Date.now())));
function sleep(sleepTime) {
       for(var start = Date.now(); Date.now() - start <= sleepTime; ) { }
}
sleep(5000); // sleep 5 seconds
console.log('end...');
console.log('end time: ' + Date(/\d{10,10}/.exec(Date.now())));
