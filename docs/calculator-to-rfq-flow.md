# Calculator → Quote Preparation flow

1. Planning calculators stay on `/calculators/` with their estimate UI.
2. **Request a Quote** → simple `/quote/`.
3. **Continue in Quote Preparation** stores a hashed draft and opens `/calculators/?draft=TOKEN#project-budget`.
4. Selecting **Quote Preparation** (`#project-budget`) shows the 7-step multi-asset wizard (contact, company, location, services, measurements, site conditions, review).
5. Submit stores `enquiry_channel = calculator_quote_preparation` with assets for the admin inbox and emails.
