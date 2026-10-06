import "@/components/ui/Toggle.css";

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
    id?: string;
}

const Toggle = ({checked, onChange, label, disabled = false, id}: ToggleProps) => {
    return (
        <label className={`ui-toggle${disabled ? " ui-toggle-disabled" : ""}`}>
            <span className="ui-toggle-label">{label}</span>
            <span className="ui-toggle-control">
                <input
                    id={id}
                    type="checkbox"
                    role="switch"
                    checked={checked}
                    disabled={disabled}
                    aria-label={label}
                    onChange={(event) => onChange(event.target.checked)}
                />
                <span className="ui-toggle-track" aria-hidden="true">
                    <span className="ui-toggle-thumb" />
                </span>
            </span>
        </label>
    );
};

export default Toggle;
