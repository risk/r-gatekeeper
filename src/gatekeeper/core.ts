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

export function withGate<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType>(
  schemas: GateSchemas<IN_SCHEMA, OUT_SCHEMA>,
  handler: (input: z.infer<IN_SCHEMA>) => z.infer<OUT_SCHEMA> | Error
) {
  return gateWrapHandler<IN_SCHEMA, OUT_SCHEMA, unknown>(schemas, handler)
}

export function withGateFixedIn<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType>(
  schemas: GateSchemas<IN_SCHEMA, OUT_SCHEMA>,
  handler: (input: z.infer<IN_SCHEMA>) => z.infer<OUT_SCHEMA> | Error
) {
  return gateWrapHandler<IN_SCHEMA, OUT_SCHEMA, z.input<IN_SCHEMA>>(schemas, handler)
}

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

export function withGateAsync<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType>(
  schemas: GateSchemas<IN_SCHEMA, OUT_SCHEMA>,
  handler: (input: z.infer<IN_SCHEMA>) => z.infer<OUT_SCHEMA> | Error | Promise<z.infer<OUT_SCHEMA> | Error>
) {
  return gateWrapHandlerAsync<IN_SCHEMA, OUT_SCHEMA, unknown>(schemas, handler)
}

export function withGateFixedInAsync<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType>(
  schemas: GateSchemas<IN_SCHEMA, OUT_SCHEMA>,
  handler: (input: z.infer<IN_SCHEMA>) => z.infer<OUT_SCHEMA> | Error | Promise<z.infer<OUT_SCHEMA> | Error>
) {
  return gateWrapHandlerAsync<IN_SCHEMA, OUT_SCHEMA, z.input<IN_SCHEMA>>(schemas, handler)
}
