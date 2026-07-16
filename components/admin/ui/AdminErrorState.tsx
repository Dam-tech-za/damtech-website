type AdminErrorStateProps = {
  title?: string;
  message: string;
  incidentId?: string;
};

export function AdminErrorState({
  title = "Something went wrong",
  message,
  incidentId,
}: AdminErrorStateProps) {
  return (
    <div className="admin-ui-error" role="alert">
      <p className="admin-ui-error__title">{title}</p>
      <p className="admin-ui-error__message">{message}</p>
      {incidentId ? (
        <p className="admin-ui-error__ref">Reference: {incidentId}</p>
      ) : null}
    </div>
  );
}
