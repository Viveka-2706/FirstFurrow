import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from 'recharts';
import { cropDisplayName } from '../data/dummyData';
import { useLang } from '../i18n/useLang';
import './ProfitChart.css';

export default function ProfitChart({ plans }) {
  const { t, lang, crop: loc } = useLang();
  const [chartView, setChartView] = useState('comparison'); // 'comparison' | 'roi'

  const data = plans.map((p) => {
    const inv = p.crop.investment || 1;
    const prof = p.profit ?? 0;
    const roi = Math.round((prof / inv) * 100);
    return {
      name: lang === 'ta' ? loc(p.crop).localName : p.crop.name,
      fullName: cropDisplayName(loc(p.crop)),
      land: p.land,
      Investment: inv,
      Profit: prof,
      ROI: roi,
    };
  });

  const totalInvestment = data.reduce((s, d) => s + d.Investment, 0);
  const totalProfit = data.reduce((s, d) => s + d.Profit, 0);
  const avgRoi = totalInvestment > 0 ? Math.round((totalProfit / totalInvestment) * 100) : 0;
  const multiplier = totalInvestment > 0 ? ((totalInvestment + totalProfit) / totalInvestment).toFixed(2) : '1.0';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const item = data.find((d) => d.name === label) || {};

    return (
      <div className="profit-chart-tooltip">
        <p className="tooltip-title">{item.fullName || label}</p>
        <p className="tooltip-sub">{item.land} {t('acres')}</p>
        <div className="tooltip-metrics">
          <div className="tooltip-row">
            <span className="tooltip-dot dot-inv" />
            <span>{t('chart.investment')}:</span>
            <strong>₹{item.Investment?.toLocaleString('en-IN')}</strong>
          </div>
          <div className="tooltip-row">
            <span className="tooltip-dot dot-prof" />
            <span>{t('chart.profit')}:</span>
            <strong className={item.Profit >= 0 ? 'text-gain' : 'text-loss'}>
              ₹{item.Profit?.toLocaleString('en-IN')}
            </strong>
          </div>
          <div className="tooltip-row tooltip-roi-row">
            <span>ROI:</span>
            <span className={`tooltip-roi-badge ${item.ROI >= 0 ? 'is-pos' : 'is-neg'}`}>
              {item.ROI > 0 ? `+${item.ROI}%` : `${item.ROI}%`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className="profit-chart-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="profit-chart-head">
        <div>
          <div className="profit-chart-badge">{t('dash.orgBadge')}</div>
          <h3 className="profit-chart-title">{t('chart.title')}</h3>
        </div>

        <div className="profit-chart-controls">
          <div className="chart-view-toggle">
            <button
              type="button"
              className={`chart-view-btn ${chartView === 'comparison' ? 'is-active' : ''}`}
              onClick={() => setChartView('comparison')}
            >
              {t('chart.barView')}
            </button>
            <button
              type="button"
              className={`chart-view-btn ${chartView === 'roi' ? 'is-active' : ''}`}
              onClick={() => setChartView('roi')}
            >
              {t('chart.roiView')}
            </button>
          </div>
        </div>
      </div>

      {/* Organizational Financial Metrics Banner */}
      <div className="profit-chart-kpis">
        <div className="chart-kpi-item">
          <span className="kpi-label">{t('chart.invested')}</span>
          <span className="kpi-value">₹{totalInvestment.toLocaleString('en-IN')}</span>
        </div>
        <div className="chart-kpi-item">
          <span className="kpi-label">{t('chart.earned')}</span>
          <span className="kpi-value text-gain">₹{totalProfit.toLocaleString('en-IN')}</span>
        </div>
        <div className="chart-kpi-item">
          <span className="kpi-label">{t('chart.margin')}</span>
          <span className="kpi-value accent-badge">{avgRoi >= 0 ? `+${avgRoi}%` : `${avgRoi}%`}</span>
        </div>
        <div className="chart-kpi-item">
          <span className="kpi-label">{t('chart.multiplier')}</span>
          <span className="kpi-value">{multiplier}x</span>
        </div>
      </div>

      <div className="profit-chart-body">
        <ResponsiveContainer width="100%" height={260}>
          {chartView === 'comparison' ? (
            <BarChart data={data} margin={{ top: 14, right: 14, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="invGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#d35438" />
                  <stop offset="100%" stopColor="#ba381f" />
                </linearGradient>
                <linearGradient id="profGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6fa347" />
                  <stop offset="100%" stopColor="#4d7c2a" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,20,16,0.08)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'rgba(26,20,16,0.7)', fontWeight: 600 }}
                axisLine={{ stroke: 'rgba(26,20,16,0.15)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgba(26,20,16,0.55)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: '0.8rem' }}
              />
              <Bar
                dataKey="Investment"
                name={t('chart.investment')}
                fill="url(#invGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
              />
              <Bar
                dataKey="Profit"
                name={t('chart.profit')}
                fill="url(#profGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
              />
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ top: 14, right: 14, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="roiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2e7d32" />
                  <stop offset="100%" stopColor="#66bb6a" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,20,16,0.08)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12, fill: 'rgba(26,20,16,0.7)', fontWeight: 600 }}
                axisLine={{ stroke: 'rgba(26,20,16,0.15)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgba(26,20,16,0.55)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <ReferenceLine y={0} stroke="rgba(26,20,16,0.3)" />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="ROI"
                name={t('chart.roiView')}
                fill="url(#roiGradient)"
                radius={[6, 6, 0, 0]}
                maxBarSize={52}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
