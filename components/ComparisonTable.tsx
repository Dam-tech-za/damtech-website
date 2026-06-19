type ComparisonColumn = {
  key: string;
  label: string;
};

type ComparisonTableProps = {
  title: string;
  columns: ComparisonColumn[];
  rows: Record<string, string>[];
};

export function ComparisonTable({
  title,
  columns,
  rows,
}: ComparisonTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <h3 className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold text-navy sm:px-6">
        {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-white text-slate-600">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 font-semibold sm:px-6"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row[columns[0]!.key]}
                className="border-b border-slate-100 last:border-0"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-4 py-3 align-top text-slate-700 sm:px-6"
                  >
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
