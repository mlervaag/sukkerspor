import { styleText } from 'util';

// Simple seeded RNG (Linear Congruential Generator)
class RNG {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    nextRange(min, max) {
        return min + this.next() * (max - min);
    }
    nextInt(min, max) {
        return Math.floor(this.nextRange(min, max + 1));
    }
    pick(array) {
        return array[this.nextInt(0, array.length - 1)];
    }
}

const args = process.argv.slice(2).reduce((acc, arg) => {
    if (arg.startsWith('--')) {
        const [key, val] = arg.slice(2).split('=');
        acc[key] = val === undefined ? true : val;
    }
    return acc;
}, {});

const BASE_URL = args.base || 'http://localhost:3000';
const DAYS = parseInt(args.days || '14', 10);
const SEED = parseInt(args.seed || '1', 10);
const NO_CLEANUP = args['no-cleanup'] === true; // Note: flag is --no-cleanup
const PASSWORD = args.password || process.env.APP_PASSWORD;

if (!PASSWORD) {
    console.error('Error: No password provided. Use --password=... or set APP_PASSWORD env var.');
    process.exit(1);
}

const rng = new RNG(SEED);
let cookie = '';

async function login() {
    console.log(`Logging in to ${BASE_URL}...`);
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: PASSWORD })
    });

    if (!res.ok) {
        console.error('Login failed:', res.status, await res.text());
        return false;
    }

    const setCookie = res.headers.get('set-cookie');
    if (!setCookie) {
        console.error('Login successful but no Set-Cookie header received.');
        return false;
    }

    // Extract relevant part
    cookie = setCookie.split(';')[0];
    console.log('Login PASS.');
    return true;
}

const FOODS = ['Pizza', 'Pasta', 'Grovbrød med ost', 'Yoghurt og müsli', 'Taco', 'Salat med kylling', 'Havregrøt', 'Eple og nøtter', 'Fiskekaker', 'Laks med grønnsaker'];
const MEALS = ['Frokost', 'Lunsj', 'Middag', 'Kvelds', 'Mellommåltid'];

async function generateReadings() {
    const createdIds = [];
    const now = new Date();

    // Generate dates: today, yesterday, ... back to DAYS
    // We want realistic timeline.

    for (let d = 0; d < DAYS; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);

        // 0-3 readings per day
        // Weighted: 0 (10%), 1 (30%), 2 (40%), 3 (20%)
        const r = rng.next();
        let numReadings = 0;
        if (r < 0.1) numReadings = 0;
        else if (r < 0.4) numReadings = 1;
        else if (r < 0.8) numReadings = 2;
        else numReadings = 3;

        // Force at least some readings if total is low? No, purely random per day is fine.

        // Generate possible slots
        const slots = [
            { type: 'fasting', hour: 7, min: 30, isFasting: true, isPostMeal: false },
            { type: 'post-breakfast', hour: 9, min: 30, meal: 'Frokost', isFasting: false, isPostMeal: true },
            { type: 'post-lunch', hour: 13, min: 0, meal: 'Lunsj', isFasting: false, isPostMeal: true },
            { type: 'post-dinner', hour: 18, min: 0, meal: 'Middag', isFasting: false, isPostMeal: true },
            { type: 'evening', hour: 21, min: 0, meal: 'Kvelds', isFasting: false, isPostMeal: true },
        ];

        // Shuffle slots and pick N
        for (let i = slots.length - 1; i > 0; i--) {
            const j = rng.nextInt(0, i);
            [slots[i], slots[j]] = [slots[j], slots[i]];
        }
        const dailyReadings = slots.slice(0, numReadings);

        // Sort by time
        dailyReadings.sort((a, b) => a.hour - b.hour);

        for (const slot of dailyReadings) {
            // Jitter time
            const hour = slot.hour;
            const min = slot.min + rng.nextInt(-30, 30);

            const mDate = new Date(date);
            mDate.setHours(hour, min, 0, 0);

            let value = 0;
            if (slot.isFasting) {
                // 4.5 - 5.6 typical, spike chance 10%
                if (rng.next() < 0.1) value = rng.nextRange(5.7, 7.5);
                else value = rng.nextRange(4.5, 5.5);
            } else {
                // 5.5 - 7.2 typical, spike chance 15%
                if (rng.next() < 0.15) value = rng.nextRange(7.3, 11.5);
                else value = rng.nextRange(5.0, 7.0);
            }

            const payload = {
                valueMmolL: value.toFixed(1),
                measuredAt: mDate.toISOString(),
                isFasting: slot.isFasting,
                isPostMeal: slot.isPostMeal,
                mealType: slot.isPostMeal ? (slot.meal || rng.pick(MEALS)) : null,
                foodText: slot.isPostMeal ? rng.pick(FOODS) : null,
                feelingNotes: rng.next() < 0.1 ? "Følte meg litt slapp" : null,
            };

            // Post it
            const res = await fetch(`${BASE_URL}/api/readings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': cookie
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const json = await res.json();
                createdIds.push(json.id);
                process.stdout.write('.');
            } else {
                process.stdout.write('x');
            }
        }
    }

    console.log(`\nCreated ${createdIds.length} readings over ${DAYS} days.`);

    if (!args['no-cleanup']) {
        console.log('Cleaning up...');
        for (const id of createdIds) {
            await fetch(`${BASE_URL}/api/readings/${id}`, {
                method: 'DELETE',
                headers: { 'Cookie': cookie }
            });
        }
        console.log('Cleaned up.');
    } else {
        console.log('Skipping cleanup (--no-cleanup set).');
    }
}

(async () => {
    try {
        if (await login()) {
            await generateReadings();
            process.exit(0);
        } else {
            process.exit(1);
        }
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
