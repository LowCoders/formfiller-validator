/**
 * Conditional Validation Example
 * 
 * Demonstrates conditional validation with visibleIf, disabledIf, requiredIf
 */

import { Validator, FormConfig } from '../src';

// Example form data
const formData = {
  employmentType: 'employee',
  companyName: 'Acme Corp',
  selfEmployedBusinessName: '',
  hasVehicle: true,
  vehiclePlateNumber: 'ABC-123',
};

// Example form configuration with conditional rules
const formConfig: FormConfig = {
  formId: 'employment-form',
  items: [
    {
      type: 'text',
      name: 'employmentType',
      label: 'Employment Type',
      validationRules: [
        {
          type: 'required',
          message: 'Employment type is required',
        },
      ],
    },
    {
      type: 'text',
      name: 'companyName',
      label: 'Company Name',
      // Visible only if employment type is 'employee'
      visibleIf: {
        field: 'employmentType',
        operator: '==',
        value: 'employee',
      },
      validationRules: [
        {
          type: 'required',
          message: 'Company name is required',
        },
      ],
    },
    {
      type: 'text',
      name: 'selfEmployedBusinessName',
      label: 'Business Name',
      // Visible only if employment type is 'self-employed'
      visibleIf: {
        field: 'employmentType',
        operator: '==',
        value: 'self-employed',
      },
      validationRules: [
        {
          type: 'required',
          message: 'Business name is required',
        },
      ],
    },
    {
      type: 'text',
      name: 'hasVehicle',
      label: 'Do you have a vehicle?',
      validationRules: [
        {
          type: 'required',
          message: 'Please specify if you have a vehicle',
        },
      ],
    },
    {
      type: 'text',
      name: 'vehiclePlateNumber',
      label: 'Vehicle Plate Number',
      // Required only if hasVehicle is true
      requiredIf: {
        field: 'hasVehicle',
        operator: '==',
        value: true,
      },
      // Disabled if hasVehicle is false
      disabledIf: {
        field: 'hasVehicle',
        operator: '==',
        value: false,
      },
      validationRules: [
        {
          type: 'required',
          message: 'Vehicle plate number is required',
        },
        {
          type: 'pattern',
          pattern: /^[A-Z]{3}-\d{3}$/,
          message: 'Invalid plate number format (expected: ABC-123)',
        },
      ],
    },
  ],
};

// Create validator
const validator = new Validator({
  mode: 'sequential',
  locale: 'en',
  devtools: true,
});

// Validate
async function validateForm(): Promise<void> {
  console.log('Form Data:', formData);
  console.log('---');

  try {
    const result = await validator.validate(formData, formConfig);

    console.log('Validation Result:', {
      valid: result.valid,
      errors: result.errors,
      skippedFields: Object.entries(result.fieldResults || {})
        .filter(([_, r]) => r.skipped)
        .map(([field, r]) => ({ field, reason: r.skipReason })),
    });

    if (result.valid) {
      console.log('✅ Form is valid!');
    } else {
      console.log('❌ Form has errors:');
      for (const error of result.errors) {
        console.log(`  - ${error.field}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error('Validation error:', error);
  }
}

// Run validation
validateForm().catch(console.error);

