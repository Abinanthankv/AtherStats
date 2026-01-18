import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, Zap, Map, Clock, Battery } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const SummaryPage = ({ data, theme }) => {
    const [viewMode, setViewMode] = useState('daily'); // 'daily', 'weekly', 'monthly'
    const [selectedPeriod, setSelectedPeriod] = useState(null);

    // Helper function to get week number
    const getWeekNumber = (date) => {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() + 4 - (d.getDay() || 7));
        const yearStart = new Date(d.getFullYear(), 0, 1);
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
    };

    // Calculate summaries
    const summaries = useMemo(() => {
        if (!data || data.length === 0) return { daily: [], weekly: [], monthly: [] };

        // Daily Summary
        const dailyMap = {};
        data.forEach(ride => {
            const date = ride.date;
            if (!dailyMap[date]) {
                dailyMap[date] = {
                    date,
                    rides: [],
                    totalDistance: 0,
                    totalDuration: 0,
                    totalEnergy: 0,
                    avgEfficiency: 0,
                    maxSpeed: 0,
                    timestamp: ride.timestamp
                };
            }
            dailyMap[date].rides.push(ride);
            dailyMap[date].totalDistance += parseFloat(ride.distance) || 0;
            dailyMap[date].totalDuration += parseFloat(ride.duration) || 0;
            dailyMap[date].totalEnergy += parseFloat(ride.energyUsed) || 0;
            dailyMap[date].maxSpeed = Math.max(dailyMap[date].maxSpeed, parseFloat(ride.topSpeed) || 0);
        });

        const daily = Object.values(dailyMap).map(day => ({
            ...day,
            avgEfficiency: day.rides.reduce((sum, r) => sum + (parseFloat(r.efficiency) || 0), 0) / day.rides.length,
            rideCount: day.rides.length,
            totalDistance: parseFloat(day.totalDistance.toFixed(2)),
            totalDuration: parseFloat(day.totalDuration.toFixed(0)),
            totalEnergy: parseFloat((day.totalEnergy / 1000).toFixed(2)),
            avgEfficiency: parseFloat((day.rides.reduce((sum, r) => sum + (parseFloat(r.efficiency) || 0), 0) / day.rides.length).toFixed(1)),
            maxSpeed: parseFloat(day.maxSpeed.toFixed(1))
        })).sort((a, b) => new Date(b.date) - new Date(a.date));

        // Weekly Summary
        const weeklyMap = {};
        data.forEach(ride => {
            const week = getWeekNumber(ride.timestamp || ride.date);
            if (!weeklyMap[week]) {
                weeklyMap[week] = {
                    week,
                    rides: [],
                    totalDistance: 0,
                    totalDuration: 0,
                    totalEnergy: 0,
                    maxSpeed: 0,
                    dates: new Set()
                };
            }
            weeklyMap[week].rides.push(ride);
            weeklyMap[week].totalDistance += parseFloat(ride.distance) || 0;
            weeklyMap[week].totalDuration += parseFloat(ride.duration) || 0;
            weeklyMap[week].totalEnergy += parseFloat(ride.energyUsed) || 0;
            weeklyMap[week].maxSpeed = Math.max(weeklyMap[week].maxSpeed, parseFloat(ride.topSpeed) || 0);
            weeklyMap[week].dates.add(ride.date);
        });

        const weekly = Object.values(weeklyMap).map(week => ({
            ...week,
            avgEfficiency: week.rides.reduce((sum, r) => sum + (parseFloat(r.efficiency) || 0), 0) / week.rides.length,
            rideCount: week.rides.length,
            daysActive: week.dates.size,
            totalDistance: parseFloat(week.totalDistance.toFixed(2)),
            totalDuration: parseFloat(week.totalDuration.toFixed(0)),
            totalEnergy: parseFloat((week.totalEnergy / 1000).toFixed(2)),
            avgEfficiency: parseFloat((week.rides.reduce((sum, r) => sum + (parseFloat(r.efficiency) || 0), 0) / week.rides.length).toFixed(1)),
            maxSpeed: parseFloat(week.maxSpeed.toFixed(1))
        })).sort((a, b) => b.week.localeCompare(a.week));

        // Monthly Summary
        const monthlyMap = {};
        data.forEach(ride => {
            const monthKey = `${ride.year}-${ride.month}`;
            if (!monthlyMap[monthKey]) {
                monthlyMap[monthKey] = {
                    month: monthKey,
                    year: ride.year,
                    monthNum: ride.month,
                    rides: [],
                    totalDistance: 0,
                    totalDuration: 0,
                    totalEnergy: 0,
                    maxSpeed: 0,
                    dates: new Set()
                };
            }
            monthlyMap[monthKey].rides.push(ride);
            monthlyMap[monthKey].totalDistance += parseFloat(ride.distance) || 0;
            monthlyMap[monthKey].totalDuration += parseFloat(ride.duration) || 0;
            monthlyMap[monthKey].totalEnergy += parseFloat(ride.energyUsed) || 0;
            monthlyMap[monthKey].maxSpeed = Math.max(monthlyMap[monthKey].maxSpeed, parseFloat(ride.topSpeed) || 0);
            monthlyMap[monthKey].dates.add(ride.date);
        });

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthly = Object.values(monthlyMap).map(month => ({
            ...month,
            monthName: monthNames[parseInt(month.monthNum) - 1] || 'Unknown',
            avgEfficiency: month.rides.reduce((sum, r) => sum + (parseFloat(r.efficiency) || 0), 0) / month.rides.length,
            rideCount: month.rides.length,
            daysActive: month.dates.size,
            totalDistance: parseFloat(month.totalDistance.toFixed(2)),
            totalDuration: parseFloat(month.totalDuration.toFixed(0)),
            totalEnergy: parseFloat((month.totalEnergy / 1000).toFixed(2)),
            avgEfficiency: parseFloat((month.rides.reduce((sum, r) => sum + (parseFloat(r.efficiency) || 0), 0) / month.rides.length).toFixed(1)),
            maxSpeed: parseFloat(month.maxSpeed.toFixed(1))
        })).sort((a, b) => b.month.localeCompare(a.month));

        return { daily, weekly, monthly };
    }, [data]);

    // Get current view data
    const currentData = summaries[viewMode] || [];

    // Calculate trends (compare with previous period)
    const getTrend = (current, previous, metric) => {
        if (!previous || previous[metric] === 0) return null;
        const change = ((current[metric] - previous[metric]) / previous[metric]) * 100;
        return {
            value: Math.abs(change).toFixed(1),
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
        };
    };

    const SummaryCard = ({ item, index }) => {
        const previous = currentData[index + 1];
        const distanceTrend = getTrend(item, previous, 'totalDistance');
        const efficiencyTrend = getTrend(item, previous, 'avgEfficiency');

        let periodLabel = '';
        if (viewMode === 'daily') {
            periodLabel = item.date;
        } else if (viewMode === 'weekly') {
            periodLabel = `Week ${item.week.split('-W')[1]}, ${item.week.split('-W')[0]}`;
        } else {
            periodLabel = `${item.monthName} ${item.year}`;
        }

        return (
            <div className="summary-card" onClick={() => setSelectedPeriod(item)}>
                <div className="summary-header">
                    <div>
                        <h3>{periodLabel}</h3>
                        <p className="summary-meta">
                            {item.rideCount} ride{item.rideCount !== 1 ? 's' : ''}
                            {(viewMode === 'weekly' || viewMode === 'monthly') && ` • ${item.daysActive} active days`}
                        </p>
                    </div>
                    <Calendar size={20} className="summary-icon" />
                </div>

                <div className="summary-stats">
                    <div className="summary-stat">
                        <div className="stat-header">
                            <Map size={14} />
                            <span>Distance</span>
                        </div>
                        <div className="stat-value-row">
                            <span className="stat-value">{item.totalDistance} km</span>
                            {distanceTrend && (
                                <span className={`trend trend-${distanceTrend.direction}`}>
                                    {distanceTrend.direction === 'up' && <TrendingUp size={12} />}
                                    {distanceTrend.direction === 'down' && <TrendingDown size={12} />}
                                    {distanceTrend.direction === 'same' && <Minus size={12} />}
                                    {distanceTrend.value}%
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="summary-stat">
                        <div className="stat-header">
                            <Zap size={14} />
                            <span>Efficiency</span>
                        </div>
                        <div className="stat-value-row">
                            <span className="stat-value">{item.avgEfficiency} Wh/km</span>
                            {efficiencyTrend && (
                                <span className={`trend trend-${efficiencyTrend.direction === 'down' ? 'up' : 'down'}`}>
                                    {efficiencyTrend.direction === 'up' && <TrendingUp size={12} />}
                                    {efficiencyTrend.direction === 'down' && <TrendingDown size={12} />}
                                    {efficiencyTrend.direction === 'same' && <Minus size={12} />}
                                    {efficiencyTrend.value}%
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="summary-stat">
                        <div className="stat-header">
                            <Clock size={14} />
                            <span>Duration</span>
                        </div>
                        <span className="stat-value">{item.totalDuration} min</span>
                    </div>

                    <div className="summary-stat">
                        <div className="stat-header">
                            <Battery size={14} />
                            <span>Energy</span>
                        </div>
                        <span className="stat-value">{item.totalEnergy} kWh</span>
                    </div>
                </div>
            </div>
        );
    };

    // Chart data for selected period
    const chartData = useMemo(() => {
        if (!selectedPeriod) return [];

        if (viewMode === 'daily') {
            return selectedPeriod.rides.map((ride, i) => ({
                name: `Ride ${i + 1}`,
                distance: parseFloat(ride.distance),
                efficiency: parseFloat(ride.efficiency)
            }));
        } else if (viewMode === 'weekly') {
            const dailyData = {};
            selectedPeriod.rides.forEach(ride => {
                if (!dailyData[ride.date]) {
                    dailyData[ride.date] = { date: ride.date, distance: 0, efficiency: 0, count: 0 };
                }
                dailyData[ride.date].distance += parseFloat(ride.distance);
                dailyData[ride.date].efficiency += parseFloat(ride.efficiency);
                dailyData[ride.date].count += 1;
            });
            return Object.values(dailyData).map(day => ({
                name: day.date.split('-').slice(1).join('/'),
                distance: parseFloat(day.distance.toFixed(2)),
                efficiency: parseFloat((day.efficiency / day.count).toFixed(1))
            })).sort((a, b) => a.name.localeCompare(b.name));
        } else {
            const dailyData = {};
            selectedPeriod.rides.forEach(ride => {
                if (!dailyData[ride.date]) {
                    dailyData[ride.date] = { date: ride.date, distance: 0, efficiency: 0, count: 0 };
                }
                dailyData[ride.date].distance += parseFloat(ride.distance);
                dailyData[ride.date].efficiency += parseFloat(ride.efficiency);
                dailyData[ride.date].count += 1;
            });
            return Object.values(dailyData).map(day => ({
                name: day.date.split('-')[2],
                distance: parseFloat(day.distance.toFixed(2)),
                efficiency: parseFloat((day.efficiency / day.count).toFixed(1))
            })).sort((a, b) => parseInt(a.name) - parseInt(b.name));
        }
    }, [selectedPeriod, viewMode]);

    return (
        <div className="summary-page">
            <div className="summary-controls">
                <div className="view-mode-tabs">
                    <button
                        className={`tab ${viewMode === 'daily' ? 'active' : ''}`}
                        onClick={() => { setViewMode('daily'); setSelectedPeriod(null); }}
                    >
                        Daily
                    </button>
                    <button
                        className={`tab ${viewMode === 'weekly' ? 'active' : ''}`}
                        onClick={() => { setViewMode('weekly'); setSelectedPeriod(null); }}
                    >
                        Weekly
                    </button>
                    <button
                        className={`tab ${viewMode === 'monthly' ? 'active' : ''}`}
                        onClick={() => { setViewMode('monthly'); setSelectedPeriod(null); }}
                    >
                        Monthly
                    </button>
                </div>
            </div>

            {selectedPeriod && (
                <div className="period-detail">
                    <button className="btn-back" onClick={() => setSelectedPeriod(null)}>
                        ← Back to {viewMode} view
                    </button>
                    <div className="chart-card">
                        <h3>
                            {viewMode === 'daily' && `Rides on ${selectedPeriod.date}`}
                            {viewMode === 'weekly' && `Week ${selectedPeriod.week.split('-W')[1]} Daily Breakdown`}
                            {viewMode === 'monthly' && `${selectedPeriod.monthName} ${selectedPeriod.year} Daily Breakdown`}
                        </h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                                    <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={11} />
                                    <YAxis yAxisId="left" stroke="var(--primary)" fontSize={11} />
                                    <YAxis yAxisId="right" orientation="right" stroke="var(--secondary)" fontSize={11} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="distance" fill="var(--primary)" name="Distance (km)" />
                                    <Bar yAxisId="right" dataKey="efficiency" fill="var(--secondary)" name="Efficiency (Wh/km)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {!selectedPeriod && (
                <div className="summary-grid">
                    {currentData.length === 0 ? (
                        <div className="empty-state">
                            <Calendar size={48} />
                            <p>No {viewMode} summaries available</p>
                        </div>
                    ) : (
                        currentData.map((item, index) => (
                            <SummaryCard key={item.date || item.week || item.month} item={item} index={index} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default SummaryPage;
