const x = [1,2,3]

for(let i=1; i<10; i += 1) {
    var r = Math.floor(Math.random() * (x.length));
    console.log(`${r}: ${x[r]}`)
}