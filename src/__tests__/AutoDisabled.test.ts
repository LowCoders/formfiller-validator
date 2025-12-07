/**
 * Auto Disabled Tests - visibleIf alapján automatikus disabled beállítás tesztelése
 */

import { Validator } from '../core/Validator';
import { FormConfig } from '../types';

describe('Auto Disabled based on visibleIf', () => {
  let validator: Validator;

  beforeEach(() => {
    validator = new Validator({
      mode: 'sequential',
      locale: 'en',
    });
  });

  describe('Test 1: visibleIf=true, nincs disabledIf → disabled=false', () => {
    it('should allow field when visible=true and no disabledIf', async () => {
      const formData = {
        customerType: 'company',
        companyName: 'Test Company',
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'customerType',
          },
          {
            type: 'text',
            name: 'companyName',
            visibleIf: { customerType: 'company' },
            validationRules: [
              {
                type: 'required',
                message: 'Company name is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // A mező látható, ezért validálódnia kell
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Test 2: visibleIf=false, nincs disabledIf → disabled=true (auto)', () => {
    it('should skip validation when visible=false (auto disabled)', async () => {
      const formData = {
        customerType: 'individual',
        companyName: '', // Üres, de nem látható, így nem validálódik
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'customerType',
          },
          {
            type: 'text',
            name: 'companyName',
            visibleIf: { customerType: 'company' },
            validationRules: [
              {
                type: 'required',
                message: 'Company name is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // A mező nem látható, ezért skip-elve van (disabled=true auto)
      expect(result.valid).toBe(true);
      expect(result.fieldResults?.['companyName']?.skipped).toBe(true);
    });
  });

  describe('Test 3: visibleIf=true ÉS disabledIf=true → disabled=true', () => {
    it('should skip validation when visible=true but disabledIf=true (adószám példa)', async () => {
      const formData = {
        customerType: 'company',
        status: 'foreign',
        taxNumber: '', // Üres, de disabled, így nem validálódik
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'customerType',
          },
          {
            type: 'text',
            name: 'status',
          },
          {
            type: 'text',
            name: 'taxNumber',
            visibleIf: { customerType: 'company' },
            disabledIf: { status: 'foreign' },
            validationRules: [
              {
                type: 'required',
                message: 'Tax number is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // A mező látható, de disabled, ezért skip-elve van
      expect(result.valid).toBe(true);
      expect(result.fieldResults?.['taxNumber']?.skipped).toBe(true);
    });

    it('should validate when visible=true and disabledIf=false', async () => {
      const formData = {
        customerType: 'company',
        status: 'domestic',
        taxNumber: '12345678',
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'customerType',
          },
          {
            type: 'text',
            name: 'status',
          },
          {
            type: 'text',
            name: 'taxNumber',
            visibleIf: { customerType: 'company' },
            disabledIf: { status: 'foreign' },
            validationRules: [
              {
                type: 'required',
                message: 'Tax number is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // A mező látható ÉS nem disabled, ezért validálódik
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Test 4: Csak disabledIf, nincs visibleIf → régi logika', () => {
    it('should use normal disabledIf logic when no visibleIf', async () => {
      const formData = {
        emailVerified: true,
        email: '', // Üres, de disabled, így nem validálódik
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'checkbox',
            name: 'emailVerified',
          },
          {
            type: 'text',
            name: 'email',
            disabledIf: { emailVerified: true },
            validationRules: [
              {
                type: 'required',
                message: 'Email is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // Nincs visibleIf, csak disabledIf=true, ezért skip-elve van
      expect(result.valid).toBe(true);
      expect(result.fieldResults?.['email']?.skipped).toBe(true);
    });

    it('should validate when disabledIf=false and no visibleIf', async () => {
      const formData = {
        emailVerified: false,
        email: 'test@example.com',
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'checkbox',
            name: 'emailVerified',
          },
          {
            type: 'text',
            name: 'email',
            disabledIf: { emailVerified: true },
            validationRules: [
              {
                type: 'required',
                message: 'Email is required',
              },
              {
                type: 'email',
                message: 'Invalid email format',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // Nincs visibleIf, disabledIf=false, ezért validálódik
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Test 5: Konténer típusok (group, tabbed)', () => {
    it('should handle field with visibleIf inside group correctly', async () => {
      const formData = {
        customerType: 'individual',
        companyName: '', // Nem látható mező
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'customerType',
          },
          {
            type: 'group',
            name: 'companySection',
            items: [
              {
                type: 'text',
                name: 'companyName',
                visibleIf: { customerType: 'company' },
                validationRules: [
                  {
                    type: 'required',
                    message: 'Company name is required',
                  },
                ],
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // A mező nem látható, ezért skip-elve van
      expect(result.valid).toBe(true);
      // Group container adds to path: companySection.companyName
      expect(result.fieldResults?.['companySection.companyName']?.skipped).toBe(true);
    });
  });

  describe('Test 6: Komplex feltételek (AND/OR operátorok)', () => {
    it('should handle AND condition in visibleIf', async () => {
      const formData = {
        customerType: 'company',
        country: 'DE', // Nem HU, ezért nem látható
        vatNumber: '',
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'customerType',
          },
          {
            type: 'text',
            name: 'country',
          },
          {
            type: 'text',
            name: 'vatNumber',
            visibleIf: {
              and: [{ customerType: 'company' }, { country: 'HU' }],
            },
            disabledIf: { vatExempt: true },
            validationRules: [
              {
                type: 'required',
                message: 'VAT number is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // Az AND feltétel false (country nem HU), ezért auto disabled
      expect(result.valid).toBe(true);
      expect(result.fieldResults?.['vatNumber']?.skipped).toBe(true);
    });

    it('should validate when AND condition is true and disabledIf=false', async () => {
      const formData = {
        customerType: 'company',
        country: 'HU',
        vatExempt: false,
        vatNumber: '12345678-1-23',
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'customerType',
          },
          {
            type: 'text',
            name: 'country',
          },
          {
            type: 'checkbox',
            name: 'vatExempt',
          },
          {
            type: 'text',
            name: 'vatNumber',
            visibleIf: {
              and: [{ customerType: 'company' }, { country: 'HU' }],
            },
            disabledIf: { vatExempt: true },
            validationRules: [
              {
                type: 'required',
                message: 'VAT number is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // Az AND feltétel true ÉS disabledIf false, ezért validálódik
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip validation when visible=true but disabledIf=true (vatExempt case)', async () => {
      const formData = {
        customerType: 'company',
        country: 'HU',
        vatExempt: true,
        vatNumber: '', // Üres, de disabled
      };

      const formConfig: FormConfig = {
        formId: 'test-form',
        items: [
          {
            type: 'text',
            name: 'customerType',
          },
          {
            type: 'text',
            name: 'country',
          },
          {
            type: 'checkbox',
            name: 'vatExempt',
          },
          {
            type: 'text',
            name: 'vatNumber',
            visibleIf: {
              and: [{ customerType: 'company' }, { country: 'HU' }],
            },
            disabledIf: { vatExempt: true },
            validationRules: [
              {
                type: 'required',
                message: 'VAT number is required',
              },
            ],
          },
        ],
      };

      const result = await validator.validate(formData, formConfig);

      // Látható, de disabled, ezért skip-elve van
      expect(result.valid).toBe(true);
      expect(result.fieldResults?.['vatNumber']?.skipped).toBe(true);
    });
  });
});
