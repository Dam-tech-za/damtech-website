# Calculator → RFQ flow

1. User runs a calculator on `/calculators`.
2. “Request a quote” stores `QuotePrefill` in `sessionStorage`, including:
   - mapped service / size / location / message
   - structured `calculatorJson` (`calculatorType`, `inputs`, `results`)
3. `/quote` form hydrates fields and posts hidden `calculatorJson`.
4. `submitLead` stores:
   - `rfqs.calculator_type`
   - `rfqs.calculator_input`
   - `rfqs.calculator_result`
5. Admin RFQ detail renders readable tables and keeps the planning disclaimer.

Planning estimates are never treated as final engineering quantities.
