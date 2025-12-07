/**
 * Nested Forms Example
 * 
 * Demonstrates validation of nested form structures (groups, tabs)
 */

import { Validator, FormConfig } from '../src';

// Example form data with nested structure
const formData = {
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1990-01-01',
  },
  contactInfo: {
    email: '[email protected]',
    phone: '+1234567890',
    address: {
      street: '123 Main St',
      city: 'New York',
      zipCode: '10001',
    },
  },
  preferences: {
    newsletter: true,
    notifications: false,
  },
};

// Example form configuration with nested structure
const formConfig: FormConfig = {
  formId: 'user-profile',
  items: [
    {
      type: 'tabbed',
      name: 'mainTabs',
      tabs: [
        {
          title: 'Personal Information',
          items: [
            {
              type: 'group',
              name: 'group',
              label: 'Basic Info',
              items: [
                {
      type: 'text',
      name: 'personalInfo.firstName',
                  label: 'First Name',
                  validationRules: [
                    {
                      type: 'required',
                      message: 'First name is required',
                    },
                  ],
                },
                {
      type: 'text',
      name: 'personalInfo.lastName',
                  label: 'Last Name',
                  validationRules: [
                    {
                      type: 'required',
                      message: 'Last name is required',
                    },
                  ],
                },
                {
      type: 'text',
      name: 'personalInfo.birthDate',
                  label: 'Birth Date',
                  validationRules: [
                    {
                      type: 'required',
                      message: 'Birth date is required',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Contact Information',
          items: [
            {
              type: 'group',
              name: 'group',
              label: 'Contact Details',
              items: [
                {
      type: 'text',
      name: 'contactInfo.email',
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
      name: 'contactInfo.phone',
                  label: 'Phone',
                  validationRules: [
                    {
                      type: 'required',
                      message: 'Phone is required',
                    },
                  ],
                },
              ],
            },
            {
              type: 'group',
              name: 'group',
              label: 'Address',
              items: [
                {
      type: 'text',
      name: 'contactInfo.address.street',
                  label: 'Street',
                  validationRules: [
                    {
                      type: 'required',
                      message: 'Street is required',
                    },
                  ],
                },
                {
      type: 'text',
      name: 'contactInfo.address.city',
                  label: 'City',
                  validationRules: [
                    {
                      type: 'required',
                      message: 'City is required',
                    },
                  ],
                },
                {
      type: 'text',
      name: 'contactInfo.address.zipCode',
                  label: 'ZIP Code',
                  validationRules: [
                    {
                      type: 'required',
                      message: 'ZIP code is required',
                    },
                    {
                      type: 'pattern',
                      pattern: /^\d{5}$/,
                      message: 'Invalid ZIP code format',
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          title: 'Preferences',
          items: [
            {
      type: 'text',
      name: 'preferences.newsletter',
              label: 'Subscribe to newsletter',
            },
            {
      type: 'text',
      name: 'preferences.notifications',
              label: 'Enable notifications',
            },
          ],
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
  console.log('Form Data (nested structure):', JSON.stringify(formData, null, 2));
  console.log('---');

  try {
    const result = await validator.validate(formData, formConfig);

    console.log('Validation Result:', {
      valid: result.valid,
      totalErrors: result.errors.length,
      validatedFields: Object.keys(result.fieldResults || {}).length,
    });

    if (result.valid) {
      console.log('✅ Form is valid!');
    } else {
      console.log('❌ Form has errors:');
      for (const error of result.errors) {
        console.log(`  - ${error.field}: ${error.message}`);
      }
    }

    console.log('\nField Results:');
    for (const [field, fieldResult] of Object.entries(result.fieldResults || {})) {
      const status = fieldResult.valid ? '✅' : '❌';
      const skipped = fieldResult.skipped ? ' (skipped)' : '';
      console.log(`  ${status} ${field}${skipped}`);
    }
  } catch (error) {
    console.error('Validation error:', error);
  }
}

// Run validation
validateForm().catch(console.error);

