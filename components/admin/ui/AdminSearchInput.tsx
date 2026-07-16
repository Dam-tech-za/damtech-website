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
    <label className="admin-search" htmlFor={id}>
      <span className="admin-search__label">{label}</span>
      <input
        id={id}
        name={name}
        type="search"
        className="form-input"
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </label>
  );
}
