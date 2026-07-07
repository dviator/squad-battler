/** Build the attack line shown in the battle log. */
export function formatAttackLine(
  attackerName: string,
  attackName: string,
  targetNames: string[],
): string {
  const suffix = targetNames.length > 0 ? ` → ${targetNames.join(", ")}` : "";
  return `${attackerName} uses ${attackName}${suffix}`;
}
