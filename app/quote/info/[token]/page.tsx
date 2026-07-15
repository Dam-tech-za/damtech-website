import { getPublicInfoRequest } from "@/lib/rfq/info-request";
import { submitInfoResponseAction } from "@/app/actions/submit-info-response";

type PageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function PublicInfoRequestPage({
  params,
  searchParams,
}: PageProps) {
  const { token } = await params;
  const { error } = await searchParams;
  const loaded = await getPublicInfoRequest(token);

  if (!loaded.ok) {
    return (
      <main className="section section--narrow">
        <h1>Information request</h1>
        <p>{loaded.error}</p>
      </main>
    );
  }

  const { view } = loaded;

  return (
    <main className="section section--narrow">
      <h1>Additional information for {view.rfqNumber}</h1>
      <p>
        Damtech needs a few details to continue your quotation. Internal notes
        and pricing are not shown here.
      </p>
      {view.message ? <p>{view.message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}

      <h2>Requested items</h2>
      <ul>
        {view.requestedFields.map((field) => (
          <li key={field.id}>{field.label}</li>
        ))}
      </ul>

      <h2>Current asset summary</h2>
      {view.assets.length === 0 ? (
        <p>No asset summary available.</p>
      ) : (
        <ul>
          {view.assets.map((asset) => (
            <li key={asset.id}>
              #{asset.sequence} {asset.name} ({asset.type.replace(/_/g, " ")})
              <pre style={{ whiteSpace: "pre-wrap" }}>
                {JSON.stringify(asset.summary, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      )}

      <form action={submitInfoResponseAction} className="form-stack">
        <input type="hidden" name="token" value={token} />
        {view.requestedFields.map((field) => (
          <label key={field.id}>
            {field.label}
            <input
              className="form-input"
              name={`field_${field.id}`}
              required={field.id !== "other"}
            />
          </label>
        ))}

        {view.assets.map((asset) => (
          <fieldset key={asset.id}>
            <legend>Update dimensions for {asset.name} (optional)</legend>
            <input type="hidden" name="assetId" value={asset.id} />
            <label>
              Top length (m)
              <input
                className="form-input"
                name={`asset_${asset.id}_topLengthM`}
                type="number"
                step="any"
              />
            </label>
            <label>
              Top width (m)
              <input
                className="form-input"
                name={`asset_${asset.id}_topWidthM`}
                type="number"
                step="any"
              />
            </label>
            <label>
              Depth (m)
              <input
                className="form-input"
                name={`asset_${asset.id}_depthM`}
                type="number"
                step="any"
              />
            </label>
            <label>
              Diameter (m)
              <input
                className="form-input"
                name={`asset_${asset.id}_diameterM`}
                type="number"
                step="any"
              />
            </label>
            <label>
              Height (m)
              <input
                className="form-input"
                name={`asset_${asset.id}_heightM`}
                type="number"
                step="any"
              />
            </label>
            <label>
              Known total area (m²)
              <input
                className="form-input"
                name={`asset_${asset.id}_knownTotalAreaM2`}
                type="number"
                step="any"
              />
            </label>
            <label>
              Required capacity (kL)
              <input
                className="form-input"
                name={`asset_${asset.id}_requiredCapacityKL`}
                type="number"
                step="any"
              />
            </label>
          </fieldset>
        ))}

        <label>
          Other notes / upload description
          <textarea className="form-input" name="otherNotes" rows={4} />
        </label>

        <p className="admin-empty__hint">
          Link expires {new Date(view.expiresAt).toLocaleString("en-ZA")}.
        </p>
        <button type="submit" className="btn btn--md btn--primary">
          Submit
        </button>
      </form>
    </main>
  );
}
