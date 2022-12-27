
/**
 * Генерация случайного числа в между двумя числами включительно
 * @param min
 * @param max
 */
export function mRandomInteger(min: number, max: number): number {
    // случайное число от min до (max+1)
    const rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

export function toNumberArray(input: any[]) {
    const a: number[] = [];
    if (input && input.length) {
        for (let i = 0; i < input.length; i++) {
            let iVal = NaN;
            if (input[i] || input[i] === 0) {
                iVal = Number(input[i]);
            }

            if (iVal || iVal === 0) {
                a.push(iVal);
            }
        }
    }
    return a;
}
