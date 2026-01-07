import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const START_DATE = new Date('2024-01-01');
const END_DATE = new Date('2025-12-31');
const OUTPUT_FILE = path.join(__dirname, '../public/test-data-sample.json');

const CATEGORIES = {
    development: { rate: 1500 },
    design: { rate: 1200 },
    consulting: { rate: 1400 },
    teaching: { rate: 800 },
    management: { rate: 1300 },
    marketing: { rate: 600 },
    remix: { rate: 500 },
    other: { rate: 1000 }
};

const WEEKDAY_CATS = ['development', 'design', 'consulting', 'management', 'teaching', 'marketing'];
const WEEKEND_CATS = ['remix', 'other', 'design']; 

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function generateEntries() {
    const entries = [];
    let currentDate = new Date(START_DATE);

    while (currentDate <= END_DATE) {
        const dateStr = formatDate(currentDate);
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        // Fewer entries on weekends
        const numEntries = isWeekend ? getRandomInt(0, 2) : getRandomInt(2, 6);

        // Start work-day somewhere between 8:00 and 11:00
        let currentHour = 8 + getRandomInt(0, 3);
        let currentMinute = getRandomInt(0, 59);
        
        // Base timestamp for this day
        let baseTime = currentDate.getTime();

        for (let i = 0; i < numEntries; i++) {
            // Pick category
            const cats = isWeekend ? WEEKEND_CATS : WEEKDAY_CATS;
            const categoryId = cats[getRandomInt(0, cats.length - 1)];
            const rate = CATEGORIES[categoryId].rate;

            // Duration: 30m to ~3.5h
            const durationMinutes = getRandomInt(30, 210);
            
            // Calculate end time
            let endTotalMinutes = (currentHour * 60) + currentMinute + durationMinutes;
            let endHour = Math.floor(endTotalMinutes / 60);
            let endMinute = endTotalMinutes % 60;

            if (endHour >= 23) break; // Stop if it gets too late

            // Format times
            const startStr = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
            const endStr = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

            // Generate ID: Use day timestamp + index offset to emulate original file logic
            // Added random small jitter to ensure uniqueness if needed, but sequential is fine too.
            const id = (baseTime + (i * 1000)).toString();

            // Earned
            const durationHours = durationMinutes / 60;
            const earned = Math.round(durationHours * rate);

            // Tech/Break details
            const entry = {
                id,
                date: dateStr,
                start: startStr,
                end: endStr,
                categoryId,
                rate,
                earned
            };

            // Randomly add break info
            if (Math.random() > 0.4) {
                if (Math.random() > 0.5) {
                    entry.breakMinutes = getRandomInt(5, 45);
                } else {
                     const breakH = 0;
                     const breakM = getRandomInt(15, 50);
                     entry.breakAfter = `${String(breakH).padStart(2, '0')}:${String(breakM).padStart(2, '0')}`;
                }
            }

            entries.push(entry);

            // Prepare next start time (add current duration + random gap)
            const gap = getRandomInt(10, 60); 
            let nextStartTotalMinutes = endTotalMinutes + gap;
            currentHour = Math.floor(nextStartTotalMinutes / 60);
            currentMinute = nextStartTotalMinutes % 60;
            
            if (currentHour >= 22) break; 
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }
    return { entries };
}

console.log("Generating data...");
const data = generateEntries();
if (!fs.existsSync(path.dirname(OUTPUT_FILE))) {
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
}
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
console.log(`Success! Generated ${data.entries.length} entries from ${START_DATE.toISOString().split('T')[0]} to ${END_DATE.toISOString().split('T')[0]}.`);
console.log(`File saved to: ${OUTPUT_FILE}`);
