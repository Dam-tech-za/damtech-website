export function compareQuoteLines(
  before: Array<Record<string, unknown>>,
  after: Array<Record<string, unknown>>,
) {
  const keyOf = (line: Record<string, unknown>) =>
    `${String(line.item_code ?? "")}|${String(line.description ?? "")}|${String(line.line_type ?? "")}`;

  const beforeMap = new Map(before.map((line) => [keyOf(line), line]));
  const afterMap = new Map(after.map((line) => [keyOf(line), line]));

  const added = after.filter((line) => !beforeMap.has(keyOf(line)));
  const removed = before.filter((line) => !afterMap.has(keyOf(line)));
  const changed = after
    .filter((line) => beforeMap.has(keyOf(line)))
    .map((line) => {
      const prev = beforeMap.get(keyOf(line))!;
      const qtyChanged = Number(prev.quantity) !== Number(line.quantity);
      const priceChanged =
        Number(prev.sell_unit_price) !== Number(line.sell_unit_price);
      if (!qtyChanged && !priceChanged) return null;
      return { before: prev, after: line, qtyChanged, priceChanged };
    })
    .filter(Boolean);

  return { added, removed, changed };
}
