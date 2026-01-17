import Papa from 'papaparse';

const SHEET_URL = '';
/**
 * Fetches and parses the Ather ride data from Google Sheets or CSV URL.
 * @param {string} sheetUrl - The URL of the CSV data.
 * @returns {Promise<Array>} Array of ride objects.
 */
export const fetchAtherData = async (sheetUrl) => {
    if (!sheetUrl) return [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        const response = await fetch(sheetUrl, {
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }

        const csvText = await response.text();

        return new Promise((resolve, reject) => {
            Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        if (results.errors && results.errors.length > 0) {
                            console.warn('CSV Parse Warnings found.');
                        }

                        if (!results.data || results.data.length === 0) {
                            // Fallback check if it was actually HTML (common with bad Google Sheet links)
                            if (csvText.trim().toLowerCase().startsWith('<!doctype html') || csvText.trim().toLowerCase().startsWith('<html')) {
                                reject(new Error('The URL returned HTML instead of CSV. Please ensure you used "File > Share > Publish to Web > CSV" link.'));
                                return;
                            }
                        }

                        // Robust Data Transformation
                        const transformedData = results.data
                            .filter(row => row && typeof row === 'object') // Filter out empty/malformed rows
                            .map((row, index) => {
                                try {
                                    // Pre-calculate behavior percentages with defaults
                                    const totalM = (Number(row.riding_m) || 0) + (Number(row.braking_m) || 0) + (Number(row.coasting_m) || 0);

                                    return {
                                        id: row.ride_id || `ride-${index}`,
                                        date: row.date || 'N/A',
                                        month: row.month ? (row.month.toString().includes('-') ? row.month.split('-')[1] : row.month.toString().padStart(2, '0')) : '01',
                                        year: Number(row.year) || new Date().getFullYear(),
                                        distance: row.distance_m ? (Number(row.distance_m) / 1000).toFixed(2) : 0,
                                        efficiency: Number(row.efficiency_wh_km) || 0,
                                        efficiency_km_kwh: Number(row.efficiency_km_kwh) || 0,
                                        duration: row.duration_secs ? (Number(row.duration_secs) / 60).toFixed(2) : 0,
                                        topSpeed: Number(row.top_speed_kmph) || 0,
                                        avgSpeed: Number(row.avg_speed_kmph) || 0,
                                        energyUsed: Number(row.soc_usage_wh) || 0,
                                        socPercent: row.soc_usage_percent ? (Number(row.soc_usage_percent) * 100).toFixed(2) : 0,
                                        timestamp: row.ride_start_time || null,

                                        // Behavior Metrics
                                        riding_m: Number(row.riding_m) || 0,
                                        braking_m: Number(row.braking_m) || 0,
                                        coasting_m: Number(row.coasting_m) || 0,
                                        behavior: {
                                            riding: totalM > 0 ? ((Number(row.riding_m) || 0) / totalM * 100).toFixed(1) : 0,
                                            braking: totalM > 0 ? ((Number(row.braking_m) || 0) / totalM * 100).toFixed(1) : 0,
                                            coasting: totalM > 0 ? ((Number(row.coasting_m) || 0) / totalM * 100).toFixed(1) : 0,
                                        },

                                        // Mode Breakdown
                                        modes: {
                                            Eco: Number(row.eco_mode_distance_m) || 0,
                                            SmartEco: Number(row.smart_eco_mode_distance_m) || 0,
                                            Ride: Number(row.ride_mode_distance_m) || 0,
                                            Sport: Number(row.sport_mode_distance_m) || 0,
                                            Warp: Number(row.warp_mode_distance_m) || 0,
                                            Zip: Number(row.zip_mode_distance_m) || 0
                                        },

                                        // GPS Info
                                        location: {
                                            start: [Number(row.ride_start_lat) || 0, Number(row.ride_start_lon) || 0],
                                            end: [Number(row.ride_end_lat) || 0, Number(row.ride_end_lon) || 0],
                                            startAddr: row.ride_start_location || '',
                                            endAddr: row.ride_end_location || ''
                                        },

                                        polyline: row.polyline || '',
                                        speedTimeSeries: row.speed ? JSON.parse(row.speed) : []
                                    };
                                } catch (innerErr) {
                                    console.warn('Skipping malformed row:', index, innerErr);
                                    return null;
                                }
                            })
                            .filter(item => item !== null); // Remove failed rows

                        resolve(transformedData);
                    } catch (parseError) {
                        console.error('Data Transformation Error:', parseError);
                        reject(new Error('Failed to process the CSV data. structure may be incorrect.'));
                    }
                },
                error: (err) => {
                    console.error('Error parsing CSV:', err);
                    reject(err);
                }
            });
        });

    } catch (error) {
        if (error.name === 'AbortError') {
            throw new Error('Request timed out. Please check your internet connection.');
        }
        console.error("Fetch Error:", error);
        throw error;
    }
};
