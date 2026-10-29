# Prompt for the bridge builder: accept new contacts from the website

Paste this to the xero-bridge session (Supabase project `qlejeiadvqpgxoegtyaz`).

---

The website admin (dam-tech.co.za/admin/rfqs) now has a **"Send to Xero"** button on enquiries. It makes the enquiry's customer a Xero contact. Please add one narrow write tool for it. The website calls nothing else that writes.

## Tool: `create_contact_from_website`

- **Endpoint:** `POST /functions/v1/xero-bridge/api/create_contact_from_website`, with the same Bearer key the website already uses.
- **Mode:** this is a write tool (`mode: "draft"` or similar). It must be callable with the website's key. Allow it for that key only; don't open other write tools to it.

**Input (JSON):**

```json
{
  "name": "Sample Farms (Pty) Ltd",
  "first_name": "Pat",
  "last_name": "Doe",
  "email": "pat@example.com",
  "phone": "+27749217000",
  "address": { "line1": null, "city": "Hermanus", "region": "Western Cape", "postal_code": null, "country": "South Africa" },
  "source": { "kind": "website_enquiry", "reference": "RFQ-2026-00100" }
}
```

- `name`: required. It is the company when there is one, otherwise the person.
- `email`, `phone` and `address` may be null.
- `phone` is E.164.

**What the tool must do, in this order:**

1. **Same enquiry sent before:** look in the bridge's own audit log for this tool with the same `source.reference`. If found, return that contact (`matched_by: "reference"`) and create nothing.
2. **Match by email:** if `email` is set, find an existing Xero contact with exactly that email address, ignoring case. Use a `where` on `EmailAddress`, never a `search` that takes the first result. If exactly one contact matches, return it with `matched_by: "email"`. If more than one matches, return 409 with the error `More than one Xero contact has <email>`. Don't guess.
3. **Match by name:** find an existing contact whose `Name` equals `name` exactly, ignoring case. If exactly one matches, return it with `matched_by: "name"`. If more than one matches, return 409 the same way.
4. **Otherwise create** the contact with:
   - `Name`, `FirstName`, `LastName`, `EmailAddress`;
   - the phone as `Phones[{PhoneType:"MOBILE", PhoneCountryCode, PhoneAreaCode, PhoneNumber}]`, split from the E.164;
   - `Addresses[{AddressType:"STREET", AddressLine1, City, Region, PostalCode, Country}]` when an address is given.

   If Xero reports a duplicate name, re-read the contact by name and return it as `matched_by: "name"` instead of failing.
5. **Never edit or archive an existing contact.** The tool only matches or creates.
6. **Audit:** write one `xero_bridge.audit_log` row per call with the action (`created` or `matched`), the contact id and `source.reference`. Don't log the email or phone.

**Response (200):**

```json
{ "contact_id": "<ContactID>", "name": "<Xero Name>", "created": true, "matched_by": null }
```

Here `created` is false when an existing contact was returned, and `matched_by` is `"reference"`, `"email"` or `"name"`.

**Errors:**
- 400 `{ "error": "<plain words>" }` for bad input, for example `name is required`.
- 409 when more than one contact matches.
- 502 for a Xero error, using the existing shape.
- 503 when Xero is not connected.

The website shows the `error` text to the user as is.

## Tests before you say done

1. A new person creates one contact. Sending the same enquiry again returns it with `matched_by: "reference"` and no second contact.
2. An email that already exists on one contact returns that contact, and nothing in Xero changes.
3. An email on two contacts returns 409, and nothing is created.
4. A company name that exists exactly returns it with `matched_by: "name"`.
5. K&S49 Trading (PTY) LTD (`f3dd1d70-c89c-4648-91ae-0c10dc123078`) is never returned unless the email or name actually is K&S49's.
6. A call with unknown keys is logged as `unknown_arguments` as today, and still works if the known keys are valid.
7. The website's key still cannot call any other write tool.

Report back: the tool's final input and output, and the test results. Don't put the bridge key, any token or any customer details in code, logs or replies.
