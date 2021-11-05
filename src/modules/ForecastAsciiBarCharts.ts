import { Lazy } from 'https://deno.land/x/lazy@v1.7.3/lib/mod.ts';


interface ForecastBarItem {
    ct: number
    p: number
    pSum: number
}


export function Plot(barItem: ForecastBarItem[]) {
    const data: BarchartItem[] = [];
    for(const v of barItem) {
        const ctText = v.ct.toString().padStart(5)
        const pText = (100*v.p).toFixed(1).padStart(5) + "%"
        const pSumText = (100*v.pSum).toFixed(1).padStart(5) + "%"

        data.push({xLabel: `${ctText} ${pSumText}`, y: 100*v.p, yLabel: pText});
    }

    console.log("--- FORECAST ---");
    console.log(DrawChart(data, true))
}


// adapted from: https://github.com/morishin/ascii-horizontal-barchart

interface BarchartItem {
    xLabel: string,
    y: number,
    yLabel: string
}

function DrawChart (data: BarchartItem[] , showValue = false, maxBarLength = 100) {
    const maxValue = Lazy.from(data).max(x => x.y);
    const maxKeyNameLength = Lazy.from(data).max(x => x.xLabel.length);
    return Lazy.from(data).select(item => {
        const xLabel = item.xLabel.padStart(maxKeyNameLength);
        const bar = DrawBar(item.y, maxValue, maxBarLength);
        const yLabel = showValue ? item.yLabel : "";
        return xLabel + " " + bar + yLabel;
    }).toArray().join('\n');
}

function DrawBar (value: number, maxValue: number, maxBarLength: number) {
    const fractions = ['▏', '▎', '▍', '▋', '▊', '▉'];
    const barLength = value * maxBarLength / maxValue;
    const wholeNumberPart = Math.floor(barLength);
    const fractionalPart = barLength - wholeNumberPart;
    let bar = fractions[fractions.length - 1].repeat(wholeNumberPart);
    if (fractionalPart > 0)
        bar += fractions[Math.floor(fractionalPart * fractions.length)];
    return bar;
}