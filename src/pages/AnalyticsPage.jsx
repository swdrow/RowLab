import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { PageContainer } from '../components/Layout';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import {
  TrendingUp,
  Users,
  Ship,
  Target,
  Award,
  BarChart3,
  Activity
} from 'lucide-react';
import useLineupStore from '../store/lineupStore';
import SpotlightCard from '../components/ui/SpotlightCard';
import { FieldLines, OrganicBlob } from '../components/Generative';

// ============================================
// CUSTOM TOOLTIP - Precision Instrument style
// ============================================
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-void-elevated/95 backdrop-blur-xl border border-white/[0.08] rounded-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <p className="font-medium text-text-primary text-sm mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm font-mono">
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ============================================
// CHART CARD - Gradient stroke wrapper
// ============================================
const ChartCard = ({ title, icon: Icon, children, className = '', accentColor = 'green' }) => {
  const colorConfig = {
    green: {
      iconBg: 'bg-blade-blue/10',
      iconBorder: 'border-blade-blue/20',
      iconText: 'text-blade-blue',
      glow: 'shadow-[0_0_15px_rgba(0,112,243,0.15)]',
      spotlight: 'rgba(0, 112, 243, 0.08)'
    },
    orange: {
      iconBg: 'bg-warning-orange/10',
      iconBorder: 'border-warning-orange/20',
      iconText: 'text-warning-orange',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]',
      spotlight: 'rgba(245, 158, 11, 0.08)'
    },
    violet: {
      iconBg: 'bg-coxswain-violet/10',
      iconBorder: 'border-coxswain-violet/20',
      iconText: 'text-coxswain-violet',
      glow: 'shadow-[0_0_15px_rgba(124,58,237,0.15)]',
      spotlight: 'rgba(124, 58, 237, 0.08)'
    },
    red: {
      iconBg: 'bg-danger-red/10',
      iconBorder: 'border-danger-red/20',
      iconText: 'text-danger-red',
      glow: 'shadow-[0_0_15px_rgba(239,68,68,0.15)]',
      spotlight: 'rgba(239, 68, 68, 0.08)'
    }
  };

  const colors = colorConfig[accentColor] || colorConfig.green;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <SpotlightCard
        spotlightColor={colors.spotlight}
        className={`
          rounded-xl
          bg-void-elevated border border-white/5
          hover:translate-y-[-2px]
          hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.4)]
          transition-all duration-150 ease-out
          ${className}
        `}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className={`w-10 h-10 rounded-xl ${colors.iconBg} border ${colors.iconBorder} flex items-center justify-center ${colors.glow}`}>
              <Icon className={`w-5 h-5 ${colors.iconText}`} />
            </div>
            <h3 className="text-base font-display font-semibold text-text-primary tracking-[-0.02em]">{title}</h3>
          </div>
          {children}
        </div>
      </SpotlightCard>
    </motion.div>
  );
};

// ============================================
// STAT CARD - Compact stat display
// ============================================
const StatCard = ({ icon: Icon, value, label, accentColor = 'green' }) => {
  const colorConfig = {
    green: {
      iconBg: 'bg-blade-blue/10',
      iconBorder: 'border-blade-blue/20',
      iconText: 'text-blade-blue',
      glow: 'shadow-[0_0_15px_rgba(0,112,243,0.15)]'
    },
    orange: {
      iconBg: 'bg-warning-orange/10',
      iconBorder: 'border-warning-orange/20',
      iconText: 'text-warning-orange',
      glow: 'shadow-[0_0_15px_rgba(245,158,11,0.15)]'
    },
    violet: {
      iconBg: 'bg-coxswain-violet/10',
      iconBorder: 'border-coxswain-violet/20',
      iconText: 'text-coxswain-violet',
      glow: 'shadow-[0_0_15px_rgba(124,58,237,0.15)]'
    }
  };

  const colors = colorConfig[accentColor] || colorConfig.green;

  return (
    <SpotlightCard
      className={`
        rounded-xl
        bg-void-elevated border border-white/5
        hover:translate-y-[-2px]
        hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.4)]
        transition-all duration-150 ease-out
      `}
    >
      <div className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl ${colors.iconBg} border ${colors.iconBorder} flex items-center justify-center ${colors.glow}`}>
          <Icon className={`w-5 h-5 ${colors.iconText}`} />
        </div>
        <div>
          <div className="text-2xl font-mono font-bold text-text-primary tabular-nums">{value}</div>
          <div className="text-[10px] uppercase tracking-widest text-text-muted font-mono">{label}</div>
        </div>
      </div>
    </SpotlightCard>
  );
};

// Colors for charts - Precision Instrument palette
const COLORS = {
  primary: '#0070F3',      // Blade blue (primary accent)
  bladeBlue: '#0070F3',    // Blade blue (primary accent)
  orange: '#F59E0B',       // Warning orange
  violet: '#7C3AED',       // Coxswain violet
  port: '#EF4444',         // Danger red (port side)
  starboard: '#16A34A',    // Success green (starboard side)
  coxswain: '#7C3AED',     // Coxswain violet
  both: '#F59E0B'          // Warning orange for "Both" side
};

function AnalyticsPage() {
  const { athletes, activeBoats, boatConfigs, shells } = useLineupStore();

  // Calculate side distribution
  const sideDistribution = useMemo(() => {
    const counts = { Port: 0, Starboard: 0, Both: 0, Coxswain: 0 };
    athletes.forEach(athlete => {
      if (athlete.side === 'P') counts.Port++;
      else if (athlete.side === 'S') counts.Starboard++;
      else if (athlete.side === 'B') counts.Both++;
      else if (athlete.side === 'Cox') counts.Coxswain++;
    });
    return [
      { name: 'Port', value: counts.Port, color: COLORS.port },
      { name: 'Starboard', value: counts.Starboard, color: COLORS.starboard },
      { name: 'Both', value: counts.Both, color: COLORS.both },
      { name: 'Coxswain', value: counts.Coxswain, color: COLORS.coxswain }
    ].filter(d => d.value > 0);
  }, [athletes]);

  // Calculate country distribution (top 8)
  const countryDistribution = useMemo(() => {
    const counts = {};
    athletes.forEach(athlete => {
      const country = athlete.country || 'Unknown';
      counts[country] = (counts[country] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [athletes]);

  // Mock erg data trends
  const ergTrends = useMemo(() => {
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    return months.map((month, i) => ({
      month,
      avg2k: 400 - i * 3 + Math.random() * 5,
      teamBest: 375 - i * 2 + Math.random() * 3
    }));
  }, []);

  // Boat utilization data
  const boatUtilization = useMemo(() => {
    return boatConfigs.map(config => {
      const activeCount = activeBoats.filter(b =>
        b.boatConfig?.name === config.name
      ).length;
      return {
        name: config.name.replace('Varsity ', 'V').replace('Lightweight ', 'LW'),
        active: activeCount,
        available: 2
      };
    }).slice(0, 6);
  }, [boatConfigs, activeBoats]);

  // Athlete capability radar (mock data)
  const capabilityData = useMemo(() => [
    { subject: 'Endurance', A: 85, fullMark: 100 },
    { subject: 'Power', A: 78, fullMark: 100 },
    { subject: 'Technique', A: 90, fullMark: 100 },
    { subject: 'Racing', A: 82, fullMark: 100 },
    { subject: 'Teamwork', A: 95, fullMark: 100 },
    { subject: 'Consistency', A: 88, fullMark: 100 }
  ], []);

  return (
    <PageContainer maxWidth="2xl" className="relative py-4 sm:py-6">
      {/* Generative field lines - data flow aesthetic */}
      <FieldLines
        count={8}
        color="rgba(0, 112, 243, 0.03)"
        duration={18}
        direction="horizontal"
        className="fixed inset-0 z-0"
      />

      {/* Background atmosphere - void glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blade-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[400px] h-[400px] bg-danger-red/3 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.2)]">
            <BarChart3 size={22} className="text-blade-blue" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-text-primary tracking-[-0.02em]">
              Analytics
            </h1>
            <p className="text-sm text-text-secondary">
              Insights and trends from your team data
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <StatCard icon={Users} value={athletes.length} label="Total Athletes" accentColor="green" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard icon={Ship} value={boatConfigs.length} label="Boat Classes" accentColor="violet" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <StatCard icon={Target} value={shells.length} label="Named Shells" accentColor="orange" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <StatCard icon={Activity} value={activeBoats.length} label="Active Lineups" accentColor="green" />
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Side Distribution Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <ChartCard title="Side Distribution" icon={Users} accentColor="green">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sideDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {sideDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-3">
              {sideDistribution.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="text-xs text-text-muted font-mono">{entry.name}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </motion.div>

        {/* Country Distribution Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <ChartCard title="Athletes by Country" icon={Award} accentColor="orange">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    type="number"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    width={50}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="value"
                    fill="#0070F3"
                    radius={[0, 4, 4, 0]}
                    background={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* Erg Trends Line Chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <ChartCard title="Erg Score Trends" icon={TrendingUp} accentColor="green">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={ergTrends}>
                  <defs>
                    <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0070F3" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#0070F3" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorBest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="month"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    domain={['dataMin - 10', 'dataMax + 10']}
                    tickFormatter={(value) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    formatter={(value) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '16px' }}
                    formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>}
                  />
                  <Area
                    type="monotone"
                    dataKey="avg2k"
                    name="Team Avg"
                    stroke="#0070F3"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAvg)"
                  />
                  <Area
                    type="monotone"
                    dataKey="teamBest"
                    name="Team Best"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorBest)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* Team Capability Radar */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <ChartCard title="Team Capabilities" icon={Target} accentColor="violet">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={capabilityData}>
                  <PolarGrid stroke="rgba(255,255,255,0.06)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    stroke="rgba(255,255,255,0.4)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Radar
                    name="Team"
                    dataKey="A"
                    stroke="#7C3AED"
                    fill="#7C3AED"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        {/* Boat Utilization */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <ChartCard title="Boat Class Utilization" icon={Ship} accentColor="green">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={boatUtilization}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    wrapperStyle={{ paddingTop: '16px' }}
                    formatter={(value) => <span className="text-text-secondary text-sm">{value}</span>}
                  />
                  <Bar
                    dataKey="active"
                    name="Active"
                    fill="#0070F3"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="available"
                    name="Available"
                    fill="rgba(0,112,243,0.2)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>
      </div>

      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <SpotlightCard
          className={`
            mt-6 rounded-xl
            bg-void-elevated border border-white/5
          `}
        >
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-blade-blue/10 border border-blade-blue/20 flex items-center justify-center shadow-[0_0_20px_rgba(0,112,243,0.2)]">
              <BarChart3 className="w-8 h-8 text-blade-blue" />
            </div>
            <h3 className="text-lg font-display font-semibold text-text-primary mb-2 tracking-[-0.02em]">
              More Analytics Coming Soon
            </h3>
            <p className="text-text-secondary max-w-xl mx-auto text-sm leading-relaxed">
              We're building out comprehensive performance analytics including erg score tracking,
              race result analysis, and AI-powered lineup optimization. Upload your erg data to unlock
              personalized insights.
            </p>
          </div>
        </SpotlightCard>
      </motion.div>
    </PageContainer>
  );
}

export default AnalyticsPage;
