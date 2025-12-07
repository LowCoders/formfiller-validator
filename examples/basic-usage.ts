/**
 * Basic Usage Example
 * 
 * Demonstrates basic validation with the FormFiller Validator
 */

import { Validator, FormConfig } from '../src';

// Example form data
const formData = {
  user: {
    firstName: 'John',
    lastName: 'Doe',
    email: '[email protected]',
    age: 25,
    country: 'US',
  },
};

// Example form configuration
const formConfig: FormConfig = {
  formId: 'user-registration',
  items: [
    {
      type: 'text',
      name: 'user.firstName',
      label: 'First Name',
      validationRules: [
        {
          type: 'required',
          message: 'First name is required',
        },
        {
          type: 'stringLength',
          min: 2,
          max: 50,
          message: 'First name must be between 2 and 50 characters',
        },
      ],
    },
    {
      type: 'text',
      name: 'user.lastName',
      label: 'Last Name',
      validationRules: [
        {
          type: 'required',
          message: 'Last name is required',
        },
        {
          type: 'stringLength',
          min: 2,
          max: 50,
          message: 'Last name must be between 2 and 50 characters',
        },
      ],
    },
    {
      type: 'text',
      name: 'user.email',
      label: 'Email',
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
    {
      type: 'text',
      name: 'user.age',
      label: 'Age',
      validationRules: [
        {
          type: 'required',
          message: 'Age is required',
        },
        {
          type: 'range',
          min: 18,
          max: 100,
          message: 'Age must be between 18 and 100',
        },
      ],
    },
    {
      type: 'text',
      name: 'user.country',
      label: 'Country',
      // Conditionally required based on age
      requiredIf: {
        field: 'user.age',
        operator: '>=',
        value: 18,
      },
      validationRules: [
        {
          type: 'required',
          message: 'Country is required for adults',
        },
      ],
    },
  ],
};

// Create validator
const validator = new Validator({
  mode: 'sequential',
  locale: 'en',
  cache: {
    enabled: true,
    ttl: 60000, // 1 minute
  },
  devtools: true,
});

// Validate
async function validateForm(): Promise<void> {
  try {
    const result = await validator.validate(formData, formConfig);

    console.log('Validation Result:', {
      valid: result.valid,
      errors: result.errors,
      fieldResults: result.fieldResults,
      metadata: result.metadata,
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

