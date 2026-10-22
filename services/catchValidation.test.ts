import { validateCatchInput } from './catchValidation';

describe('catch validation', () => {
  it('accepts valid catch data', () => {
    expect(
      validateCatchInput({
        species: 'Ahven',
        weight: '450,5',
        date: '2026-10-20',
        location: 'Lahti',
      })
    ).toEqual({});
  });

  it('rejects missing and invalid values', () => {
    const errors = validateCatchInput({
      species: '',
      weight: '0',
      date: '2026-02-31',
      location: '',
    });

    expect(errors.species).toBeDefined();
    expect(errors.weight).toBeDefined();
    expect(errors.date).toBeDefined();
  });

  it('rejects future dates and oversized values', () => {
    const errors = validateCatchInput({
      species: 'Ahven',
      weight: '1000001',
      date: '2999-01-01',
      location: 'Lahti',
    });

    expect(errors.weight).toContain('1 000 000');
    expect(errors.date).toContain('tulevaisuudessa');
  });
});
