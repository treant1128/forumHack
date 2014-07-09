function roll(intervalMin, intervalMax){
 return intervalMin + Math.ceil(Math.random() * (intervalMax - intervalMin));
}

console.log(roll(30, 60));

