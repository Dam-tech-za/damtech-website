import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formatZar } from "@/lib/estimating/money";
import { formatQuoteNumber } from "./types";

export type QuotePdfLine = {
  itemCode?: string | null;
  description: string;
  quantity: number;
  unit: string;
  sellUnitPrice: number;
  lineTotalExVat: number;
  lineType: string;
};

export type QuotePdfPayload = {
  quoteNumber: string;
  revisionNumber: number;
  title: string;
  issueDate: string;
  validUntil: string;
  customerName: string;
  projectLocation?: string | null;
  scopeSummary?: string | null;
  assumptions?: string | null;
  exclusions?: string | null;
  paymentTerms?: string | null;
  programmeNotes?: string | null;
  warrantyWording?: string | null;
  lines: QuotePdfLine[];
  subtotalExVat: number;
  discountAmount: number;
  vatRate: number;
  vatAmount: number;
  totalIncVat: number;
  company: {
    legalBusinessName: string;
    tradingName?: string | null;
    address?: string | null;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    vatNumber?: string | null;
    quoteFooter?: string | null;
    termsAndConditions?: string | null;
    banking?: {
      bankName?: string | null;
      accountName?: string | null;
      accountNumber?: string | null;
      branchCode?: string | null;
    } | null;
  };
  showBankingDetails?: boolean;
  brandPrimaryHex?: string;
};

function createStyles(primary: string) {
  return StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 48,
      paddingHorizontal: 40,
      fontSize: 9,
      fontFamily: "Helvetica",
      color: "#1a1a1a",
    },
    header: {
      borderBottomWidth: 2,
      borderBottomColor: primary,
      paddingBottom: 12,
      marginBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    brand: { fontSize: 18, fontFamily: "Helvetica-Bold", color: primary },
    kicker: { fontSize: 11, marginTop: 4, letterSpacing: 1, color: "#444" },
    meta: { fontSize: 9, textAlign: "right", lineHeight: 1.4 },
    sectionTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      marginTop: 14,
      marginBottom: 6,
      color: primary,
    },
    para: { marginBottom: 4, lineHeight: 1.4 },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#f2f2f2",
      borderBottomWidth: 1,
      borderBottomColor: "#ccc",
      paddingVertical: 5,
      paddingHorizontal: 4,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 0.5,
      borderBottomColor: "#ddd",
      paddingVertical: 5,
      paddingHorizontal: 4,
    },
    colCode: { width: "12%" },
    colDesc: { width: "40%" },
    colQty: { width: "10%", textAlign: "right" },
    colUnit: { width: "8%" },
    colPrice: { width: "15%", textAlign: "right" },
    colAmt: { width: "15%", textAlign: "right" },
    totals: { marginTop: 12, alignSelf: "flex-end", width: "45%" },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    totalStrong: { fontFamily: "Helvetica-Bold", fontSize: 11 },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 40,
      right: 40,
      fontSize: 8,
      color: "#666",
      borderTopWidth: 0.5,
      borderTopColor: "#ccc",
      paddingTop: 6,
      flexDirection: "row",
      justifyContent: "space-between",
    },
  });
}

function QuotationDocument({ data }: { data: QuotePdfPayload }) {
  const primary = data.brandPrimaryHex || "#1B4D3E";
  const styles = createStyles(primary);
  const display = formatQuoteNumber(data.quoteNumber, data.revisionNumber);
  const pricedLines = data.lines.filter(
    (line) => line.lineType !== "heading" && line.lineType !== "note",
  );

  return (
    <Document
      title={display.label}
      author={data.company.legalBusinessName}
      subject="Quotation"
      language="en-GB"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>
              {data.company.tradingName || data.company.legalBusinessName}
            </Text>
            <Text style={styles.kicker}>QUOTATION</Text>
          </View>
          <View style={styles.meta}>
            <Text>{display.label}</Text>
            <Text>Issue date: {data.issueDate}</Text>
            <Text>Valid until: {data.validUntil}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Customer</Text>
        <Text style={styles.para}>{data.customerName}</Text>

        <Text style={styles.sectionTitle}>Project</Text>
        <Text style={styles.para}>{data.title}</Text>
        {data.projectLocation ? (
          <Text style={styles.para}>Location: {data.projectLocation}</Text>
        ) : null}
        {data.scopeSummary ? (
          <>
            <Text style={styles.sectionTitle}>Scope summary</Text>
            <Text style={styles.para}>{data.scopeSummary}</Text>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Pricing</Text>
        <View style={styles.tableHeader} fixed>
          <Text style={styles.colCode}>Code</Text>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colQty}>Qty</Text>
          <Text style={styles.colUnit}>Unit</Text>
          <Text style={styles.colPrice}>Unit price</Text>
          <Text style={styles.colAmt}>Amount</Text>
        </View>
        {pricedLines.map((line, index) => (
          <View key={`${line.description}-${index}`} style={styles.tableRow} wrap={false}>
            <Text style={styles.colCode}>{line.itemCode || "—"}</Text>
            <Text style={styles.colDesc}>{line.description}</Text>
            <Text style={styles.colQty}>{line.quantity}</Text>
            <Text style={styles.colUnit}>{line.unit}</Text>
            <Text style={styles.colPrice}>{formatZar(line.sellUnitPrice)}</Text>
            <Text style={styles.colAmt}>{formatZar(line.lineTotalExVat)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal (ex VAT)</Text>
            <Text>{formatZar(data.subtotalExVat)}</Text>
          </View>
          {data.discountAmount > 0 ? (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>-{formatZar(data.discountAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text>VAT ({data.vatRate}%)</Text>
            <Text>{formatZar(data.vatAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalStrong}>Total (inc VAT)</Text>
            <Text style={styles.totalStrong}>{formatZar(data.totalIncVat)}</Text>
          </View>
        </View>

        {data.assumptions ? (
          <>
            <Text style={styles.sectionTitle}>Assumptions</Text>
            <Text style={styles.para}>{data.assumptions}</Text>
          </>
        ) : null}
        {data.exclusions ? (
          <>
            <Text style={styles.sectionTitle}>Exclusions</Text>
            <Text style={styles.para}>{data.exclusions}</Text>
          </>
        ) : null}
        {data.programmeNotes ? (
          <>
            <Text style={styles.sectionTitle}>Programme / lead time</Text>
            <Text style={styles.para}>{data.programmeNotes}</Text>
          </>
        ) : null}
        {data.paymentTerms ? (
          <>
            <Text style={styles.sectionTitle}>Payment terms</Text>
            <Text style={styles.para}>{data.paymentTerms}</Text>
          </>
        ) : null}
        {data.warrantyWording ? (
          <>
            <Text style={styles.sectionTitle}>Warranty</Text>
            <Text style={styles.para}>{data.warrantyWording}</Text>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Validity</Text>
        <Text style={styles.para}>
          This quotation is valid until {data.validUntil}. Prices are in South
          African Rand (ZAR).
        </Text>

        <Text style={styles.sectionTitle}>Acceptance</Text>
        <Text style={styles.para}>
          Accept or reject this quotation via the secure Damtech quote link
          provided by email. Electronic quotation acceptance records consent to
          the commercial terms shown; it is not presented as a qualified
          electronic signature.
        </Text>

        {data.company.termsAndConditions ? (
          <>
            <Text style={styles.sectionTitle}>Terms and conditions</Text>
            <Text style={styles.para}>{data.company.termsAndConditions}</Text>
          </>
        ) : null}

        {data.showBankingDetails !== false && data.company.banking ? (
          <>
            <Text style={styles.sectionTitle}>Banking details</Text>
            <Text style={styles.para}>
              {[
                data.company.banking.bankName,
                data.company.banking.accountName,
                data.company.banking.accountNumber
                  ? `Account ${data.company.banking.accountNumber}`
                  : null,
                data.company.banking.branchCode
                  ? `Branch ${data.company.banking.branchCode}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </>
        ) : null}

        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.para}>
          {[data.company.phone, data.company.email, data.company.website]
            .filter(Boolean)
            .join(" · ")}
        </Text>
        {data.company.quoteFooter ? (
          <Text style={styles.para}>{data.company.quoteFooter}</Text>
        ) : null}

        <View style={styles.footer} fixed>
          <Text>
            {data.company.legalBusinessName}
            {data.company.vatNumber ? ` · VAT ${data.company.vatNumber}` : ""}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

export async function renderQuotePdfBuffer(
  data: QuotePdfPayload,
): Promise<Buffer> {
  // renderToBuffer typings expect DocumentProps; QuotationDocument returns Document.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(<QuotationDocument data={data} /> as any);
  return Buffer.from(buffer);
}

export function quotePdfFileName(
  quoteNumber: string,
  revisionNumber: number,
): string {
  return formatQuoteNumber(quoteNumber, revisionNumber).fileSlug;
}
