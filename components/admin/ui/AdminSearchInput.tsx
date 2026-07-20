import { AdminSearchField } from "./AdminSearchField";

type AdminSearchInputProps = {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  id?: string;
};

export function AdminSearchInput({
  name = "q",
  defaultValue = "",
  placeholder = "Search…",
  label = "Search",
  id = "admin-search",
}: AdminSearchInputProps) {
  return (
    <AdminSearchField
      id={id}
      name={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      label={label}
      showIcon={false}
    />
  );
}
