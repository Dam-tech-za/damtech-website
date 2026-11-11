import type { PvcLiner } from "./pvc-liners.ts";

/**
 * Packed size and weight of a made-up liner, for courier quotes.
 *
 * Weight comes from the same liner area the price uses (the reservoir pricing
 * calculator in damtech-ai-operations): area in m² x fabric weight in gsm.
 * Packed size: a folded liner normally goes out at about 1.0 x 0.4 x 0.4 m
 * (Tiaan, 2026-11-11). ASSUMPTION to confirm: above PVC_PACK_STANDARD_MAX_KG
 * the bundle stays 1 m long and its cross-section grows with the weight.
 */
export const PVC_PACK_STANDARD_CM = { lengthCm: 100, widthCm: 40, heightCm: 40 } as const;
export const PVC_PACK_STANDARD_MAX_KG = 100;

export type PackedParcel = { lengthCm: number; widthCm: number; heightCm: number; weightKg: number };

export function pvcLinerWeightKg(liner: Pick<PvcLiner, "linerAreaM2" | "gsm">): number {
  return Math.round(((liner.linerAreaM2 * liner.gsm) / 1000) * 10) / 10;
}

export function pvcLinerPackedParcel(liner: Pick<PvcLiner, "linerAreaM2" | "gsm">): PackedParcel {
  const weightKg = pvcLinerWeightKg(liner);
  const scale = Math.sqrt(Math.max(1, weightKg / PVC_PACK_STANDARD_MAX_KG));
  const side = Math.ceil(PVC_PACK_STANDARD_CM.widthCm * scale);
  return { lengthCm: PVC_PACK_STANDARD_CM.lengthCm, widthCm: side, heightCm: side, weightKg };
}
