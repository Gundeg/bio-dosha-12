/** Weights the forms accept, in kg (the API allows up to 500 kg as well). */
export const WEIGHT_MIN_KG = 1;
export const WEIGHT_MAX_KG = 500;

export function isValidWeight(kg: number): boolean {
  return Number.isFinite(kg) && kg >= WEIGHT_MIN_KG && kg <= WEIGHT_MAX_KG;
}

/**
 * "Овог Нэр" when the last name is known, as Mongolian names are written, so
 * people with the same given name can be told apart; otherwise the given name.
 */
export function fullName(person: { name: string; lastName?: string | null }): string {
  const last = person.lastName?.trim();
  return last ? `${last} ${person.name}` : person.name;
}
