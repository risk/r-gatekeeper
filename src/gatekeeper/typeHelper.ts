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
 * Result type of a sync gate handler.
 *
 * The handler:
 * - Returns `z.infer<OUT_SCHEMA>` on success.
 * - Or returns an {@link Error} to signal a handler-level failure.
 *
 * @typeParam OUT_SCHEMA - Zod schema type for the handler output.
 */
export type GateHandlerResult<OUT_SCHEMA extends GateSchemaType> = z.infer<OUT_SCHEMA> | Error

/**
 * Result type of an async-capable gate handler.
 *
 * The handler may:
 * - Return `GateHandlerResult<OUT_SCHEMA>` directly.
 * - Or a `Promise` that resolves to `GateHandlerResult<OUT_SCHEMA>`.
 *
 * @typeParam OUT_SCHEMA - Zod schema type for the handler output.
 */
export type GateHandlerAsyncResult<OUT_SCHEMA extends GateSchemaType> =
  | GateHandlerResult<OUT_SCHEMA>
  | Promise<GateHandlerResult<OUT_SCHEMA>>

/**
 * Signature of a sync gate handler.
 *
 * @typeParam IN_SCHEMA - Zod schema type for the handler input.
 * @typeParam OUT_SCHEMA - Zod schema type for the handler output.
 * @param input - Validated input value inferred from `IN_SCHEMA`.
 */
export type GateHandler<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType> = (
  input: GateHandlerInput<IN_SCHEMA>
) => GateHandlerResult<OUT_SCHEMA>

/**
 * Helper type to derive a sync handler signature from a pair of gate schemas.
 *
 * - The handler receives `z.infer<SCHEMAS['in']>` as input.
 * - The handler must return either `z.infer<SCHEMAS['out']>` or an {@link Error}.
 *
 * This is mainly used in tests or advanced usage where you need to align a handler type
 * with a given {@link GateSchemas} object.
 *
 * @typeParam SCHEMAS - A pair of input/output Zod schemas.
 */
export type GateHandlerFromSchemas<SCHEMAS extends GateSchemas<GateSchemaType, GateSchemaType>> = GateHandler<
  SCHEMAS['in'],
  SCHEMAS['out']
>

/**
 * Signature of an async-capable gate handler.
 *
 * The handler may be:
 * - Purely sync (returning `GateHandlerResult<OUT_SCHEMA>`), or
 * - Async (returning `Promise<GateHandlerResult<OUT_SCHEMA>>`).
 *
 * @typeParam IN_SCHEMA - Zod schema type for the handler input.
 * @typeParam OUT_SCHEMA - Zod schema type for the handler output.
 * @param input - Validated input value inferred from `IN_SCHEMA`.
 */
export type GateHandlerAsync<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType> = (
  input: GateHandlerInput<IN_SCHEMA>
) => GateHandlerAsyncResult<OUT_SCHEMA>

/**
 * Helper type to derive an async-capable handler signature from a pair of gate schemas.
 *
 * - The handler receives `z.infer<SCHEMAS['in']>` as input.
 * - The handler may return the output or an {@link Error} directly,
 *   or a `Promise` that resolves to either.
 *
 * @typeParam SCHEMAS - A pair of input/output Zod schemas.
 */
export type GateHandlerAsyncFromSchemas<SCHEMAS extends GateSchemas<GateSchemaType, GateSchemaType>> = GateHandlerAsync<
  SCHEMAS['in'],
  SCHEMAS['out']
>
