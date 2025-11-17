import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export interface SearchFilters {
  query: string;
  dateFrom?: Date;
  dateTo?: Date;
  messageType?: string;
}

interface MessageSearchProps {
  onSearch: (filters: SearchFilters) => void;
}

export function MessageSearch({ onSearch }: MessageSearchProps) {
  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [messageType, setMessageType] = useState<string>();
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    onSearch({
      query,
      dateFrom,
      dateTo,
      messageType,
    });
  };

  const clearFilters = () => {
    setQuery("");
    setDateFrom(undefined);
    setDateTo(undefined);
    setMessageType(undefined);
    onSearch({ query: "" });
  };

  const hasActiveFilters = dateFrom || dateTo || messageType;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={hasActiveFilters ? "border-pastel-blue" : ""}
        >
          <Filter className="w-4 h-4" />
        </Button>
        {(query || hasActiveFilters) && (
          <Button variant="ghost" size="icon" onClick={clearFilters}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 bg-muted/30 rounded-lg">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {dateTo ? format(dateTo, "MMM d, yyyy") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Select value={messageType} onValueChange={setMessageType}>
            <SelectTrigger>
              <SelectValue placeholder="Message type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="file">Files</SelectItem>
              <SelectItem value="image">Images</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleSearch} className="md:col-span-3">
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}
