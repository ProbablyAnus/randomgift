import { FC } from "react";
import { X, ChevronDown, MoreVertical } from "lucide-react";

interface HeaderProps {
  title: string;
}

export const Header: FC<HeaderProps> = ({ title }) => {
  return (
    <header className="tg-header" style={{ background: "rgba(28, 28, 30, 1)" }}>
      <button className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
        <X size={24} />
      </button>
      <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      <div className="flex items-center gap-1">
        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
          <ChevronDown size={24} />
        </button>
        <button className="p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors">
          <MoreVertical size={24} />
        </button>
      </div>
    </header>
  );
};
