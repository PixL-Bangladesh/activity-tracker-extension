import { useEffect, useMemo, useRef, useState } from 'react';
import { nanoid } from 'nanoid';
import { useNavigate } from 'react-router-dom';
import type { eventWithTime } from 'rrweb';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit as EditIcon,
  Download,
  Trash,
  Upload
} from 'lucide-react';

import {
  createColumnHelper,
  useReactTable,
  flexRender,
  getCoreRowModel,
  type SortingState,
  getSortedRowModel,
  type PaginationState,
} from '@tanstack/react-table';

import { type Session as BaseSession, EventName } from '~/types';
import Channel from '~/utils/channel';
import {
  deleteSessions,
  getAllSessions,
  downloadSessions,
  addSession,
  updateSession,
} from '~/utils/storage';

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Checkbox } from "~/components/ui/checkbox";
import { useToast } from "~/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

// Extend the Session type to include events
interface Session extends BaseSession {
  events: eventWithTime[];
}

const columnHelper = createColumnHelper<Session>();
const channel = new Channel();

export function SessionList() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'createTimestamp',
      desc: true,
    },
  ]);
  const [rowSelection, setRowSelection] = useState({});

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const fetchDataOptions = {
    pageIndex,
    pageSize,
  };

  const fetchData = (options: { pageIndex: number; pageSize: number }) => {
    return {
      rows: sessions.slice(
        options.pageIndex * options.pageSize,
        (options.pageIndex + 1) * options.pageSize,
      ),
      pageCount: Math.ceil(sessions.length / options.pageSize),
    };
  };

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
    }),
    [pageIndex, pageSize],
  );

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllRowsSelected()}
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
      }),
      columnHelper.accessor((row) => row.name, {
        cell: (info) => {
          const [isEditing, setIsEditing] = useState(false);
          const [value, setValue] = useState(info.getValue());

          const handleSave = () => {
            const session = info.row.original;
            updateSession({
              ...session,
              name: value,
            });
            setIsEditing(false);
          };

          return (
            <div className="relative flex items-center group">
              {isEditing ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="h-8 w-full"
                    onBlur={handleSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSave();
                      }
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <>
                  <span
                    className="cursor-pointer"
                    onClick={() => navigate(`/player/${info.row.original.id}`)}
                  >
                    {value}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 absolute right-0"
                    onClick={() => setIsEditing(true)}
                  >
                    <EditIcon className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                </>
              )}
            </div>
          );
        },
        header: 'Name',
      }),
      columnHelper.accessor((row) => row.createTimestamp, {
        cell: (info) => new Date(info.getValue()).toLocaleString(),
        header: 'Created At',
      }),
      columnHelper.accessor((row) => row.events?.length || 0, {
        cell: (info) => info.getValue(),
        header: 'Events',
      }),
      columnHelper.accessor((row) => row.recorderVersion, {
        cell: (info) => info.getValue(),
        header: 'ScreenTrail Version',
      }),
    ],
    [sessions],
  );

  const { rows, pageCount } = fetchData(fetchDataOptions);

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    pageCount,
  });

  useEffect(() => {
    void getAllSessions().then((sessionsData) => {
      // Cast the sessions to include events property
      setSessions(sessionsData as unknown as Session[]);
    });
    channel.on(EventName.SessionUpdated, () => {
      void getAllSessions().then((sessionsData) => {
        // Cast the sessions to include events property
        setSessions(sessionsData as unknown as Session[]);
      });
    });
  }, []);

  const handleDeleteSelected = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedIds = selectedRows.map((row) => row.original.id);
    void deleteSessions(selectedIds).then(() => {
      void getAllSessions().then((sessionsData) => {
        // Cast the sessions to include events property
        setSessions(sessionsData as unknown as Session[]);
        setRowSelection({});
        toast({
          title: 'Sessions deleted',
          description: `${selectedIds.length} sessions have been deleted.`,
        });
      });
    });
  };

  const handleDownloadSelected = () => {
    const selectedRows = table.getSelectedRowModel().rows;
    const selectedIds = selectedRows.map((row) => row.original.id);
    void downloadSessions(selectedIds);
  };

  const handleImportSessions = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!result) return;
        const parsedSessions = JSON.parse(result as string) as {
          id: string;
          name: string;
          events: eventWithTime[];
        }[];
        const promises = parsedSessions.map((session) => {
          return addSession({
            ...session,
            id: nanoid(),
            createTimestamp: Date.now(),
            modifyTimestamp: Date.now(),
            tags: [],
            recorderVersion: 'imported',
          }, session.events);
        });
        void Promise.all(promises).then(() => {
          void getAllSessions().then((sessionsData) => {
            // Cast the sessions to include events property
            setSessions(sessionsData as unknown as Session[]);
            toast({
              title: 'Sessions imported',
              description: `${promises.length} sessions have been imported.`,
            });
          });
        });
      } catch (e) {
        toast({
          title: 'Import failed',
          description: 'Failed to import sessions.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Sessions</h1>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportSessions}
            disabled={sessions.length === 0}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadSelected}
            disabled={Object.keys(rowSelection).length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={Object.keys(rowSelection).length === 0}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No sessions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {Object.keys(rowSelection).length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".json"
      />
    </div>
  );
}
