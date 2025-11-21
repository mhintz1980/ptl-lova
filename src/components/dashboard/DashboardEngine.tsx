
import { useMemo, useState, useEffect } from 'react';
import { TOPIC_CONFIGS, ChartId, DashboardFilters } from './dashboardConfig';
import { CHART_REGISTRY } from './chartRegistry';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronRight, FilterX } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const EMPTY_FILTERS: DashboardFilters = {
    dateRange: { from: null, to: null },
};

const FAVORITES_KEY = 'pumptracker.dashboard.favorites';

export function DashboardEngine() {
    const [currentTopicIndex, setCurrentTopicIndex] = useState(0);
    const [filters, setFilters] = useState<DashboardFilters>(EMPTY_FILTERS);
    const [favoriteChartIds, setFavoriteChartIds] = useState<ChartId[]>([]);
    const [showFavorites, setShowFavorites] = useState(false);

    // Load favorites from localStorage
    useEffect(() => {
        try {
            const raw = localStorage.getItem(FAVORITES_KEY);
            if (raw) {
                setFavoriteChartIds(JSON.parse(raw));
            }
        } catch {
            // ignore
        }
    }, []);

    // Persist favorites
    useEffect(() => {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteChartIds));
    }, [favoriteChartIds]);

    const currentTopic = TOPIC_CONFIGS[currentTopicIndex];

    const chartIdsToRender: ChartId[] = useMemo(() => {
        if (showFavorites && favoriteChartIds.length > 0) {
            return favoriteChartIds;
        }
        return currentTopic.chartIds;
    }, [showFavorites, favoriteChartIds, currentTopic]);

    const handleNextTopic = () => {
        setShowFavorites(false);
        setFilters(EMPTY_FILTERS); // reset drilldowns when you change the big view
        setCurrentTopicIndex((prev) => (prev + 1) % TOPIC_CONFIGS.length);
    };

    const toggleFavorite = (chartId: ChartId) => {
        setFavoriteChartIds((prev) =>
            prev.includes(chartId)
                ? prev.filter((id) => id !== chartId)
                : [...prev, chartId],
        );
    };

    const handleDrilldown = (update: Partial<DashboardFilters>) => {
        setFilters((prev) => ({ ...prev, ...update }));
    };

    const clearFilters = () => setFilters(EMPTY_FILTERS);

    const hasActiveFilters = Object.keys(filters).some(
        (k) => k !== 'dateRange' && filters[k as keyof DashboardFilters] !== undefined
    );

    return (
        <div className="flex flex-col gap-6 p-2 md:p-4 animate-in fade-in duration-500">
            {/* Header / Controls */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {showFavorites ? 'My Dashboard' : currentTopic.label}
                        </h1>
                        {hasActiveFilters && (
                            <Badge variant="secondary" className="animate-in zoom-in">
                                Filtered
                            </Badge>
                        )}
                    </div>
                    {!showFavorites && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Topic {currentTopicIndex + 1} of {TOPIC_CONFIGS.length}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {hasActiveFilters && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            className="gap-2 text-muted-foreground hover:text-foreground"
                        >
                            <FilterX className="h-4 w-4" />
                            Clear Filters
                        </Button>
                    )}

                    <Button
                        variant={showFavorites ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowFavorites((prev) => !prev)}
                        className="gap-2"
                    >
                        <Star className={`h - 4 w - 4 ${showFavorites ? "fill-current" : ""} `} />
                        {showFavorites ? 'Show Topic View' : 'Favorites'}
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextTopic}
                        className="gap-2 group"
                    >
                        Next Topic
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </div>

            {/* Filters summary (for drilldowns) */}
            {hasActiveFilters && (
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(filters).map(([key, value]) => {
                        if (key === 'dateRange' || !value) return null;
                        return (
                            <Badge key={key} variant="outline" className="px-3 py-1 text-sm bg-background/50 backdrop-blur-sm">
                                <span className="opacity-70 mr-1 capitalize">{key.replace('Id', '')}:</span>
                                <span className="font-medium">{String(value)}</span>
                            </Badge>
                        );
                    })}
                </div>
            )}

            {/* Charts grid */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                    {chartIdsToRender.map((chartId) => {
                        const cfg = CHART_REGISTRY[chartId];
                        if (!cfg) return null;

                        const ChartComponent = cfg.component;
                        const isFav = favoriteChartIds.includes(chartId);
                        const colSpan = cfg.defaultSize === 'lg' ? 'md:col-span-2 xl:col-span-2' : 'col-span-1';

                        return (
                            <motion.div
                                key={chartId}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className={`relative rounded-3xl border border-border/40 bg-card/50 backdrop-blur-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:border-border/80 group ${colSpan}`}
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div>
                                        <h2 className="text-lg font-semibold tracking-tight">{cfg.title}</h2>
                                        {cfg.description && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {cfg.description}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => toggleFavorite(chartId)}
                                        className={`p-1.5 rounded-full transition-colors ${isFav ? 'text-yellow-400 bg-yellow-400/10' : 'text-muted-foreground/30 hover:text-yellow-400 hover:bg-yellow-400/10'}`}
                                        aria-label="Toggle favorite"
                                    >
                                        <Star className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                                    </button>
                                </div>

                                <div className="h-[300px] w-full">
                                    <ChartComponent
                                        filters={filters}
                                        onDrilldown={handleDrilldown}
                                    />
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
