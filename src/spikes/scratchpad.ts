var dayOfWeek = 0;
for(var i=1; i<=10; i+=1) {
    console.log(`${i}. ${dayOfWeek}`)
    dayOfWeek = (dayOfWeek + 1) % 7;
}