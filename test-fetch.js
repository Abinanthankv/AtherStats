import fs from 'fs';
import Papa from 'papaparse';

async function testFetchAndTransform() {
    const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQXi4_Jia_H5rnneAzuP7OMz_3kPbpmgx0wyEQyX4vE7hxWJQrYFzWdrxQlmv2OnqFcScC8jDNylLU2/pub?gid=1544737032&single=true&output=csv'
    try {
        console.log('Fetching:', url);
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log('Status:', res.status, res.statusText);
        const csvText = await res.text();

        // Write raw CSV to file for validation
        fs.writeFileSync('check.csv', csvText);
        console.log('Saved raw data to check.csv');

        // Parse and Transform (Syncing with dataFetcher.js logic)
        const results = Papa.parse(csvText, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true
        });

        const transformedData = results.data.map((row, index) => {
            const modes = {
                'Eco': row.eco_mode_distance_m || 0,
                'SmartEco': row.smart_eco_mode_distance_m || 0,
                'Ride': row.ride_mode_distance_m || 0,
                'Sport': row.sport_mode_distance_m || 0,
                'Warp': row.warp_mode_distance_m || 0,
                'WarpPlus': row.warp_plus_mode_distance_m || 0,
                'Zip': row.zip_mode_distance_m || 0
            };
            const primaryMode = Object.keys(modes).reduce((a, b) => (modes[a] || 0) >= (modes[b] || 0) ? a : b);

            return {
                id: row.ride_id || index,
                date: row.date || 'N/A',
                distance: row.distance_m ? parseFloat((row.distance_m / 1000).toFixed(2)) : 0,
                efficiency: row.efficiency_wh_km || 0,
                duration: row.duration_secs ? parseFloat((row.duration_secs / 60).toFixed(2)) : 0,
                topSpeed: row.top_speed_kmph || 0,
                avgSpeed: row.avg_speed_kmph || 0,
                energyUsed: row.soc_usage_wh || 0,
                timestamp: row.ride_start_time || null,
                mode: primaryMode || 'Ride'
            };
        });

        console.log('\n--- Transformed Data Preview (First 2 rides) ---');
        console.log(JSON.stringify(transformedData.slice(0, 2), null, 2));

        const lastRide = transformedData[transformedData.length - 1];
        console.log('\n--- Transformed Data Preview (Last ride) ---');
        console.log(JSON.stringify(lastRide, null, 2));

    } catch (e) {
        console.error('Error:', e);
    }
}

testFetchAndTransform();
