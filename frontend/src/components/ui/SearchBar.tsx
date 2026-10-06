import "@/components/ui/SearchBar.css";
import {Search, X} from "lucide-react";

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    ariaLabel?: string;
}

const SearchBar = ({
    value,
    onChange,
    placeholder = "Suchen",
    ariaLabel = "Suchen",
}: SearchBarProps) => {
    return (
        <div className="search-bar">
            <Search size={18} className="search-bar__icon" aria-hidden="true" />
            <input
                className="search-bar__input"
                type="search"
                value={value}
                placeholder={placeholder}
                aria-label={ariaLabel}
                onChange={(event) => onChange(event.target.value)}
            />
            {value.length > 0 && (
                <button
                    type="button"
                    className="search-bar__clear"
                    aria-label="Suche zurücksetzen"
                    onClick={() => onChange("")}
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );
};

export default SearchBar;
