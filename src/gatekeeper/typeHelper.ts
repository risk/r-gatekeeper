/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import type { z } from 'zod'

import { GateSchemaType, GateSchemas } from './types'

/**
 * Input type passed to a gate handler, derived from the input schema.
 *
 * @typeParam IN_SCHEMA - Zod schema type for the handler input.
 */
export type GateHandlerInput<IN_SCHEMA extends GateSchemaType> = z.infer<IN_SCHEMA>

/**
 * Value returned by a gate handler before output validation.
 *
 * Data coming back from outside the gate is untyped. `schemas.out` is what
 * stabilizes this value into `z.infer<OUT_SCHEMA>`.
 * An {@link Error} is intercepted as a handler-level failure and is not
 * passed to the output schema.
 */
export type GateHandlerResult = unknown

/**
 * Value returned by an async-capable gate handler before output validation.
 *
 * The handler may return {@link GateHandlerResult} directly, or a `Promise`
 * that resolves to it. `unknown` already includes both.
 */
export type GateHandlerAsyncResult = GateHandlerResult | Promise<GateHandlerResult>

/**
 * Signature of a sync gate handler.
 *
 * @typeParam IN_SCHEMA - Zod schema type for the handler input.
 * @param input - Validated input value inferred from `IN_SCHEMA`.
 */
export type GateHandler<IN_SCHEMA extends GateSchemaType> = (input: GateHandlerInput<IN_SCHEMA>) => GateHandlerResult

/**
 * Helper type to derive a sync handler signature from a pair of gate schemas.
 *
 * - The handler receives `z.infer<SCHEMAS['in']>` as input.
 * - The handler returns {@link GateHandlerResult}. `SCHEMAS['out']` validates that return at the gate.
 *
 * This is mainly used in tests or advanced usage where you need to align a handler type
 * with a given {@link GateSchemas} object.
 *
 * @typeParam SCHEMAS - A pair of input/output Zod schemas.
 */
export type GateHandlerFromSchemas<SCHEMAS extends GateSchemas<GateSchemaType, GateSchemaType>> = GateHandler<
  SCHEMAS['in']
>

/**
 * Signature of an async-capable gate handler.
 *
 * The handler may be sync or async. Its return is {@link GateHandlerAsyncResult}.
 *
 * @typeParam IN_SCHEMA - Zod schema type for the handler input.
 * @param input - Validated input value inferred from `IN_SCHEMA`.
 */
export type GateHandlerAsync<IN_SCHEMA extends GateSchemaType> = (
  input: GateHandlerInput<IN_SCHEMA>
) => GateHandlerAsyncResult

/**
 * Helper type to derive an async-capable handler signature from a pair of gate schemas.
 *
 * - The handler receives `z.infer<SCHEMAS['in']>` as input.
 * - The handler returns {@link GateHandlerAsyncResult}. `SCHEMAS['out']` validates that return at the gate.
 *
 * @typeParam SCHEMAS - A pair of input/output Zod schemas.
 */
export type GateHandlerAsyncFromSchemas<SCHEMAS extends GateSchemas<GateSchemaType, GateSchemaType>> = GateHandlerAsync<
  SCHEMAS['in']
>
