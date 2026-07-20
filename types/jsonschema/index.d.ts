
declare namespace JSONSchema {
    interface ValidationResult {
        valid: boolean;
        errors: ValidationError[];
        output: string[];
    }

    interface ValidationError {
        property: string;
        message: string;
    }

    interface Schema {
        type?: string | string | 'union';
        'extends'?: Schema;
        readonly?: boolean;
        optional?: boolean;
        disallow?: any;
        items?: Schema | Schema[];
        minItems?: number;
        maxItems?: number;
        additionalProperties?: boolean | Schema;
        properties?: { [key: string]: Schema };
        pattern?: RegExp;
        maxLength?: number;
        minLength?: number;
        minimum?: number;
        maximum?: number;
        'Enum'?: any[];
        maxDecimal?: number;
        requires?: string;
        prohibits?: string;
    }

    function validate(instance: any, schema?: Schema): ValidationResult;
    function checkPropertyChange(value: any, schema: Schema, property?: string): ValidationResult;
}
