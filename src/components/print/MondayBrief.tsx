import { useApp } from "../../store";
import { useMemo, useState } from "react";
import { STAGES, Stage } from "../../types";
import { format } from "date-fns";

export function MondayBrief() {
    const { pumps } = useApp();
    const [selectedStage, setSelectedStage] = useState<Stage | "ALL">("ALL");

    const filteredPumps = useMemo(() => {
        let result = [...pumps];

        // Filter by stage
        if (selectedStage !== "ALL") {
            result = result.filter((p) => p.stage === selectedStage);
        }

        // Sort: Rush/Urgent first, then by Promise Date
        result.sort((a, b) => {
            if (a.priority === "Rush" && b.priority !== "Rush") return -1;
            if (a.priority !== "Rush" && b.priority === "Rush") return 1;
            if (a.priority === "Urgent" && b.priority !== "Urgent") return -1;
            if (a.priority !== "Urgent" && b.priority === "Urgent") return 1;

            const dateA = a.promiseDate ? new Date(a.promiseDate).getTime() : Infinity;
            const dateB = b.promiseDate ? new Date(b.promiseDate).getTime() : Infinity;
            return dateA - dateB;
        });

        return result;
    }, [pumps, selectedStage]);

    return (
        <div className="monday-brief font-sans">
            <div className="flex justify-between items-center mb-6 no-print">
                <h1 className="text-2xl font-bold">Monday Morning Brief</h1>
                <select
                    className="border p-2 rounded"
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value as Stage | "ALL")}
                >
                    <option value="ALL">All Departments</option>
                    {STAGES.map((stage) => (
                        <option key={stage} value={stage}>{stage}</option>
                    ))}
                </select>
                <button
                    onClick={() => window.print()}
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                    Print Report
                </button>
            </div>

            <div className="print:block">
                <div className="mb-8 border-b-2 border-black pb-4">
                    <h2 className="text-4xl font-black uppercase tracking-tighter">
                        {selectedStage === "ALL" ? "Production Overview" : `${selectedStage} Brief`}
                    </h2>
                    <p className="text-gray-600 mt-2">Generated: {format(new Date(), "PPP")}</p>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black text-sm uppercase tracking-wider">
                            <th className="py-2">Priority</th>
                            <th className="py-2">Order #</th>
                            <th className="py-2">Model</th>
                            <th className="py-2">Stage</th>
                            <th className="py-2">Promise Date</th>
                            <th className="py-2">Notes/Blockers</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPumps.map((pump) => (
                            <tr key={pump.id} className="border-b border-gray-300">
                                <td className="py-3 font-bold">
                                    {pump.priority === "Rush" && <span className="bg-black text-white px-2 py-1 text-xs">RUSH</span>}
                                    {pump.priority === "Urgent" && <span className="border border-black px-2 py-1 text-xs">URGENT</span>}
                                    {pump.priority === "Normal" && <span className="text-gray-500 text-xs">NORMAL</span>}
                                    {pump.priority === "High" && <span className="text-gray-800 text-xs font-bold">HIGH</span>}
                                    {pump.priority === "Low" && <span className="text-gray-400 text-xs">LOW</span>}
                                </td>
                                <td className="py-3 font-mono">{pump.po}</td>
                                <td className="py-3">{pump.model}</td>
                                <td className="py-3 text-sm">{pump.stage}</td>
                                <td className="py-3">{pump.promiseDate ? format(new Date(pump.promiseDate), "MMM d") : "-"}</td>
                                <td className="py-3 text-sm text-red-600 font-medium">
                                    {/* Placeholder for blocker logic - checking for empty fields as basic blocker */}
                                    {!pump.serial && "Missing S/N"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
