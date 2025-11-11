/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import type { z } from 'zod'

import { GateResult, GateSchemas, GateSchemaType } from './types'

function gateOk<RET>(data: RET) {
  return {
    ok: true,
    data,
  } as const
}

function gateInputError(error: z.ZodError) {
  return {
    ok: false,
    error: {
      kind: 'input',
      error,
    },
  } as const
}

function gateOutputError(error: z.ZodError) {
  return {
    ok: false,
    error: {
      kind: 'output',
      error,
    },
  } as const
}

function gateHandlerError(error: Error) {
  return {
    ok: false,
    error: {
      kind: 'handler',
      error,
    },
  } as const
}

/**
 * Internal helper to wrap a handler with input/output validation and GateResult.
 *
 * @internal
 */
function gateWrapHandler<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType, WRAP_IN>(
  schemas: GateSchemas<IN_SCHEMA, OUT_SCHEMA>,
  handler: (input: z.infer<IN_SCHEMA>) => z.infer<OUT_SCHEMA> | Error
) {
  return (input: WRAP_IN): GateResult<z.infer<OUT_SCHEMA>> => {
    const parsedInput = schemas.in.safeParse(input)
    if (!parsedInput.success) {
      return gateInputError(parsedInput.error)
    }
    const result = handler(parsedInput.data)
    if (result instanceof Error) {
      return gateHandlerError(result)
    }
    const parsedResult = schemas.out.safeParse(result)
    if (!parsedResult.success) {
      return gateOutputError(parsedResult.error)
    }
    return gateOk(parsedResult.data)
  }
}

/**
 * Creates a gate that validates both input and output around a handler.
 *
 * - The returned function accepts `unknown` as input.
 * - Input is validated by `schemas.in.safeParse`.
 * - Output is validated by `schemas.out.safeParse`.
 * - If validation passes, the handler is called with a typed input.
 *
 * Use this when you are at an outer boundary (e.g. HTTP handler, message queue, etc.)
 * and want the gate to accept untyped data and guard it with Zod.
 *
 * @typeParam IN_SCHEMA - Zod schema type for the handler input.
 * @typeParam OUT_SCHEMA - Zod schema type for the handler output.
 * @param schemas.in - Zod schema used to validate the input.
 * @param schemas.out - Zod schema used to validate the output.
 * @param handler - Business logic that runs with a validated input.
 *   - Return a value matching `schemas.out` on success.
 *   - Return an `Error` to propagate a handler-level failure.
 * @returns A function that:
 *   - Validates input/output using Zod.
 *   - Returns a `GateResult` with either validated data or a typed error.
 */
export function withGate<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType>(
  schemas: GateSchemas<IN_SCHEMA, OUT_SCHEMA>,
  handler: (input: z.infer<IN_SCHEMA>) => z.infer<OUT_SCHEMA> | Error
) {
  return gateWrapHandler<IN_SCHEMA, OUT_SCHEMA, unknown>(schemas, handler)
}

/**
 * Same as {@link withGate}, but fixes the input type to `z.input<IN_SCHEMA>`.
 *
 * This is useful when you want the outer signature to expose the exact Zod input type,
 * including any `z.preprocess` / `z.transform` behavior.
 *
 * - The returned function accepts `z.input<IN_SCHEMA>` instead of `unknown`.
 * - Internally the handler still receives `z.infer<IN_SCHEMA>`.
 *
 * @typeParam IN_SCHEMA - Zod schema type for the handler input.
 * @typeParam OUT_SCHEMA - Zod schema type for the handler output.
 * @param schemas.in - Zod schema used to validate the input.
 * @param schemas.out - Zod schema used to validate the output.
 * @param handler - Business logic that runs with a validated input.
 *   - Return a value matching `schemas.out` on success.
 *   - Return an `Error` to propagate a handler-level failure.
 * @returns A function that:
 *   - Validates input/output using Zod.
 *   - Returns a `GateResult` with either validated data or a typed error.
 */
export function withGateFixedIn<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType>(
  schemas: GateSchemas<IN_SCHEMA, OUT_SCHEMA>,
  handler: (input: z.infer<IN_SCHEMA>) => z.infer<OUT_SCHEMA> | Error
) {
  return gateWrapHandler<IN_SCHEMA, OUT_SCHEMA, z.input<IN_SCHEMA>>(schemas, handler)
}

/**
 * Internal async helper to wrap a handler with input/output validation and GateResult.
 *
 * Uses `safeParseAsync` / `safeParseAsync` and supports both sync and async handlers.
 *
 * @internal
 */
function gateWrapHandlerAsync<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType, WRAP_IN>(
  schemas: GateSchemas<IN_SCHEMA, OUT_SCHEMA>,
  handler: (input: z.infer<IN_SCHEMA>) => z.infer<OUT_SCHEMA> | Error | Promise<z.infer<OUT_SCHEMA> | Error>
) {
  return async (input: WRAP_IN): Promise<GateResult<z.infer<OUT_SCHEMA>>> => {
    const parsedInput = await schemas.in.safeParseAsync(input)
    if (!parsedInput.success) {
      return gateInputError(parsedInput.error)
    }
    const result = await handler(parsedInput.data)
    if (result instanceof Error) {
      return gateHandlerError(result)
    }
    const parsedResult = await schemas.out.safeParseAsync(result)
    if (!parsedResult.success) {
      return gateOutputError(parsedResult.error)
    }
    return gateOk(parsedResult.data)
  }
}

/**
 * Async version of {@link withGate}.
 *
 * - Accepts both sync and async handlers.
 * - Uses `safeParseAsync` for input and output validation.
 *
 * Use this when your handler performs async work (e.g. database, HTTP calls).
 *
 * @typeParam IN_SCHEMA - Zod schema type for the handler input.
 * @typeParam OUT_SCHEMA - Zod schema type for the handler output.
 * @param schemas.in - Zod schema used to validate the input.
 * @param schemas.out - Zod schema used to validate the output.
 * @param handler - Business logic that runs with a validated input.
 *   - May return the output value or an `Error` directly.
 *   - Or a `Promise` that resolves to a value or an `Error`.
 * @returns An async function that:
 *   - Validates input/output using Zod.
 *   - Resolves to a `GateResult` with either validated data or a typed error.
 */
export function withGateAsync<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType>(
  schemas: GateSchemas<IN_SCHEMA, OUT_SCHEMA>,
  handler: (input: z.infer<IN_SCHEMA>) => z.infer<OUT_SCHEMA> | Error | Promise<z.infer<OUT_SCHEMA> | Error>
) {
  return gateWrapHandlerAsync<IN_SCHEMA, OUT_SCHEMA, unknown>(schemas, handler)
}

/**
 * Async version of {@link withGateFixedIn}.
 *
 * - The returned function accepts `z.input<IN_SCHEMA>` instead of `unknown`.
 * - Internally the handler still receives `z.infer<IN_SCHEMA>`.
 * - Supports both sync and async handlers.
 *
 * @typeParam IN_SCHEMA - Zod schema type for the handler input.
 * @typeParam OUT_SCHEMA - Zod schema type for the handler output.
 * @param schemas.in - Zod schema used to validate the input.
 * @param schemas.out - Zod schema used to validate the output.
 * @param handler - Business logic that runs with a validated input.
 *   - May return the output value or an `Error` directly.
 *   - Or a `Promise` that resolves to a value or an `Error`.
 * @returns An async function that:
 *   - Validates input/output using Zod.
 *   - Resolves to a `GateResult` with either validated data or a typed error.
 */
export function withGateFixedInAsync<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType>(
  schemas: GateSchemas<IN_SCHEMA, OUT_SCHEMA>,
  handler: (input: z.infer<IN_SCHEMA>) => z.infer<OUT_SCHEMA> | Error | Promise<z.infer<OUT_SCHEMA> | Error>
) {
  return gateWrapHandlerAsync<IN_SCHEMA, OUT_SCHEMA, z.input<IN_SCHEMA>>(schemas, handler)
}
