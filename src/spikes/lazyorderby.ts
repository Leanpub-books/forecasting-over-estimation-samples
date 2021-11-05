import { Lazy } from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';

const x = [7, 1, 4, 10, 9, 11, 3, 9, 1, 22]

const s = Lazy.from(x).distinct().toArray().sort((n1,n2) => n1 - n2);

for(const v of s)
    console.log(v)