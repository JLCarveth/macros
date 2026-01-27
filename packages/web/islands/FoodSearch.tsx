import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import type { NutritionRecordWithSource } from "@nutrition-llama/shared";

type Source = "all" | "user" | "system";

interface FoodSearchProps {
  onSelect: (food: NutritionRecordWithSource) => void;
  placeholder?: string;
}

export default function FoodSearch({ onSelect, placeholder = "Search foods..." }: FoodSearchProps) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<Source>("all");
  const [results, setResults] = useState<NutritionRecordWithSource[]>([]);
  const [counts, setCounts] = useState<{ user: number; system: number }>({ user: 0, system: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<number | null>(null);

  const fetchResults = useCallback(async (q: string, src: Source) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q, source: src, limit: "20" });
      const response = await fetch(`/api/foods/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results);
        setCounts(data.counts);
      }
    } catch (err) {
      console.error("Food search error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchResults(query, source);
    }, 300) as unknown as number;

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, source, fetchResults]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightIndex]) {
        (items[highlightIndex] as HTMLElement).scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightIndex]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < results.length) {
          handleSelect(results[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  const handleSelect = (food: NutritionRecordWithSource) => {
    onSelect(food);
    setQuery("");
    setIsOpen(false);
    setHighlightIndex(-1);
  };

  const handleSourceChange = (newSource: Source) => {
    setSource(newSource);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const tabClass = (tab: Source) =>
    `px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
      source === tab
        ? "bg-primary-600 text-white"
        : "text-gray-600 hover:bg-gray-100"
    }`;

  return (
    <div ref={containerRef} class="relative">
      {/* Source Tabs */}
      <div class="flex gap-1 mb-2 bg-gray-50 rounded-lg p-1">
        <button type="button" onClick={() => handleSourceChange("all")} class={tabClass("all")}>
          All
        </button>
        <button type="button" onClick={() => handleSourceChange("user")} class={tabClass("user")}>
          My Foods{counts.user > 0 ? ` (${counts.user})` : ""}
        </button>
        <button type="button" onClick={() => handleSourceChange("system")} class={tabClass("system")}>
          USDA Foods{counts.system > 0 ? ` (${counts.system})` : ""}
        </button>
      </div>

      {/* Search Input */}
      <div class="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onInput={(e) => {
            setQuery((e.target as HTMLInputElement).value);
            setIsOpen(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={source === "system" ? "Type to search USDA foods..." : placeholder}
          class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm"
        />
        {loading && (
          <div class="absolute right-3 top-1/2 -translate-y-1/2">
            <div class="h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto">
          {results.length > 0 ? (
            <ul ref={listRef} class="py-1">
              {results.map((food, index) => (
                <li
                  key={food.id}
                  onClick={() => handleSelect(food)}
                  onMouseEnter={() => setHighlightIndex(index)}
                  class={`px-3 py-2 cursor-pointer flex items-center justify-between ${
                    index === highlightIndex ? "bg-primary-50" : "hover:bg-gray-50"
                  }`}
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-medium text-gray-900 truncate">{food.name}</span>
                      {food.isSystem && (
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 flex-shrink-0">
                          USDA
                        </span>
                      )}
                    </div>
                  </div>
                  <span class="text-xs text-gray-500 ml-2 flex-shrink-0">
                    {food.calories} cal / {food.servingSizeValue}{food.servingSizeUnit}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div class="px-3 py-4 text-sm text-gray-500 text-center">
              {loading
                ? "Searching..."
                : source === "system" && query.length < 2
                ? "Type at least 2 characters to search USDA foods"
                : "No foods found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
