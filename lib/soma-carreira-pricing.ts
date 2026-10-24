/** Total additional package price; never a monthly charge or a base plan replacement. */
export function calcularAdicionalCarreira(meses: 6 | 12, encontrosPorMes: number): number | null {
  if (meses !== 6 && meses !== 12) return null;
  if (encontrosPorMes === 1) return 0;
  const pacote6 = encontrosPorMes === 2 ? 17990 : encontrosPorMes === 3 ? 22799 : null;
  return pacote6 === null ? null : pacote6 * (meses === 12 ? 2 : 1);
}
