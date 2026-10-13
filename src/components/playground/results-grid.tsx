"use client";

import { useMemo, useState } from "react";
import {
  useTable,
  createCoreRowModel,
  createSortedRowModel,
  createFilteredRowModel,
  createPaginatedRowModel,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search, Copy } from "lucide-react";
import type { QueryResult } from "@/types/query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const PAGE_SIZES = [10, 25, 50, 100];

export function ResultsGrid({ result }: { result: QueryResult }) {
  const { push } = useToast();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [pageSize, setPageSize] = useState(25);

  const columns = useMemo(() =>
    () =>
      result.columns.map((c) => ({
        id: c.name,
        accessorKey: c.name,
        header: () => (
          <div className="flex flex-col">
            <span className="font-mono font-medium">{c.name}</span>
            <span className="text-[10px] text-muted-foreground font-normal">{c.type}</span>
          </div>
        ),
        cell: ({ column, row, getValue }: { getValue: () => unknown }) => {
          const v = getValue();
          if (v === null || v === undefined) {
            return <span className="text-muted-foreground/60 italic text-xs">NULL</span>;
          }
          const s = String(v);
          return (
            <span
              className="font-mono text-xs"
              title={s}
            >
              {s.length > 60 ? s.slice(0, 60) + "…" : s}
            </span>
          );
        },
        enableSorting: true,
      })),
    [result.columns]
  );

  const table = useTable({
    data: result.rows,
    columns,
    state: { sorting, globalFilter, pagination: { pageSize, pageIndex: 0 } },
    onStateChange: setSorting,
    getCoreRowModel: createCoreRowModel(),
    getSortedRowModel: createSortedRowModel(),
    getFilteredRowModel: createFilteredRowModel(),
    getPaginationRowModel: createPaginatedRowModel(),
  });

  const pageCount = table.getPageCount();
  const pageIndex = table.state.pagination.pageIndex;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Filter rows…"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-7 h-8 text-xs"
            aria-label="Filter results"
          />
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>{table.getFilteredRowModel().rows.length} of {result.rowCount} rows</span>
          {result.truncated && <span className="text-warning">(showing first {result.rows.length})</span>}
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="border-b border-border">
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left font-medium text-foreground/80 cursor-pointer select-none hover:text-foreground"
                    onClick={header.column.getToggleSortingHandler()}
                    scope="col"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && <ArrowUp className="h-3 w-3" />}
                      {header.column.getIsSorted() === "desc" && <ArrowDown className="h-3 w-3" />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-border/50 hover:bg-secondary/30"
                onDoubleClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(row.original));
                  push("info", "Row copied as JSON.");
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-3 py-1.5 max-w-[240px]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted-foreground text-sm">
                  {result.rows.length === 0 ? "Query returned no rows." : "No rows match the filter."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded border border-input bg-background px-1.5 py-1 text-xs"
            aria-label="Rows per page"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} aria-label="Previous page">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-7 w-7" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} aria-label="Next page">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
