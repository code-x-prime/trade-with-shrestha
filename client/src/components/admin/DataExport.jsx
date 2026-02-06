'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { exportToCSV } from '@/lib/exportToExcel';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';

/**
 * data: array of rows
 * columns: [ { key: string, label: string, defaultInclude?: boolean } ]
 * dateKey: e.g. 'createdAt' (optional)
 * statusKey: e.g. 'status' (optional)
 * statusOptions: string[] (optional)
 * filename: string for download
 * fetchAllData: () => Promise<array> - if provided, dialog uses this to load full data for export
 */
export default function DataExport({
  data = [],
  columns = [],
  dateKey = 'createdAt',
  statusKey,
  statusOptions = [],
  filename = 'export',
  fetchAllData,
  disabled = false,
  buttonLabel = 'Export data',
}) {
  const [open, setOpen] = useState(false);
  const [exportData, setExportData] = useState(data);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCols, setSelectedCols] = useState(() =>
    columns.map((c) => c.defaultInclude !== false)
  );

  useEffect(() => {
    if (open && fetchAllData) {
      setLoading(true);
      fetchAllData()
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.data ?? []);
          setExportData(Array.isArray(list) ? list : []);
        })
        .catch(() => {
          setExportData(data);
          toast.error('Could not load full data');
        })
        .finally(() => setLoading(false));
    } else if (open) {
      setExportData(data);
    }
  }, [open, fetchAllData, data]);

  const filtered = exportData.filter((row) => {
    if (dateKey && dateFrom) {
      const d = new Date(row[dateKey]);
      if (isNaN(d) || d < new Date(dateFrom + 'T00:00:00')) return false;
    }
    if (dateKey && dateTo) {
      const d = new Date(row[dateKey]);
      if (isNaN(d) || d > new Date(dateTo + 'T23:59:59')) return false;
    }
    if (statusKey && statusFilter && row[statusKey] !== statusFilter) return false;
    return true;
  });

  const colsToExport = columns.filter((_, i) => selectedCols[i]);

  const handleExport = () => {
    if (!colsToExport.length) {
      toast.error('Select at least one column');
      return;
    }
    exportToCSV(filtered, colsToExport, filename);
    toast.success(`Exported ${filtered.length} rows`);
    setOpen(false);
  };

  const toggleCol = (i) => {
    setSelectedCols((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} disabled={disabled} className="gap-2">
        <FileDown className="h-4 w-4" />
        {buttonLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export to Excel</DialogTitle>
            <DialogDescription>
              Filter by date and status, choose columns, then export. By default all data is included.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {dateKey && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Date from</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Date to</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            )}
            {statusKey && statusOptions.length > 0 && (
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {statusOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label className="text-xs mb-2 block">Columns to include</Label>
              <div className="flex flex-wrap gap-3 border rounded-lg p-3 bg-muted/30">
                {columns.map((c, i) => (
                  <label key={c.key} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={selectedCols[i]}
                      onCheckedChange={() => toggleCol(i)}
                    />
                    <span className="text-sm">{c.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? 'Loading…' : `${filtered.length} row(s) will be exported.`}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleExport} disabled={loading || filtered.length === 0}>
              Export CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
