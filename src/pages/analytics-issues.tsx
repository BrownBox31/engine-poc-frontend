import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/button';
import { fetchCommentCounts } from '../features/analytics/analytics-service';
//import { Bar } from 'react-chartjs-2';
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';


type CommentCountRow = {
    comment: string;
    comment_count: number;
};

// type ApiResponse = {
//     success: boolean;
//     data: CommentCountRow[];
//     meta: {
//         page: number;
//         limit: number;
//         total: number;
//         totalPages: number;
//     };
// };

type SortField = 'comment' | 'comment_count';
type SortOrder = 'asc' | 'desc';

export default function AnalyticsIssuesPage() {
    const navigate = useNavigate();

    const [data, setData] = useState<CommentCountRow[]>([]);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    // sorting (client-side for current page)
    const [sortField, ] = useState<SortField>('comment_count');
    const [sortOrder, ] = useState<SortOrder>('desc');

    /* =======================
       FETCH DATA
    ======================= */
  useEffect(() => {
  setLoading(true);

  fetchCommentCounts({ page, limit, search })
    .then(({ data, meta }) => {
      setData(data);
      setTotalPages(meta.totalPages);
      setTotal(meta.total);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
}, [page, limit, search]);

    /* =======================
       SORT DATA (CURRENT PAGE)
    ======================= */
    const sortedData = useMemo(() => {
        const sorted = [...data].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];

            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            }

            return sortOrder === 'asc'
                ? String(aVal).localeCompare(String(bVal))
                : String(bVal).localeCompare(String(aVal));
        });

        return sorted;
    }, [data, sortField, sortOrder]);

    /* =======================
     FREQUENCY CHART DATA
  ======================= */
    // const frequencyChartData = useMemo(() => {
    //   const topIssues = [...sortedData]
    //     .sort((a, b) => b.comment_count - a.comment_count)
    //     .slice(0, 10);

    //   return {
    //     labels: topIssues.map(i => i.comment || 'Unknown'),
    //     datasets: [
    //       {
    //         label: 'Occurrences',
    //         data: topIssues.map(i => i.comment_count),
    //         backgroundColor: '#2563eb', // Tailwind blue-600
    //         borderRadius: 6,
    //       },
    //     ],
    //   };
    // }, [sortedData]);

    // const frequencyChartOptions = {
    //   indexAxis: 'y' as const,
    //   responsive: true,
    //   maintainAspectRatio: false,
    //   plugins: {
    //     legend: { display: false },
    //     tooltip: {
    //       callbacks: {
    //         label: (ctx: any) => ` ${ctx.raw} occurrences`,
    //       },
    //     },
    //   },
    //   scales: {
    //     x: {
    //       ticks: { precision: 0 },
    //       grid: { color: '#e5e7eb' },
    //     },
    //     y: {
    //       grid: { display: false },
    //     },
    //   },
    // };



    /* =======================
       EXPORT CSV (CURRENT PAGE)
    ======================= */
    const exportCSV = () => {
        const rows = [
            ['Issue', 'Count'],
            ...sortedData.map(d => [d.comment || '-', d.comment_count]),
        ];

        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `issue-frequency-page-${page}.csv`;
        link.click();
    };

    /* =======================
       SORT HANDLER
    ======================= */
    // const toggleSort = (field: SortField) => {
    //     if (sortField === field) {
    //         setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'));
    //     } else {
    //         setSortField(field);
    //         setSortOrder('asc');
    //     }
    // };

    /* =======================
       SEARCH HIGHLIGHT
    ======================= */
    const highlightText = (text: string) => {
        if (!search.trim()) return text;

        const regex = new RegExp(`(${search})`, 'ig');
        const parts = text.split(regex);

        return parts.map((part, i) =>
            part.toLowerCase() === search.toLowerCase() ? (
                <mark
                    key={i}
                    className="bg-yellow-200 px-0.5 rounded"
                >
                    {part}
                </mark>
            ) : (
                part
            ),
        );
    };

    const columns = useMemo<ColumnDef<CommentCountRow>[]>(
        () => [
            {
                accessorKey: 'comment',
                header: 'Issue',
                cell: info => (
                    <div className="whitespace-normal break-words">
                        {highlightText(info.getValue<string>() || '-')}
                    </div>
                ),
            },
            {
                accessorKey: 'comment_count',
                header: 'Count',
                cell: info => (
                    <div className="text-right font-semibold">
                        {info.getValue<number>()}
                    </div>
                ),
            },
        ],
        [search],
    );

    const table = useReactTable({
        data: sortedData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });


    return (
        <div className="min-h-screen bg-gray-50">
            {/* HEADER */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/analytics')}
                            className="p-1 rounded-md hover:bg-gray-100"
                        >
                            ←
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">
                                All Issues
                            </h1>
                            <p className="text-sm text-gray-500">
                                issue details
                            </p>
                        </div>
                    </div>

                    <Button onClick={exportCSV} variant="secondary" size="small">
                        Export CSV
                    </Button>
                </div>
            </header>

            {/* CONTENT */}
            <main className="max-w-7xl mx-auto px-6 py-8">
                {/* CONTROLS */}
                <div className="flex flex-wrap justify-between items-end gap-4 mb-4">
                    {/* SEARCH */}
                    <input
                        type="text"
                        placeholder="Search issue..."
                        value={search}
                        onChange={e => {
                            setSearch(e.target.value);
                            setPage(1);
                        }}
                        className="border rounded-md px-3 py-2 text-sm w-64"
                    />

                    {/* PAGE SIZE */}
                    <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-500">Rows per page</span>
                        <select
                            value={limit}
                            onChange={e => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="border rounded-md px-2 py-1"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                </div>

                {/* FREQUENCY GRAPH */}
                {/* <div className="bg-white border rounded-xl p-6 mb-6">
  <h2 className="text-lg font-semibold text-gray-900 mb-4">
    Issue Frequency (Top 10)
  </h2>

  {sortedData.length === 0 ? (
    <p className="text-sm text-gray-500">
      No data available for chart
    </p>
  ) : (
    <div className="h-[320px]">
      <Bar
        data={frequencyChartData}
        options={frequencyChartOptions}
      />
    </div>
  )}
</div> */}


                {/* TABLE */}
                {/* TABLE */}
                <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
                    <div className="max-h-[520px] overflow-auto">
                        <table className="min-w-full border-collapse text-sm">
                            <thead className="sticky top-0 bg-gray-100 z-10">
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th
                                                key={header.id}
                                                className="px-4 py-3 text-left font-semibold text-gray-600 border-b"
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext(),
                                                )}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>

                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                                            Loading data...
                                        </td>
                                    </tr>
                                )}

                                {!loading && table.getRowModel().rows.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="px-4 py-6 text-center text-gray-500">
                                            No issues found
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    table.getRowModel().rows.map(row => (
                                        <tr
                                            key={row.id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            {row.getVisibleCells().map(cell => (
                                                <td
                                                    key={cell.id}
                                                    className="px-4 py-3 border-b align-top"
                                                >
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext(),
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>


                {/* PAGINATION */}
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-500">
                        Page {page} of {totalPages} • Total {total}
                    </span>

                    <div className="flex gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-100"
                        >
                            Prev
                        </button>

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-gray-100"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
