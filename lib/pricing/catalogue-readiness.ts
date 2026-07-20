/**
 * Soft readiness checks for switching the quote builder off legacy fallback.
 * Do not disable legacy paths until every required flag is true in production.
 */

export type CatalogueReadiness = {
  materialCatalogueOperational: boolean;
  labourCatalogueSynchronised: boolean;
  travelCatalogueOperational: boolean;
  tankModelsOperational: boolean;
  pricingSnapshotsOperational: boolean;
  roleSecurityVerified: boolean;
};

export function isUnifiedCatalogueDefaultReady(checks: CatalogueReadiness): boolean {
  return (
    checks.materialCatalogueOperational &&
    checks.labourCatalogueSynchronised &&
    checks.travelCatalogueOperational &&
    checks.tankModelsOperational &&
    checks.pricingSnapshotsOperational &&
    checks.roleSecurityVerified
  );
}

/** Conservative defaults until ops confirm migration + sync in production. */
export const DEFAULT_CATALOGUE_READINESS: CatalogueReadiness = {
  materialCatalogueOperational: false,
  labourCatalogueSynchronised: false,
  travelCatalogueOperational: false,
  tankModelsOperational: false,
  pricingSnapshotsOperational: true,
  roleSecurityVerified: false,
};
