
const aTest:number[] = [];
const ixTest:number[] = [];
for (let i = 0; i < 1000000; i++) {
    aTest.push(i)
    ixTest[i] = i;
    
}


console.time('t')
for (let i = 0; i < 1000; i++) {
    const a = aTest;
    for (let i = 0; i < a.length; i++) {
        a[i]++;
        
    }
}
console.timeEnd('t')

console.time('t1')
for (let i = 0; i < 20; i++) {
    // const a = Object.keys(ixTest);

    for (const key in ixTest) {
        ixTest[key]++;
    }
    // for (let i = 0; i < a.length; i++) {
    //     // a[i]++;
        
    // }
}
console.timeEnd('t1')