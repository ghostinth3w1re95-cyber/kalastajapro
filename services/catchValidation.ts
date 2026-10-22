export type CatchInput = {
  species: string;
  weight: string;
  date: string;
  location: string;
};

export type CatchValidationErrors = Partial<Record<keyof CatchInput, string>>;

export function validateCatchInput(input: CatchInput): CatchValidationErrors {
  const errors: CatchValidationErrors = {};
  const species = input.species.trim();
  const location = input.location.trim();
  const weight = Number(input.weight.replace(',', '.'));

  if (!species) {
    errors.species = 'Anna kalalaji.';
  } else if (species.length > 80) {
    errors.species = 'Lajin nimessä voi olla enintään 80 merkkiä.';
  }

  if (!input.weight.trim() || !Number.isFinite(weight) || weight <= 0) {
    errors.weight = 'Anna paino, joka on suurempi kuin 0 g.';
  } else if (weight > 1_000_000) {
    errors.weight = 'Paino voi olla enintään 1 000 000 g.';
  }

  if (!isValidDate(input.date)) {
    errors.date = 'Anna päivämäärä muodossa VVVV-KK-PP.';
  } else if (input.date > getToday()) {
    errors.date = 'Päivämäärä ei voi olla tulevaisuudessa.';
  }

  if (location.length > 120) {
    errors.location = 'Paikan nimessä voi olla enintään 120 merkkiä.';
  }

  return errors;
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function getToday() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
