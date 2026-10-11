import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { cropDisplayName } from '../data/dummyData';
import { useLang } from '../i18n/useLang';
import './ProfitChart.css';

export default function ProfitChart({ plans }) {
  const { t, lang, crop: loc } = useLang();
  const data = plans.map((p) => ({
    name: lang === 'ta' ? loc(p.crop).localName : p.crop.name,
    fullName: cropDisplayName(loc(p.crop)),
    Investment: p.crop.investment,
    Profit: p.profit ?? 0,
  }));

  const totalInvestment = data.reduce((s, d) => s + d.Investment, 0);
  const totalProfit = data.reduce((s, d) => s + d.Profit, 0);

  return (
    <motion.div
      className="profit-chart-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="profit-chart-head">
        <div>
          <p className="eyebrow">{t('chart.eyebrow')}</p>
          <h3 className="profit-chart-title">{t('chart.title')}</h3>
        </div>
        <div className="profit-chart-totals">
          <span>{t('chart.invested')} <strong>₹{totalInvestment.toLocaleString('en-IN')}</strong></span>
          <span>{t('chart.earned')} <strong>₹{totalProfit.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      <div className="profit-chart-body">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(26,20,16,0.08)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'rgba(26,20,16,0.6)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'rgba(26,20,16,0.5)' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
              contentStyle={{ borderRadius: 10, border: '1px solid rgba(26,20,16,0.1)', fontSize: '0.85rem' }}
            />
            <Bar dataKey="Investment" name={t('chart.investment')} fill="#c1442c" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Profit" name={t('chart.profit')} fill="#6fa347" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
