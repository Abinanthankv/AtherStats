import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
  PieChart, Pie, Cell, Legend, ComposedChart
} from 'recharts';
import {
  Zap, Map, Gauge, Clock, RefreshCw, Activity, Battery,
  Navigation, ShieldAlert, Wind, TrendingUp, X, Filter,
  Maximize2, ArrowRight, Sun, Moon, BarChart3, LayoutDashboard, Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAtherData } from './utils/dataFetcher';
import SummaryPage from './components/SummaryPage';
import EnhancedMonthlyChart from './components/EnhancedMonthlyChart';
import RideMapView from './components/RideMapView';
import Scooter3DView from './components/Scooter3DView';
import './App.css';

const StatCard = ({ label, value, unit, icon: Icon }) => (
  <div className="stat-card">
    <div className="stat-label">
      <Icon size={16} /> {label}
    </div>
    <div className="stat-value">
      {value}<span className="stat-unit">{unit}</span>
    </div>
  </div>
);

const BehaviorBar = ({ behavior }) => (
  <div className="behavior-bar">
    <div className="behavior-segment behavior-riding" style={{ width: `${behavior.riding}%` }}></div>
    <div className="behavior-segment behavior-braking" style={{ width: `${behavior.braking}%` }}></div>
    <div className="behavior-segment behavior-coasting" style={{ width: `${behavior.coasting}%` }}></div>
  </div>
);

const ActivityCalendar = ({ activityData, year }) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Generate days for the selected year
  const days = [];
  const startDate = new Date(Date.UTC(year, 0, 1));
  const endDate = new Date(Date.UTC(year, 11, 31));

  // Padding for start of week (Sunday start)
  const startDayOfWeek = startDate.getUTCDay(); // 0 = Sun
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ date: null, level: 0, distance: 0 });
  }

  const monthLabels = [];
  let currentMonth = -1;

  const itr = new Date(startDate);
  while (itr <= endDate) {
    const dateStr = itr.toISOString().split('T')[0];
    const distance = activityData[dateStr] || 0;

    const month = itr.getUTCMonth();
    // Index in the grid array
    const gridIndex = days.length;
    const weekIndex = Math.floor(gridIndex / 7);

    if (month !== currentMonth) {
      if (gridIndex % 7 === 0 || monthLabels.length === 0 || (weekIndex > monthLabels[monthLabels.length - 1].weekIndex)) {
        monthLabels.push({ name: months[month], weekIndex });
        currentMonth = month;
      }
    }

    let level = 0;
    if (distance > 0) level = 1;
    if (distance > 5) level = 2;
    if (distance > 15) level = 3;
    if (distance > 30) level = 4;
    days.push({ date: dateStr, level, distance });

    // Next day
    itr.setUTCDate(itr.getUTCDate() + 1);
  }

  // Filter labels to avoid overlap
  const filteredLabels = monthLabels.filter((label, i) => {
    if (i === 0) return true;
    return label.weekIndex - monthLabels[i - 1].weekIndex >= 2;
  });

  const [hoveredDay, setHoveredDay] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  return (
    <div className="calendar-container">
      <div className="calendar-wrapper" onMouseMove={handleMouseMove}>
        <div className="month-labels-row">
          {filteredLabels.map((label, i) => (
            <div key={i} className="month-label" style={{ gridColumn: label.weekIndex + 1 }}>
              {label.name}
            </div>
          ))}
        </div>
        <div className="calendar-body">
          <div className="weekday-labels">
            <span>Mon</span>
            <span>Wed</span>
            <span>Fri</span>
          </div>
          <div className="calendar-grid">
            {days.map((day, i) => (
              <div
                key={i}
                className={`day-cell level-${day.level}`}
                style={{ opacity: day.date ? 1 : 0, pointerEvents: day.date ? 'auto' : 'none' }}
                onMouseEnter={() => day.date && setHoveredDay(day)}
                onMouseLeave={() => setHoveredDay(null)}
              />
            ))}
          </div>
        </div> {/* closes calendar-body */}
        <AnimatePresence>
          {hoveredDay && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="custom-tooltip"
              style={{
                position: 'absolute',
                left: mousePos.x + 15,
                top: mousePos.y - 15,
                pointerEvents: 'none',
                zIndex: 1000
              }}
            >
              <span className="tooltip-date">{hoveredDay.date}</span>
              <span className="tooltip-value">{parseFloat(hoveredDay.distance).toFixed(1)} km</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div> {/* closes calendar-wrapper */}
      <div className="calendar-footer">
        <span>Less</span>
        <div className="calendar-legend">
          {[0, 1, 2, 3, 4].map(l => <div key={l} className={`legend-cell level-${l}`} />)}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

const RideModal = ({ ride, onClose, theme, modeColors }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!ride) return null;

  const speedData = ride.speedTimeSeries.map((s, i) => ({ time: i, speed: s }));
  const modeData = Object.entries(ride.modes)
    .map(([name, value]) => ({ name, value: parseFloat((value / 1000).toFixed(2)) }))
    .filter(m => m.value > 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div>
            <h2>Ride Details</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{ride.date} • {ride.id}</p>
          </div>
          <button className="btn-close" onClick={onClose} aria-label="Close modal">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', pointerEvents: 'none' }}>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>

        <div className="modal-tabs">
          <button
            className={`modal-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            📊 Overview
          </button>
          <button
            className={`modal-tab ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            🗺️ Route Map
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'overview' ? (
            <>
              <div className="modal-stats-grid">
                <div className="mini-stat">
                  <span className="label">Distance</span>
                  <span className="value">{ride.distance} km</span>
                </div>
                <div className="mini-stat">
                  <span className="label">Avg Efficiency</span>
                  <span className="value">{ride.efficiency} Wh/km</span>
                </div>
                <div className="mini-stat">
                  <span className="label">Top Speed</span>
                  <span className="value">{ride.topSpeed} km/h</span>
                </div>
                <div className="mini-stat">
                  <span className="label">Energy</span>
                  <span className="value">{ride.energyUsed.toFixed(1)} Wh</span>
                </div>
              </div>

              <div className="modal-chart-section">
                <div className="modal-chart-card">
                  <h3>Speed Profile (km/h)</h3>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                      <AreaChart data={speedData}>
                        <defs>
                          <linearGradient id="colorSpeed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis stroke="var(--text-secondary)" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Area type="monotone" dataKey="speed" stroke="var(--primary)" fillOpacity={1} fill="url(#colorSpeed)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="modal-chart-card">
                  <h3>Mode Breakdown (km)</h3>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie data={modeData} innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                          {modeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={modeColors[entry.name] || 'var(--primary)'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="modal-info-card">
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div className="location-info">
                    <div className="dot start"></div>
                    <span>{ride.location.startAddr || 'Start Location'}</span>
                  </div>
                  <ArrowRight size={14} style={{ color: 'var(--text-secondary)' }} />
                  <div className="location-info">
                    <div className="dot end"></div>
                    <span>{ride.location.endAddr || 'End Location'}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <RideMapView ride={ride} />
          )}
        </div>
      </div>
    </div>
  );
};

const SetupPage = ({ onConnect }) => {
  const [url, setUrl] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (url.trim()) {
      setIsConnecting(true);
      setError(null);

      try {
        // Verify connection by fetching data first
        const data = await fetchAtherData(url.trim());

        if (!data || data.length === 0) {
          throw new Error('No valid ride data found. Please check the CSV URL.');
        }

        // Success! Pass data up
        onConnect(url.trim(), data);
        // We don't strictly need setIsConnecting(false) here because component unmounts, 
        // but if it stays mounted for a frame, clean up state:
        setIsConnecting(false);
      } catch (err) {
        console.error("Connection failed", err);
        setError(err.message || "Failed to connect. Please check the URL.");
        setIsConnecting(false);
      }
    }
  };

  return (
    <div className="setup-container">
      <div className="bg-ornaments">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>
      <div className="setup-card">
        <h1>Welcome to Ather Stats</h1>
        <p className="setup-subtitle">Connect your data to get started</p>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="input-group">
            <label>Google Sheet CSV URL</label>
            <input
              type="text"
              placeholder="https://docs.google.com/.../pub?output=csv"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="setup-input"
              disabled={isConnecting}
            />
            <p className="help-text">
              File &gt; Share &gt; Publish to Web &gt; Select 'Ride Log' &gt; CSV
            </p>
            {isConnecting && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', color: 'var(--primary)', fontSize: '0.9rem' }}>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                <span>Verifying and fetching data...</span>
              </div>
            )}
            {error && (
              <p style={{ color: 'var(--error)', fontSize: '0.9rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={14} /> {error}
              </p>
            )}
          </div>
          <button type="submit" className="btn-primary" disabled={!url || isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect Data'}
          </button>
        </form>
      </div>
    </div>
  );
};

function App() {
  // Initialize state
  const [csvUrl, setCsvUrl] = useState(localStorage.getItem('ather_stats_csv_url') || null);
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'summary', or 'vehicle'
  const [selectedMonthFilter, setSelectedMonthFilter] = useState(null); // For click-to-filter
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // Mobile menu state
  const [data, setData] = useState([]);

  // Loading is true only if we have a URL but no data yet (re-load / splash screen case)
  // For new users (no URL), loading is false so they see SetupPage.
  const [loading, setLoading] = useState(!!(localStorage.getItem('ather_stats_csv_url')));

  const [totals, setTotals] = useState({
    distance: 0,
    efficiency: 0,
    topSpeed: 0,
    rides: 0,
    duration: 0,
    energy: 0,
    behavior: { riding: 0, braking: 0, coasting: 0 }
  });
  const [selectedRide, setSelectedRide] = useState(null);
  const [filterMonth, setFilterMonth] = useState('all');
  const [filterLongRides, setFilterLongRides] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('ather-stats-theme') || 'dark');
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [activityData, setActivityData] = useState({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Theme Effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ather-stats-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // Core Data Processing Logic (reused for both initial connect and re-fetch)
  const processData = useCallback((rides) => {
    setData(rides);

    if (rides && rides.length > 0) {
      // Monthly Aggregation with Energy
      const m = rides.reduce((acc, r) => {
        const key = `${r.year}-${r.month}`;
        if (!acc[key]) acc[key] = {
          name: `${r.month}/${r.year.toString().slice(-2)}`,
          key: key,
          distance: 0,
          efficiency: 0,
          energy: 0,
          count: 0
        };
        acc[key].distance += parseFloat(r.distance);
        acc[key].efficiency += parseFloat(r.efficiency);
        acc[key].energy += parseFloat(r.energyUsed);
        acc[key].count += 1;
        return acc;
      }, {});

      setMonthlyData(Object.values(m).map(item => ({
        ...item,
        distance: parseFloat(item.distance.toFixed(1)),
        efficiency: parseFloat((item.efficiency / item.count).toFixed(1)),
        energy: parseFloat((item.energy / 1000).toFixed(2)) // Convert to kWh
      })));

      // Activity Data Aggregation
      const a = rides.reduce((acc, r) => {
        const date = new Date(r.timestamp).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + parseFloat(r.distance);
        return acc;
      }, {});
      setActivityData(a);

      // Extract Years
      const years = Array.from(new Set(rides.map(r => r.year))).sort((a, b) => b - a);
      if (years.length > 0) {
        setAvailableYears(years);
        // Ensure selected year is valid
        setSelectedYear(prev => years.includes(prev) ? prev : years[0]);
      }
    }
  }, []);

  // Fetcher for existing sessions (reload / refresh)
  const loadData = useCallback(async () => {
    if (!csvUrl) return;

    setLoading(true);
    setError(null);

    try {
      // Branding delay for splash screen
      await new Promise(r => setTimeout(r, 800));

      const rides = await fetchAtherData(csvUrl);

      if (!rides || rides.length === 0) {
        setError('No rides found or CSV is empty.');
        setData([]);
      } else {
        processData(rides);
      }
    } catch (err) {
      console.error("Failed to load data", err);
      setError(err.message || "Failed to load data.");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [csvUrl, processData]);

  // Initial Load Effect (Only if URL exists and Data is empty)
  useEffect(() => {
    if (csvUrl && data.length === 0 && !error) {
      loadData();
    }
  }, [csvUrl, refreshTrigger]); // Removed loadData/data dependency to avoid loops

  // Handlers
  const handleConnect = useCallback((url, initialData) => {
    try {
      console.log("Connecting with data:", initialData.length);
      // Clean up data before state set to avoid issues
      localStorage.setItem('ather_stats_csv_url', url);
      setCsvUrl(url);

      // Batch updates should work, but to be safe, we process data immediately
      processData(initialData);

      // Ensure loading is off
      setLoading(false);
      setError(null);
    } catch (e) {
      console.error("Error during connection handler:", e);
      setError("An error occurred while setting up the dashboard.");
    }
  }, [processData]);

  const handleDisconnect = () => {
    localStorage.removeItem('ather_stats_csv_url');
    setCsvUrl(null);
    setData([]);
    setLoading(false);
    setError(null);
    setMonthlyData([]);
    setActivityData({});
  };

  // Derived Filtered Data
  const filteredData = data.filter(r => {
    const matchesMonth = filterMonth === 'all' || `${r.year}-${r.month}` === filterMonth;
    const matchesDistance = !filterLongRides || parseFloat(r.distance) >= 10;
    const matchesMonthChart = !selectedMonthFilter || `${r.year}-${r.month}` === selectedMonthFilter;
    return matchesMonth && matchesDistance && matchesMonthChart;
  });

  // Reactive Totals Calculation
  useEffect(() => {
    if (filteredData.length > 0) {
      const totalDist = filteredData.reduce((acc, r) => acc + parseFloat(r.distance || 0), 0);
      const avgEff = filteredData.reduce((acc, r) => acc + parseFloat(r.efficiency || 0), 0) / filteredData.length;
      const maxSpeed = Math.max(...filteredData.map(r => r.topSpeed || 0));
      const totalDuration = filteredData.reduce((acc, r) => acc + parseFloat(r.duration || 0), 0);
      const totalEnergy = filteredData.reduce((acc, r) => acc + parseFloat(r.energyUsed || 0), 0);

      const b = filteredData.reduce((acc, r) => {
        acc.riding += parseFloat(r.riding_m || 0);
        acc.braking += parseFloat(r.braking_m || 0);
        acc.coasting += parseFloat(r.coasting_m || 0);
        return acc;
      }, { riding: 0, braking: 0, coasting: 0 });

      const totalM = b.riding + b.braking + b.coasting;

      setTotals({
        distance: totalDist.toFixed(1),
        efficiency: avgEff.toFixed(1),
        topSpeed: maxSpeed.toFixed(1),
        rides: filteredData.length,
        duration: totalDuration.toFixed(0),
        energy: (totalEnergy / 1000).toFixed(2),
        behavior: {
          riding: totalM > 0 ? ((b.riding / totalM) * 100).toFixed(1) : 0,
          braking: totalM > 0 ? ((b.braking / totalM) * 100).toFixed(1) : 0,
          coasting: totalM > 0 ? ((b.coasting / totalM) * 100).toFixed(1) : 0,
        }
      });
    } else {
      // Reset totals if no filtered data
      setTotals({
        distance: 0, efficiency: 0, topSpeed: 0, rides: 0, duration: 0, energy: 0,
        behavior: { riding: 0, braking: 0, coasting: 0 }
      });
    }
  }, [data, filterMonth, filterLongRides]); // Depend on data, filterMonth, filterLongRides

  // NOW we can return early for Setup Page
  if (!csvUrl) {
    return <SetupPage onConnect={handleConnect} />;
  }

  // And for Loading State
  if (loading) {
    return (
      <div className="splash-screen">
        <div className="splash-content">
          <img src="pwa-icon.png" alt="Ather Stats Logo" className="splash-logo" />
          <div className="spinner"></div>
          <span className="splash-title">Ather Stats</span>

          <button
            onClick={() => {
              setLoading(false);
              if (!data || data.length === 0) {
                handleDisconnect(); // Only reset if we truly have no data yet
              }
            }}
            style={{
              marginTop: '1rem',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Taking too long? Cancel
          </button>
        </div>
      </div>
    );
  }

  const availableMonths = Array.from(new Set(data.map(r => `${r.year || 'Unknown'}-${r.month || '01'}`)))
    .sort((a, b) => b.localeCompare(a))
    .map(key => {
      const parts = key.split('-');
      const y = parts[0];
      const m = parts[1];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(m, 10) - 1;
      const monthLabel = monthIndex >= 0 && monthIndex < 12 ? monthNames[monthIndex] : 'Unknown';
      return { key, label: `${monthLabel} ${y}` };
    });

  const behaviorPieData = theme === 'dark' ? [
    { name: 'Active Riding', value: parseFloat(totals.behavior.riding), color: '#00E676' },
    { name: 'Braking', value: parseFloat(totals.behavior.braking), color: '#FFD600' },
    { name: 'Coasting', value: parseFloat(totals.behavior.coasting), color: '#29B6F6' },
  ] : [
    { name: 'Active Riding', value: parseFloat(totals.behavior.riding), color: '#006A6A' },
    { name: 'Braking', value: parseFloat(totals.behavior.braking), color: '#FFD600' },
    { name: 'Coasting', value: parseFloat(totals.behavior.coasting), color: '#4A6363' },
  ];

  const modeColors = theme === 'dark' ? {
    Eco: '#00E676', SmartEco: '#00C853', Ride: '#29B6F6', Sport: '#FFD600', Warp: '#FF5252', Zip: '#AA00FF'
  } : {
    Eco: '#006A6A', SmartEco: '#329696', Ride: '#4A6363', Sport: '#FFD600', Warp: '#BA1A1A', Zip: '#4B607C'
  };

  const modeChartData = filteredData.slice(-15).map(r => ({
    date: r.date,
    Eco: parseFloat((r.modes.Eco / 1000).toFixed(2)),
    SmartEco: parseFloat((r.modes.SmartEco / 1000).toFixed(2)),
    Ride: parseFloat((r.modes.Ride / 1000).toFixed(2)),
    Sport: parseFloat((r.modes.Sport / 1000).toFixed(2)),
    Warp: parseFloat((r.modes.Warp / 1000).toFixed(2)),
    Zip: parseFloat((r.modes.Zip / 1000).toFixed(2)),
  }));

  const aggregatedModeStats = filteredData.reduce((acc, r) => {
    Object.entries(r.modes).forEach(([mode, dist]) => {
      acc[mode] = (acc[mode] || 0) + (dist / 1000);
    });
    return acc;
  }, {});

  const aggregatedChartData = Object.entries(aggregatedModeStats)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(1)) }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="dashboard-container">
      <div className="bg-ornaments">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      {selectedRide && <RideModal ride={selectedRide} onClose={() => setSelectedRide(null)} theme={theme} modeColors={modeColors} />}
      <header>
        <div className="header-main">
          <div>
            <h1>Ather Stats</h1>
            <p className="subtitle">Comprehensive performance analytics</p>
          </div>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="header-actions">
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Months</option>
              {availableMonths.map(m => (
                <option key={m.key} value={m.key}>{m.label}</option>
              ))}
            </select>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filterLongRides}
                onChange={(e) => setFilterLongRides(e.target.checked)}
              />
              Long Rides ({">"}10km)
            </label>
          </div>

          {/* Desktop buttons */}
          <div className="desktop-actions">
            <button className="btn-refresh btn-icon" onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="btn-refresh" onClick={handleDisconnect} style={{ background: 'var(--card-bg)', border: '1px solid var(--outline)', color: 'var(--text-primary)' }} aria-label="Disconnect">
              <span style={{ fontSize: '0.9rem' }}>Disconnect</span>
            </button>
            <button className="btn-refresh" onClick={() => setRefreshTrigger(t => t + 1)}>
              <RefreshCw size={18} /> Refresh
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="mobile-menu" onClick={() => setMobileMenuOpen(false)}>
            <div onClick={e => e.stopPropagation()}>
              <button className="mobile-menu-item" onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}>
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { setRefreshTrigger(t => t + 1); setMobileMenuOpen(false); }}>
                <RefreshCw size={20} />
                <span>Refresh Data</span>
              </button>
              <button className="mobile-menu-item disconnect" onClick={() => { handleDisconnect(); setMobileMenuOpen(false); }}>
                <X size={20} />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <nav className="main-nav">
        <button
          className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          <LayoutDashboard size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Dashboard
        </button>
        <button
          className={`nav-tab ${currentView === 'summary' ? 'active' : ''}`}
          onClick={() => setCurrentView('summary')}
        >
          <BarChart3 size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Summary
        </button>
        <button
          className={`nav-tab ${currentView === 'vehicle' ? 'active' : ''}`}
          onClick={() => setCurrentView('vehicle')}
        >
          <Gauge size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Vehicle
        </button>
      </nav>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="error-banner"
            style={{
              background: 'rgba(255, 82, 82, 0.1)',
              border: '1px solid var(--error)',
              color: 'var(--error)',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontWeight: 500
            }}
          >
            <ShieldAlert size={20} />
            {error}
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {currentView === 'summary' ? (
        <SummaryPage data={data} theme={theme} />
      ) : currentView === 'vehicle' ? (
        <div className="vehicle-view">
          <div className="chart-card">
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Ather 450X - 3D Perspective</h3>
            <Scooter3DView />
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Move your mouse over the scooter to experience 3D depth perception.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="chart-card" style={{ marginBottom: '2.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>Activity Heatmap</h3>
              <div className="filter-group" style={{ padding: '0.4rem 1rem' }}>
                <span style={{ fontSize: '0.8rem', marginRight: '0.5rem' }}>Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="filter-select"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
            <ActivityCalendar activityData={activityData} year={selectedYear} />
          </div>

          <div className="stats-grid">
            <StatCard label="Total Distance" value={totals.distance} unit="km" icon={Map} />
            <StatCard label="Riding Time" value={totals.duration} unit="mins" icon={Clock} />
            <StatCard label="Energy Used" value={totals.energy} unit="kWh" icon={Battery} />
            <StatCard label="Avg Efficiency" value={totals.efficiency} unit="Wh/km" icon={Zap} />
            <StatCard label="Max Speed" value={totals.topSpeed} unit="km/h" icon={Gauge} />
            <StatCard label="Total Rides" value={totals.rides} unit="" icon={Activity} />
          </div>

          <div className="charts-section" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="chart-card">
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Efficiency Trend (Wh/km)</h3>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <AreaChart data={filteredData.slice(-30)}>
                    <defs>
                      <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--secondary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                    <XAxis dataKey="date" hide />
                    <YAxis stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="efficiency" stroke="var(--secondary)" fillOpacity={1} fill="url(#colorEff)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Overall Riding Behavior</h3>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={behaviorPieData}
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={8}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {behaviorPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="charts-section" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' }}>
            <div className="chart-card">
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Mode Usage - Last 15 Rides (km)</h3>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={modeChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                    <XAxis dataKey="date" fontSize={10} stroke="var(--text-secondary)" />
                    <YAxis
                      stroke="var(--text-secondary)"
                      fontSize={12}
                      label={{ value: 'km', angle: -90, position: 'insideLeft', fill: 'var(--text-secondary)', offset: 10 }}
                    />
                    <Tooltip
                      formatter={(val) => `${val} km`}
                    />
                    <Legend />
                    <Bar dataKey="Eco" stackId="a" fill={modeColors.Eco} />
                    <Bar dataKey="SmartEco" stackId="a" fill={modeColors.SmartEco} />
                    <Bar dataKey="Ride" stackId="a" fill={modeColors.Ride} />
                    <Bar dataKey="Sport" stackId="a" fill={modeColors.Sport} />
                    <Bar dataKey="Warp" stackId="a" fill={modeColors.Warp} />
                    <Bar dataKey="Zip" stackId="a" fill={modeColors.Zip} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>Lifetime Distance by Mode (km)</h3>
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={aggregatedChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={12} width={70} />
                    <Tooltip
                      cursor={{ fill: 'var(--card-border)' }}
                    />
                    <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="charts-section" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
            <EnhancedMonthlyChart
              monthlyData={monthlyData}
              selectedMonthFilter={selectedMonthFilter}
              onMonthClick={(monthKey) => {
                setSelectedMonthFilter(selectedMonthFilter === monthKey ? null : monthKey);
              }}
            />
          </div>

          <div className="table-section">
            <h3 style={{ marginBottom: '1.5rem' }}>Detailed Ride Analytics</h3>
            <table>
              <thead>
                <tr>
                  <th>Date / ID</th>
                  <th>Distance</th>
                  <th>Duration</th>
                  <th>Efficiency</th>
                  <th>Behavior (R/B/C)</th>
                  <th>SOC Usage</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.slice().reverse().map((ride, i) => (
                  <tr key={i} onClick={() => setSelectedRide(ride)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Maximize2 size={12} style={{ color: 'var(--text-secondary)' }} />
                        <div>
                          <div style={{ fontWeight: '600' }}>{ride.date}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{ride.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{ride.distance} km</td>
                    <td>{ride.duration} min</td>
                    <td>
                      <div>{ride.efficiency} Wh/km</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={10} /> {ride.efficiency_km_kwh} km/kWh
                      </div>
                    </td>
                    <td style={{ minWidth: '200px' }}>
                      <BehaviorBar behavior={ride.behavior} />
                      <div className="behavior-legend">
                        <div className="legend-item"><div className="dot behavior-riding"></div> {ride.behavior.riding}%</div>
                        <div className="legend-item"><div className="dot behavior-braking"></div> {ride.behavior.braking}%</div>
                        <div className="legend-item"><div className="dot behavior-coasting"></div> {ride.behavior.coasting}%</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{
                            background: ride.socPercent < 15 ? 'var(--error)' : 'linear-gradient(90deg, #29B6F6, #00E676)',
                            height: '100%',
                            width: `${Math.min(ride.socPercent, 100)}%`
                          }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{ride.socPercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
