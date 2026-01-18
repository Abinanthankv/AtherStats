import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EnhancedMonthlyChart = ({
    monthlyData,
    selectedMonthFilter,
    onMonthClick
}) => {

    const handleChartClick = (data) => {
        if (data && data.activePayload && data.activePayload[0]) {
            const clickedMonth = data.activePayload[0].payload.key;
            onMonthClick(clickedMonth);
        }
    };

    return (
        <div className="chart-card enhanced-monthly-chart">
            {selectedMonthFilter && (
                <div className="active-filter-banner">
                    <span>
                        📍 Filtered by: <strong>{monthlyData.find(m => m.key === selectedMonthFilter)?.name}</strong>
                    </span>
                    <button
                        className="clear-filter-btn"
                        onClick={() => onMonthClick(null)}
                        aria-label="Clear month filter"
                    >
                        ✕ Clear Filter
                    </button>
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Monthly Performance Overview</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.7 }}>
                        Distance, Energy & Efficiency Trends • Click bars to filter
                    </p>
                </div>
                {monthlyData.length > 0 && (
                    <div className="monthly-stats-summary">
                        <div className="mini-metric">
                            <span className="metric-label">Total Months</span>
                            <span className="metric-value">{monthlyData.length}</span>
                        </div>
                        <div className="mini-metric">
                            <span className="metric-label">Avg Distance/Month</span>
                            <span className="metric-value">
                                {(monthlyData.reduce((sum, m) => sum + m.distance, 0) / monthlyData.length).toFixed(1)} km
                            </span>
                        </div>
                        <div className="mini-metric">
                            <span className="metric-label">Total Energy</span>
                            <span className="metric-value">
                                {monthlyData.reduce((sum, m) => sum + m.energy, 0).toFixed(1)} kWh
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div style={{ width: '100%', height: 450 }}>
                <ResponsiveContainer>
                    <ComposedChart
                        data={monthlyData}
                        margin={{ top: 20, right: 60, left: 20, bottom: 20 }}
                        onClick={handleChartClick}
                        style={{ cursor: 'pointer' }}
                    >
                        <defs>
                            <linearGradient id="distanceGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.3} />
                            </linearGradient>
                            <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="var(--secondary)" stopOpacity={0.8} />
                                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.6} />
                                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0.2} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} opacity={0.5} />

                        <XAxis
                            dataKey="name"
                            stroke="var(--text-secondary)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--card-border)', strokeWidth: 1 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                        />

                        <YAxis
                            yAxisId="left"
                            stroke="var(--primary)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--primary)', strokeWidth: 2 }}
                            label={{
                                value: 'Distance (km)',
                                angle: -90,
                                position: 'insideLeft',
                                fill: 'var(--primary)',
                                offset: 10,
                                style: { fontWeight: 600 }
                            }}
                        />

                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="var(--secondary)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--secondary)', strokeWidth: 2 }}
                            label={{
                                value: 'Efficiency (Wh/km)',
                                angle: 90,
                                position: 'insideRight',
                                fill: 'var(--secondary)',
                                offset: 10,
                                style: { fontWeight: 600 }
                            }}
                        />

                        <YAxis
                            yAxisId="energy"
                            orientation="right"
                            stroke="var(--accent)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--accent)', strokeWidth: 2 }}
                            label={{
                                value: 'Energy (kWh)',
                                angle: 90,
                                position: 'insideRight',
                                fill: 'var(--accent)',
                                offset: 50,
                                style: { fontWeight: 600 }
                            }}
                        />

                        <Tooltip
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    const isSelected = selectedMonthFilter === data.key;
                                    return (
                                        <div className={`custom-chart-tooltip ${isSelected ? 'selected' : ''}`}>
                                            <div className="tooltip-header">
                                                {label}
                                                {isSelected && <span className="selected-badge">✓ Filtered</span>}
                                            </div>
                                            <div className="tooltip-body">
                                                <div className="tooltip-row">
                                                    <span className="tooltip-icon" style={{ color: 'var(--primary)' }}>📊</span>
                                                    <span className="tooltip-label">Distance:</span>
                                                    <span className="tooltip-value" style={{ color: 'var(--primary)' }}>
                                                        {data.distance} km
                                                    </span>
                                                </div>
                                                <div className="tooltip-row">
                                                    <span className="tooltip-icon" style={{ color: 'var(--accent)' }}>🔋</span>
                                                    <span className="tooltip-label">Energy:</span>
                                                    <span className="tooltip-value" style={{ color: 'var(--accent)' }}>
                                                        {data.energy} kWh
                                                    </span>
                                                </div>
                                                <div className="tooltip-row">
                                                    <span className="tooltip-icon" style={{ color: 'var(--secondary)' }}>⚡</span>
                                                    <span className="tooltip-label">Efficiency:</span>
                                                    <span className="tooltip-value" style={{ color: 'var(--secondary)' }}>
                                                        {data.efficiency} Wh/km
                                                    </span>
                                                </div>
                                                <div className="tooltip-row">
                                                    <span className="tooltip-icon">🚗</span>
                                                    <span className="tooltip-label">Rides:</span>
                                                    <span className="tooltip-value">{data.count}</span>
                                                </div>
                                                <div className="tooltip-row">
                                                    <span className="tooltip-icon">📈</span>
                                                    <span className="tooltip-label">Avg/Ride:</span>
                                                    <span className="tooltip-value">
                                                        {(data.distance / data.count).toFixed(1)} km
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="tooltip-hint">💡 Click to filter dashboard</div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />

                        <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />

                        <Bar
                            yAxisId="left"
                            dataKey="distance"
                            fill="url(#distanceGradient)"
                            radius={[8, 8, 0, 0]}
                            barSize={35}
                            name="Distance (km)"
                            animationDuration={1000}
                            opacity={(entry) => selectedMonthFilter && selectedMonthFilter !== entry.key ? 0.3 : 1}
                        />

                        <Bar
                            yAxisId="energy"
                            dataKey="energy"
                            fill="url(#energyGradient)"
                            radius={[8, 8, 0, 0]}
                            barSize={35}
                            name="Energy (kWh)"
                            animationDuration={1000}
                            animationBegin={100}
                            opacity={(entry) => selectedMonthFilter && selectedMonthFilter !== entry.key ? 0.3 : 1}
                        />

                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="efficiency"
                            stroke="url(#efficiencyGradient)"
                            strokeWidth={4}
                            dot={{
                                fill: 'var(--secondary)',
                                r: 6,
                                strokeWidth: 2,
                                stroke: 'var(--bg-surface)'
                            }}
                            activeDot={{
                                r: 8,
                                fill: 'var(--accent)',
                                stroke: 'var(--bg-surface)',
                                strokeWidth: 3
                            }}
                            name="Efficiency (Wh/km)"
                            animationDuration={1500}
                            animationBegin={200}
                            opacity={(entry) => selectedMonthFilter && selectedMonthFilter !== entry.key ? 0.3 : 1}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* Month-over-month trend summary */}
            {monthlyData.length >= 2 && (
                <div className="monthly-trends">
                    <div className="trend-item">
                        <span className="trend-label">Latest Month vs Previous:</span>
                        <div className="trend-indicators">
                            {(() => {
                                const latest = monthlyData[monthlyData.length - 1];
                                const previous = monthlyData[monthlyData.length - 2];
                                const distChange = ((latest.distance - previous.distance) / previous.distance * 100).toFixed(1);
                                const effChange = ((latest.efficiency - previous.efficiency) / previous.efficiency * 100).toFixed(1);
                                const energyChange = ((latest.energy - previous.energy) / previous.energy * 100).toFixed(1);

                                return (
                                    <>
                                        <span className={`trend-badge ${parseFloat(distChange) >= 0 ? 'positive' : 'negative'}`}>
                                            {parseFloat(distChange) >= 0 ? '↑' : '↓'} {Math.abs(distChange)}% Distance
                                        </span>
                                        <span className={`trend-badge ${parseFloat(effChange) <= 0 ? 'positive' : 'negative'}`}>
                                            {parseFloat(effChange) <= 0 ? '↓' : '↑'} {Math.abs(effChange)}% Efficiency
                                        </span>
                                        <span className={`trend-badge ${parseFloat(energyChange) <= 0 ? 'positive' : 'negative'}`}>
                                            {parseFloat(energyChange) <= 0 ? '↓' : '↑'} {Math.abs(energyChange)}% Energy
                                        </span>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnhancedMonthlyChart;
