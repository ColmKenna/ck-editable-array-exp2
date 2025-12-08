
import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
    if (!customElements.get('ck-editable-array')) {
        customElements.define('ck-editable-array', CkEditableArray);
    }
});

describe('FR-022: Value Property', () => {
    let element: CkEditableArray;

    beforeEach(() => {
        element = document.createElement('ck-editable-array') as CkEditableArray;
        document.body.appendChild(element);
    });

    afterEach(() => {
        element.remove();
    });

    test('TC-022-01: value getter returns JSON string', () => {
        type RowData = { name: string };
        const el = element as unknown as { data: RowData[]; value: string };
        el.data = [{ name: 'Alice' }, { name: 'Bob' }];
        expect(el.value).toBe(JSON.stringify([{ name: 'Alice' }, { name: 'Bob' }]));
    });

    test('TC-022-02: value setter parses JSON', () => {
        type RowData = { name: string };
        const el = element as unknown as { data: RowData[]; value: string };
        const data = [{ name: 'Charlie' }];
        el.value = JSON.stringify(data);
        expect(el.data).toEqual(data);
    });

    test('TC-022-03: Invalid JSON handled gracefully', () => {
        type RowData = { name: string };
        const el = element as unknown as { data: RowData[]; value: string };
        el.data = [{ name: 'Existing' }];
        el.value = 'invalid json';
        // Should default to empty array or keep existing?
        // Spec doesn't explicitly say, but usually empty array or safe fallback.
        // Based on FR-001 (Non-array data results in empty array), probably empty array.
        expect(el.data).toEqual([]);
    });
});

describe('FR-023: FormData Integration', () => {
    let element: CkEditableArray;

    beforeEach(() => {
        element = document.createElement('ck-editable-array') as CkEditableArray;
        element.setAttribute('name', 'users');
        document.body.appendChild(element);
    });

    afterEach(() => {
        element.remove();
    });

    test('TC-023-01: toFormData() returns FormData', () => {
        type RowData = { name: string };
        const el = element as unknown as { data: RowData[]; toFormData: () => FormData };
        el.data = [{ name: 'Alice' }];
        const formData = el.toFormData();
        expect(formData).toBeInstanceOf(FormData);
        expect(formData.get('users[0].name')).toBe('Alice');
    });

    test('TC-023-02: FormData keys follow pattern', () => {
        type RowData = { address: { city: string } };
        const el = element as unknown as { data: RowData[]; toFormData: () => FormData };
        el.data = [{ address: { city: 'New York' } }];
        const formData = el.toFormData();
        expect(formData.get('users[0].address.city')).toBe('New York');
    });

    test('TC-023-03: Internal properties excluded', () => {
        type RowData = { name: string; __isNew?: boolean; deleted?: boolean };
        const el = element as unknown as { data: RowData[]; toFormData: () => FormData };
        el.data = [{ name: 'Alice', __isNew: true }];
        const formData = el.toFormData();
        expect(formData.has('users[0].__isNew')).toBe(false);
    });
});

describe('FR-024 & FR-025: Validation API', () => {
    let element: CkEditableArray;

    beforeEach(() => {
        element = document.createElement('ck-editable-array') as CkEditableArray;
        document.body.appendChild(element);
    });

    afterEach(() => {
        element.remove();
    });

    test('TC-024-01: checkValidity() validates all rows', () => {
        type RowData = { name: string };
        const el = element as unknown as {
            data: RowData[];
            validationSchema: any;
            checkValidity: () => boolean;
        };
        el.validationSchema = { name: { required: true } };
        el.data = [{ name: '' }]; // Invalid
        expect(el.checkValidity()).toBe(false);
    });

    test('TC-024-02: Returns true when all valid', () => {
        type RowData = { name: string };
        const el = element as unknown as {
            data: RowData[];
            validationSchema: any;
            checkValidity: () => boolean;
        };
        el.validationSchema = { name: { required: true } };
        el.data = [{ name: 'Alice' }];
        expect(el.checkValidity()).toBe(true);
    });

    // TC-024-03 is redundant with 01 but good for coverage
    test('TC-024-03: Returns false when any invalid', () => {
        type RowData = { name: string };
        const el = element as unknown as {
            data: RowData[];
            validationSchema: any;
            checkValidity: () => boolean;
        };
        el.validationSchema = { name: { required: true } };
        el.data = [{ name: 'Alice' }, { name: '' }];
        expect(el.checkValidity()).toBe(false);
    });

    test('TC-025-01: reportValidity() updates UI', () => {
        // This is hard to test fully in JSDOM as reportValidity usually relies on browser UI,
        // but we can check if it returns the result of checkValidity and maybe triggers valid/invalid events or attributes.
        // For now assume it wraps checkValidity.
        type RowData = { name: string };
        const el = element as unknown as {
            data: RowData[];
            validationSchema: any;
            reportValidity: () => boolean;
        };
        el.validationSchema = { name: { required: true } };
        el.data = [{ name: '' }];
        expect(el.reportValidity()).toBe(false);
    });
});


describe('FR-025a: Form Association', () => {
    // JSDOM might not fully support formAssociated static property reflection on custom elements registry depending on version,
    // but let's test the property on the class and instance.

    test('TC-025a-01: formAssociated static property', () => {
        expect((CkEditableArray as any).formAssociated).toBe(true);
    });

    // ElementInternals mocking might be needed if JSDOM doesn't support attachInternals
    test('TC-025a-03: formResetCallback clears data', () => {
        const element = document.createElement('ck-editable-array') as CkEditableArray;
        (element as any).data = [{ name: 'test' }];
        // Manually trigger callback if we can't easily construct a form with reset in JSDOM without full polyfill
        if ((element as any).formResetCallback) {
            (element as any).formResetCallback();
            expect((element as any).data).toEqual([]);
        } else {
            // Skip if not implemented (this is the Red phase so it's expected to fail or not exist)
            throw new Error('formResetCallback not defined');
        }
    });

    test('TC-025a-04: formDisabledCallback sets readonly', () => {
        const element = document.createElement('ck-editable-array') as CkEditableArray;
        if ((element as any).formDisabledCallback) {
            (element as any).formDisabledCallback(true);
            expect((element as any).readonly).toBe(true);
            (element as any).formDisabledCallback(false);
            expect((element as any).readonly).toBe(false);
        } else {
            throw new Error('formDisabledCallback not defined');
        }
    });

});
