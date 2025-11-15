import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "../ui/Button";

interface CollapseToggleProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function CollapseToggle({ collapsed, onToggle }: CollapseToggleProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="header-button h-9 w-9 rounded-full border border-border/60 bg-card/80 text-foreground"
      onClick={onToggle}
      title={collapsed ? "Expand cards" : "Collapse cards"}
      aria-label="Toggle pump card density"
    >
      {collapsed ? (
        <Maximize2 className="h-4 w-4" />
      ) : (
        <Minimize2 className="h-4 w-4" />
      )}
    </Button>
  );
}
