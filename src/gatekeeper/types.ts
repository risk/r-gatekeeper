/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import type { z } from 'zod'

/**
 * Kinds of errors that can occur at a gate boundary.
 *
 * - `'input'`  – input data failed validation against the `in` schema.
 * - `'output'` – handler returned data that failed validation against the `out` schema.
 * - `'handler'` – the handler itself returned or threw an {@link Error}.
 */
export type GateErrorKind = 'input' | 'output' | 'handler'

/**
 * Discriminated union describing why a gate failed.
 *
 * - `'input'` contains the Zod validation error for the input.
 * - `'output'` contains the Zod validation error for the output.
 * - `'handler'` wraps an arbitrary {@link Error} returned by the handler.
 */
export type GateError =
  | { kind: 'input'; error: z.ZodError }
  | { kind: 'output'; error: z.ZodError }
  | { kind: 'handler'; error: Error }

/**
 * Result type returned from a gate.
 *
 * - On success, `ok: true` and a validated `data` payload.
 * - On failure, `ok: false` and a typed {@link GateError}.
 *
 * @typeParam RET - The payload type produced by the handler on success.
 */
export type GateResult<RET> = { ok: true; data: RET } | { ok: false; error: GateError }

/**
 * Zod schema type used for gate input/output.
 *
 * This is a constrained alias around {@link z.ZodType} to make the public API easier to read.
 */
export type GateSchemaType = z.ZodType

/**
 * Pair of Zod schemas used by a gate.
 *
 * - `in`  – schema used to validate the incoming data.
 * - `out` – schema used to validate the handler output.
 *
 * @typeParam IN_SCHEMA - Zod schema type for the handler input.
 * @typeParam OUT_SCHEMA - Zod schema type for the handler output.
 */
export interface GateSchemas<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType> {
  in: IN_SCHEMA
  out: OUT_SCHEMA
}
