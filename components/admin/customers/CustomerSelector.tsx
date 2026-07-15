"use client";

import { useMemo, useState, useTransition } from "react";
import { searchCustomersAction } from "@/app/admin/customers/actions";
import {
  CustomerSummaryCard,
  type CustomerRecord,
} from "./CustomerSummaryCard";
import { CreateCustomerDialog } from "./CreateCustomerDialog";

type Props = {
  customers: CustomerRecord[];
  value: string;
  onSelectCustomer: (customer: CustomerRecord | null) => void;
  canCreateCustomer: boolean;
};

export function CustomerSelector({
  customers,
  value,
  onSelectCustomer,
  canCreateCustomer,
}: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerRecord[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searching, startSearchTransition] = useTransition();

  const selectedCustomer = useMemo(
    () => [...results, ...customers].find((customer) => customer.id === value) ?? null,
    [customers, results, value],
  );

  function selectCustomer(customer: CustomerRecord | null) {
    onSelectCustomer(customer);
    setSearchOpen(false);
  }

  function runSearch(term = query) {
    startSearchTransition(async () => {
      setSearchError(null);
      const result = await searchCustomersAction(term);
      if (!result.ok) {
        setSearchError(result.error);
        setResults([]);
        return;
      }
      setResults(result.customers);
    });
  }

  return (
    <div className="admin-stack">
      <div className="admin-form-grid">
        <label className="admin-field admin-field--full">
          <span>Customer</span>
          <select
            className="form-input"
            value={value}
            onChange={(event) => selectCustomer(customers.find((item) => item.id === event.target.value) ?? null)}
            required
          >
            <option value="">Select customer…</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.company_name || customer.name}
              </option>
            ))}
          </select>
        </label>
        <div className="admin-panel__actions" style={{ gridColumn: "1 / -1" }}>
          <button
            type="button"
            className="btn btn--md btn--secondary"
            onClick={() => setSearchOpen((prev) => !prev)}
          >
            {searchOpen ? "Hide search" : "Search customers"}
          </button>
          {canCreateCustomer ? (
            <button
              type="button"
              className="btn btn--md btn--secondary"
              onClick={() => setCreateOpen(true)}
            >
              New customer
            </button>
          ) : null}
        </div>
      </div>

      <CustomerSummaryCard customer={selectedCustomer} />

      {searchOpen ? (
        <section className="admin-panel">
          <header className="admin-panel__header admin-panel__header--row">
            <h3>Search customers</h3>
            <div className="admin-panel__actions">
              <button
                type="button"
                className="btn btn--md btn--secondary"
                onClick={() => runSearch()}
                disabled={searching}
              >
                {searching ? "Searching…" : "Search"}
              </button>
            </div>
          </header>
          <div className="admin-inline-form">
            <input
              className="form-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, company, email, phone, VAT…"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  runSearch();
                }
              }}
            />
            <button
              type="button"
              className="btn btn--md btn--primary"
              onClick={() => runSearch()}
              disabled={searching}
            >
              Search
            </button>
          </div>
          {searchError ? <p className="admin-flash admin-flash--error">{searchError}</p> : null}
          {results.length === 0 ? (
            <div className="admin-empty">
              <p>No search results yet.</p>
            </div>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Province</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {results.map((customer) => (
                    <tr key={customer.id}>
                      <td>{customer.company_name || customer.name}</td>
                      <td>{customer.email ?? "—"}</td>
                      <td>{customer.phone ?? "—"}</td>
                      <td>{customer.province ?? "—"}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn--sm btn--secondary"
                          onClick={() => selectCustomer(customer)}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      <CreateCustomerDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={selectCustomer}
      />
    </div>
  );
}
