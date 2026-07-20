import { directLabourCost } from "@/lib/estimating/pricing";
import { roundMoney } from "@/lib/estimating/money";

export type CrewMemberInput = {
  labourItemId: string;
  roleName: string;
  quantity: number;
  hourlyCost: number;
  burdenPercent?: number;
};

export type CrewCostInput = {
  members: CrewMemberInput[];
  installationQuantity: number;
  productivityRate: number | null;
  productivityUnit?: string | null;
  minimumHours?: number | null;
  hoursOverride?: number | null;
  overrideReason?: string | null;
};

export type CrewCostResult = {
  crewHourlyCost: number;
  requiredHours: number;
  crewCost: number;
  overridden: boolean;
  overrideReason: string | null;
  memberBreakdown: Array<{
    labourItemId: string;
    roleName: string;
    quantity: number;
    burdenedHourlyCost: number;
    lineHourlyCost: number;
  }>;
};

export function burdenedHourlyCost(
  baseHourlyCost: number,
  burdenPercent = 0,
): number {
  return roundMoney(
    Math.max(0, baseHourlyCost) * (1 + Math.max(0, burdenPercent) / 100),
  );
}

export function calculateCrewHourlyCost(members: CrewMemberInput[]): number {
  return roundMoney(
    members.reduce((sum, member) => {
      const burdened = burdenedHourlyCost(
        member.hourlyCost,
        member.burdenPercent ?? 0,
      );
      return sum + burdened * Math.max(0, member.quantity);
    }, 0),
  );
}

/**
 * requiredHours = installationQuantity / productivityRate
 * Applies minimum hours and optional override with reason.
 */
export function calculateCrewCost(input: CrewCostInput): CrewCostResult {
  const memberBreakdown = input.members.map((member) => {
    const burdened = burdenedHourlyCost(
      member.hourlyCost,
      member.burdenPercent ?? 0,
    );
    return {
      labourItemId: member.labourItemId,
      roleName: member.roleName,
      quantity: member.quantity,
      burdenedHourlyCost: burdened,
      lineHourlyCost: roundMoney(burdened * Math.max(0, member.quantity)),
    };
  });

  const crewHourlyCost = roundMoney(
    memberBreakdown.reduce((sum, row) => sum + row.lineHourlyCost, 0),
  );

  const labour = directLabourCost({
    quantity: input.installationQuantity,
    productivityRate: input.productivityRate,
    hourlyRate: crewHourlyCost,
    overrideHours: input.hoursOverride,
    overrideReason: input.overrideReason,
  });

  let requiredHours = labour.hours;
  const minimum = Math.max(0, input.minimumHours ?? 0);
  if (!labour.overridden && minimum > 0 && requiredHours < minimum) {
    requiredHours = minimum;
  }

  return {
    crewHourlyCost,
    requiredHours,
    crewCost: roundMoney(requiredHours * crewHourlyCost),
    overridden: labour.overridden,
    overrideReason: labour.overrideReason,
    memberBreakdown,
  };
}
