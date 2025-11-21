import { Pump } from "../../types";
import { X } from "lucide-react";
import { Button } from "./Button";
import { format } from "date-fns";

interface PumpDetailModalProps {
    pump: Pump | null;
    onClose: () => void;
}

export function PumpDetailModal({ pump, onClose }: PumpDetailModalProps) {
    if (!pump) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="surface-elevated shadow-frame border border-border/40 rounded-2xl w-full max-w-md p-6 m-4 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-6 flex items-start justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            Pump Details
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Serial #{pump.serial}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 rounded-full hover:bg-muted"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/40 bg-card/50 p-4 transition-colors hover:bg-card/80">
                        <div>
                            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                PO Number
                            </p>
                            <p className="font-medium text-foreground">{pump.po}</p>
                        </div>
                        <div>
                            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                Customer
                            </p>
                            <p className="font-medium text-foreground">{pump.customer}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/40 bg-card/50 p-4 transition-colors hover:bg-card/80">
                        <div>
                            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                Model
                            </p>
                            <p className="font-medium text-foreground">{pump.model}</p>
                        </div>
                        <div>
                            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                Stage
                            </p>
                            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                                {pump.stage}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/40 bg-card/50 p-4 transition-colors hover:bg-card/80">
                        <div>
                            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                Priority
                            </p>
                            <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${pump.priority === "Urgent" || pump.priority === "Rush"
                                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                                        : pump.priority === "High"
                                            ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                                            : "bg-muted text-muted-foreground"
                                    }`}
                            >
                                {pump.priority}
                            </span>
                        </div>
                        <div>
                            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                Value
                            </p>
                            <p className="font-medium text-foreground">
                                ${pump.value.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    {pump.powder_color && (
                        <div className="rounded-xl border border-border/40 bg-card/50 p-4 transition-colors hover:bg-card/80">
                            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                Powder Coat Color
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full border border-border bg-current text-muted-foreground" />
                                <p className="font-medium text-foreground">
                                    {pump.powder_color}
                                </p>
                            </div>
                        </div>
                    )}

                    {pump.scheduledEnd && (
                        <div className="rounded-xl border border-border/40 bg-card/50 p-4 transition-colors hover:bg-card/80">
                            <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                                Scheduled End Date
                            </p>
                            <p className="font-medium text-foreground">
                                {format(new Date(pump.scheduledEnd), "EEEE, MMM d, yyyy")}
                            </p>
                        </div>
                    )}

                    <div className="rounded-xl border border-border/40 bg-card/50 p-4 transition-colors hover:bg-card/80">
                        <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                            Last Updated
                        </p>
                        <p className="font-medium text-foreground">
                            {format(new Date(pump.last_update), "EEE, MMM d, yyyy 'at' h:mm a")}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
