import generated from './schemas.json' with { type: 'json' }

/** A JSON Schema (draft-07) for each public model type, keyed by type name. References point at `#/components/schemas/<Type>`. */
export const schemas: Record<string, Record<string, unknown>> = generated
