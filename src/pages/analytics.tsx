import { useEffect, useMemo, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/button';
import { navigationUtils } from '../services/routes/constants';
import { fetchDefectCounts } from '../features/analytics/analytics-service';

type DefectRow = {
    day: string;
    comment: string;
    defect_count: number;
};

export default function AnalyticsPage() {
    const navigate = useNavigate();

    /* =======================
       PAGINATION / FETCH STATE
    ======================= */
    const [data, setData] = useState<DefectRow[]>([]);
    const [loading, setLoading] = useState(true);

    // backend pagination (kept even if UI not shown)
    //   const [page] = useState(1);
    //   const [limit] = useState(500); // fetch large batch for analytics view
    //   const [search] = useState('');

    /* =======================
       FILTER STATE
    ======================= */
    const [range, setRange] = useState<'today' | '7' | '30' | 'all'>('today');

    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [searchIssue,] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');


    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(searchInput);
        }, 500); // slower = safer

        return () => clearTimeout(handler);
    }, [searchInput]);



    const computedLimit = useMemo(() => {
        if (range === 'today') return 200;
        if (range === '7') return 200;
        if (range === '30') return 500;
        if (fromDate && toDate) return 800;
        return undefined;
    }, [range, fromDate, toDate]);


    useEffect(() => {
        setLoading(true);

        fetchDefectCounts({
            page: 1,
            limit: computedLimit,
            search: searchQuery,
        })
            .then(({ data }) => {
                setData(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [computedLimit, searchQuery]);



    /* =======================
       FILTERED DATA
    ======================= */
    const filteredData = useMemo(() => {
        let result = [...data];

        // custom date range
        if (fromDate && toDate) {
            const from = new Date(fromDate);
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);

            result = result.filter(d => {
                const day = new Date(d.day);
                return day >= from && day <= to;
            });
        }
        else if (range === 'today') {
            const today = new Date().toISOString().split('T')[0];

            result = result.filter(d =>
                d.day.split('T')[0] === today
            );
        }
        // preset range
        else if (range !== 'all') {
            const days = range === '7' ? 7 : 30;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);

            result = result.filter(d => new Date(d.day) >= cutoff);
        }

        // issue search
        if (searchIssue.trim()) {
            const q = searchIssue.toLowerCase();
            result = result.filter(d =>
                (d.comment || '').toLowerCase().includes(q),
            );
        }

        return result;
    }, [data, range, fromDate, toDate, searchIssue]);

    /* =======================
       KPIs
    ======================= */
    const totalDefects = useMemo(
        () => filteredData.reduce((s, d) => s + d.defect_count, 0),
        [filteredData],
    );

    const uniqueIssues = useMemo(
        () => new Set(filteredData.map(d => d.comment).filter(Boolean)).size,
        [filteredData],
    );

    const topIssue = useMemo(() => {
        return [...filteredData].sort(
            (a, b) => b.defect_count - a.defect_count,
        )[0];
    }, [filteredData]);

    /* =======================
       CHART DATA
    ======================= */
    const defectsByDay = useMemo(() => {
        const map: Record<string, number> = {};
        filteredData.forEach(d => {
            const day = d.day.split('T')[0];
            map[day] = (map[day] || 0) + d.defect_count;
        });

        return Object.entries(map).sort((a, b) =>
            a[0].localeCompare(b[0]),
        );
    }, [filteredData]);

    const lineChartData = {
        labels: defectsByDay.map(d => d[0]),
        datasets: [
            {
                label: 'Defects',
                data: defectsByDay.map(d => d[1]),
                borderColor: '#1d4ed8',
                backgroundColor: 'rgba(29,78,216,0.15)',
                tension: 0.3,
            },
        ],
    };

    const topIssues = useMemo(() => {
        const map: Record<string, number> = {};
        filteredData.forEach(d => {
            if (!d.comment) return;
            map[d.comment] = (map[d.comment] || 0) + d.defect_count;
        });

        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [filteredData]);

    const barChartData = {
        labels: topIssues.map(i => i[0]),
        datasets: [
            {
                data: topIssues.map(i => i[1]),
                backgroundColor: '#15803d',
            },
        ],
    };

    /* =======================
       EXPORT
    ======================= */
    const exportCSV = () => {
        const rows = [
            ['Date', 'Issue', 'Count'],
            ...filteredData.map(d => [
                d.day.split('T')[0],
                d.comment,
                d.defect_count,
            ]),
        ];

        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'defect-analytics.csv';
        link.click();
    };

    const handleLogout = () => navigationUtils.logout();

    if (loading) return <p className="p-6">Loading analytics…</p>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-1 rounded-md hover:bg-gray-100"
                        >
                            ←
                        </button>

                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Analytics Dashboard
                            </h1>
                            <p className="text-sm text-gray-500">
                                Defect insights
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            onClick={() => navigate('/analytics/issues')}
                            variant="secondary"
                            size="small"
                        >
                            View All Issues
                        </Button>

                        <Button
                            onClick={exportCSV}
                            variant="secondary"
                            size="small"
                        >
                            Export CSV
                        </Button>

                        <Button
                            onClick={handleLogout}
                            variant="secondary"
                            size="small"
                        >
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* FILTERS */}
                <div className="flex flex-wrap gap-4 items-end">
                   <div className="flex gap-2">
    {['today', '7', '30'].map(r => (
        <button
            key={r}
            onClick={() => {
                setRange(r as any);
                setFromDate('');
                setToDate('');
            }}
            className={`px-4 py-2 rounded-md text-sm border ${
                range === r && !fromDate
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300'
            }`}
        >
            {r === 'today'
                ? 'Today'
                : r === 'all'
                ? 'All Time'
                : `Last ${r} Days`}
        </button>
    ))}
</div>


                    <input
                        type="date"
                        value={fromDate}
                        onChange={e => {
                            setFromDate(e.target.value);
                            setRange('all');
                        }}
                        className="border rounded-md px-3 py-2 text-sm"
                    />

                    <input
                        type="date"
                        value={toDate}
                        onChange={e => {
                            setToDate(e.target.value);
                            setRange('all');
                        }}
                        className="border rounded-md px-3 py-2 text-sm"
                    />

                    <input
                        type="text"
                        placeholder="Search issue…"
                        value={searchInput}
                        onChange={e => setSearchInput(e.target.value)}
                        className="border rounded-md px-3 py-2 text-sm w-64"
                    />

                </div>

                {/* KPIs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-6"
                >
                    <KpiCard title="Total Defects" value={totalDefects} />
                    <KpiCard title="Unique Issues" value={uniqueIssues} />
                    <KpiCard
                        title="Top Issue"
                        value={
                            topIssue
                                ? `${topIssue.comment} (${topIssue.defect_count})`
                                : '-'
                        }
                    />
                </motion.div>

                {/* CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Section title="Defects Over Time">
                        <Line data={lineChartData} />
                    </Section>

                    <Section title="Top 10 Issues">
                        <Bar
                            data={barChartData}
                            options={{
                                indexAxis: 'y',
                                plugins: { legend: { display: false } },
                            }}
                        />
                    </Section>
                </div>

                {/* TABLE */}
                <Section title="Defect Details">
                    <div className="h-[420px] overflow-y-auto">
                        <table className="min-w-full table-fixed text-sm">
                            <thead className="sticky top-0 bg-gray-100">
                                <tr>
                                    <th className="w-32 px-4 py-3 text-left">Date</th>
                                    <th className="px-4 py-3 text-left">Issue</th>
                                    <th className="w-24 px-4 py-3 text-right">Count</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredData.map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            {r.day.split('T')[0]}
                                        </td>
                                        <td className="px-4 py-3 break-words">
                                            {r.comment || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium">
                                            {r.defect_count}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>
            </main>
        </div>
    );
}

/* =======================
   REUSABLE COMPONENTS
======================= */
function KpiCard({ title, value }: { title: string; value: string | number }) {
    return (
        <div className="bg-white rounded-xl border p-6">
            <p className="text-sm text-gray-500">{title}</p>
            <p className="mt-2 text-3xl font-semibold">{value}</p>
        </div>
    );
}

function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white rounded-xl border p-6 flex flex-col">
            <h3 className="text-lg font-medium mb-4">{title}</h3>
            <div className="flex-1 overflow-hidden">{children}</div>
        </div>
    );
}
