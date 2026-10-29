import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { distancesForTown, formatLocationCell, haversineKm, locationPatch } from "./distance.ts";
import { findTownByName } from "./sa-places.ts";
import { displayPhone } from "./phone-display.ts";
import { fillFromXeroContact, locationFromXeroCity, mapXeroContact } from "./xero-contact.ts";

describe("office distance", () => {
  it("computes a short hop from the Pretoria yard to Centurion", () => {
    const km = distancesForTown("Gauteng", "Centurion");
    assert.ok(km.km_from_pretoria !== null && km.km_from_pretoria < 40);
    assert.ok(km.km_from_western_cape !== null && km.km_from_western_cape > 1000);
    assert.equal(km.nearest_office, "pretoria");
  });

  it("puts Hermanus nearer the Western Cape yard", () => {
    const km = distancesForTown("Western Cape", "Hermanus");
    assert.ok(km.km_from_western_cape !== null && km.km_from_western_cape < 80);
    assert.equal(km.nearest_office, "western-cape");
  });

  it("haversine is symmetric and zero at the same point", () => {
    const a = { lat: -25.721, lng: 28.237 };
    assert.equal(haversineKm(a, a), 0);
    assert.equal(haversineKm(a, { lat: -34.368, lng: 18.896 }), haversineKm({ lat: -34.368, lng: 18.896 }, a));
  });

  it("formats province, town and nearer office", () => {
    const patch = locationPatch("Limpopo", "Modimolle");
    const text = formatLocationCell({
      site_province: patch.site_province,
      site_town: patch.site_town,
      site_location: null,
      km_from_pretoria: patch.km_from_pretoria,
      km_from_western_cape: patch.km_from_western_cape,
    });
    assert.match(text ?? "", /Limpopo, Modimolle \(.+ · Pretoria\)/);
  });

  it("leaves km empty for a town that is not on the list", () => {
    const patch = locationPatch("Gauteng", "Somewhere invented");
    assert.equal(patch.site_town, "Somewhere invented");
    assert.equal(patch.km_from_pretoria, null);
  });
});

describe("phone display", () => {
  it("formats a South African mobile with flag and +27", () => {
    const shown = displayPhone("083 406 4233");
    assert.equal(shown?.flag, "🇿🇦");
    assert.equal(shown?.text, "+27 83 406 4233");
    assert.equal(shown?.href, "tel:+27834064233");
  });

  it("keeps an already-international ZA number", () => {
    const shown = displayPhone("+27832800970");
    assert.equal(shown?.text, "+27 83 280 0970");
  });

  it("returns null when empty", () => {
    assert.equal(displayPhone("  "), null);
  });
});

describe("Xero contact mapping", () => {
  it("reads extra phone and address keys when the bridge sends them", () => {
    const mapped = mapXeroContact({
      id: "c1",
      name: "PPCF Boerdery",
      FirstName: "Francois",
      LastName: "Joubert",
      EmailAddress: "francois@ppcf.co.za",
      Phones: [{ PhoneType: "MOBILE", PhoneCountryCode: "27", PhoneNumber: "832800970" }],
      Addresses: [{ City: "Piet Retief", Region: "Mpumalanga" }],
    });
    assert.equal(mapped.person, "Francois Joubert");
    assert.equal(mapped.email, "francois@ppcf.co.za");
    assert.equal(mapped.phone, "+27832800970");
    assert.equal(mapped.phoneCountry, "ZA");
    assert.equal(mapped.city, "Piet Retief");
    const loc = locationFromXeroCity(mapped.city, mapped.region);
    assert.equal(loc?.site_town, "Piet Retief");
    assert.equal(findTownByName("Piet Retief")?.province, "Mpumalanga");
  });

  it("prefers MOBILE then DEFAULT then DDI, and reads ContactPersons email", () => {
    const mapped = mapXeroContact({
      Name: "Alfred Mensah",
      Phones: [
        { PhoneType: "FAX", PhoneCountryCode: "27", PhoneNumber: "123" },
        { PhoneType: "DDI", PhoneCountryCode: "27", PhoneAreaCode: "11", PhoneNumber: "5551234" },
        { PhoneType: "MOBILE", PhoneCountryCode: "27", PhoneNumber: "0834064233" },
      ],
      ContactPersons: [{ EmailAddress: "mensahalfred1976@gmail.com" }],
    });
    assert.equal(mapped.phone, "+27834064233");
    assert.equal(mapped.email, "mensahalfred1976@gmail.com");
  });

  it("does not overwrite staff-typed fields", () => {
    const patch = fillFromXeroContact(
      { customer_name: "Already set", contact_person: "Arno", contact_phone: null, contact_email: null, xero_contact_id: null },
      {
        id: "c1",
        name: "Xero Name",
        person: "Francois",
        phone: "+2783",
        phoneCountry: "ZA",
        email: "a@b.c",
        city: null,
        region: null,
        phonesPresentButEmpty: false,
      },
    );
    assert.equal(patch.customer_name, undefined);
    assert.equal(patch.contact_person, undefined);
    assert.equal(patch.contact_phone, "+2783");
  });
});
