import type { InputHTMLAttributes, ReactNode } from "react";

type AdminRadioOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
};

type AdminRadioGroupProps = {
  name: string;
  legend: ReactNode;
  options: AdminRadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  required?: boolean;
};

export function AdminRadioGroup({
  name,
  legend,
  options,
  value,
  defaultValue,
  onChange,
  required,
}: AdminRadioGroupProps) {
  return (
    <fieldset className="admin-radio-group">
      <legend className="admin-radio-group__legend">{legend}</legend>
      <div className="admin-radio-group__options">
        {options.map((option) => (
          <label key={option.value} className="admin-radio-field">
            <input
              type="radio"
              className="admin-radio-field__input"
              name={name}
              value={option.value}
              checked={value !== undefined ? value === option.value : undefined}
              defaultChecked={
                value === undefined ? defaultValue === option.value : undefined
              }
              onChange={onChange}
              required={required}
            />
            <span className="admin-radio-field__content">
              <span className="admin-radio-field__label">{option.label}</span>
              {option.description ? (
                <span className="admin-radio-field__description">
                  {option.description}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
