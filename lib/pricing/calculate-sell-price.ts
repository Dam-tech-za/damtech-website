import { priceFromCostStrategy } from "@/lib/estimating/pricing";
import { roundMoney } from "@/lib/estimating/money";

export type SellPriceInput = {
  cost: number | null;
  method: "fixed" | "markup" | "margin";
  fixedSellPrice?: number | null;
  markupPercent?: number | null;
  marginPercent?: number | null;
  minimumSellPrice?: number | null;
};

export type SellPriceResult = {
  sellPrice: number | null;
  belowMinimum: boolean;
  methodUsed: SellPriceInput["method"] | "missing";
};

export function calculateSellPrice(input: SellPriceInput): SellPriceResult {
  if (input.method === "fixed") {
    const sell = input.fixedSellPrice ?? null;
    if (sell == null || sell <= 0) {
      return { sellPrice: null, belowMinimum: false, methodUsed: "missing" };
    }
    const minimum = input.minimumSellPrice ?? 0;
    return {
      sellPrice: roundMoney(sell),
      belowMinimum: minimum > 0 && sell < minimum,
      methodUsed: "fixed",
    };
  }

  const cost = input.cost ?? 0;
  if (cost <= 0) {
    return { sellPrice: null, belowMinimum: false, methodUsed: "missing" };
  }

  const percent =
    input.method === "markup"
      ? (input.markupPercent ?? 0)
      : (input.marginPercent ?? 0);

  const sell = priceFromCostStrategy(
    cost,
    input.method === "markup" ? "markup" : "margin",
    percent,
  );
  const minimum = input.minimumSellPrice ?? 0;

  return {
    sellPrice: sell,
    belowMinimum: minimum > 0 && sell < minimum,
    methodUsed: input.method,
  };
}
