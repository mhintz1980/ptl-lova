// src/components/toolbar/AddPoButton.tsx
import { Button } from "../ui/Button";
import { Plus } from "lucide-react";

interface AddPoButtonProps {
  onClick: () => void;
}

export function AddPoButton({ onClick }: AddPoButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      variant="default"
      className="header-button header-button--accent h-10 w-10 rounded-full"
      title="Add PO"
      aria-label="Add purchase order"
    >
      <Plus className="h-5 w-5" />
    </Button>
  );
}
