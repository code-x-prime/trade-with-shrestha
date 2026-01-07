'use client';

import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Filters({
    filters = [],
    sortOptions = [],
    selectedSort,
    onSortChange,
    onFilterChange,
    onClearFilters,
    className,
}) {
    const activeFiltersCount = filters.filter(f => f.value).length;

    return (
        <div className={cn('flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between', className)}>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filters:</span>
                </div>
                {filters.map((filter) => (
                    <Select
                        key={filter.key}
                        value={filter.value || ''}
                        onValueChange={(value) => onFilterChange(filter.key, value === 'all' ? '' : value)}
                    >
                        <SelectTrigger className="w-[140px] sm:w-[160px] h-9">
                            <SelectValue placeholder={filter.label} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All {filter.label}</SelectItem>
                            {filter.options.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ))}
                {activeFiltersCount > 0 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearFilters}
                        className="h-9 text-xs"
                    >
                        <X className="h-3 w-3 mr-1" />
                        Clear ({activeFiltersCount})
                    </Button>
                )}
            </div>

            {/* Sort */}
            {sortOptions.length > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground hidden sm:inline">Sort:</span>
                    <Select value={selectedSort} onValueChange={onSortChange}>
                        <SelectTrigger className="w-[160px] sm:w-[180px] h-9">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            {sortOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
        </div>
    );
}

