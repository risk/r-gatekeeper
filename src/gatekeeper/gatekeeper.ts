/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import { z } from 'zod'

export type GateErrorKind = 'input' | 'output' | 'handler'

export type GateError =
  | { kind: 'input'; error: z.ZodError }
  | { kind: 'output'; error: z.ZodError }
  | { kind: 'handler'; error: Error }

export type GateResult<RET> = { ok: true; data: RET } | { ok: false; error: GateError }

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

type GateSchemaType = z.ZodType
interface GateSchemas<IN extends GateSchemaType, OUT extends GateSchemaType> {
  in: IN
  out: OUT
}

export function withGate<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType>(
  schemas: GateSchemas<IN_SCHEMA, OUT_SCHEMA>,
  handler: (input: z.infer<IN_SCHEMA>) => z.infer<OUT_SCHEMA> | Error
) {
  return (input: unknown): GateResult<z.infer<OUT_SCHEMA>> => {
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

const schemas = {
  in: z.object({
    schema1: z
      .object({
        num: z.number(),
        str: z.string(),
      })
      .strict(),
    schema2: z
      .object({
        bool: z.boolean(),
        url: z.url(),
      })
      .strict(),
  }),
  out: z.string(),
}

const gate = withGate(schemas, input => {
  console.log('safeArea', input)
  return JSON.stringify(input)
})
console.log(
  gate({
    schema1: {
      num: 1,
      str: 'sample',
      strictError: 'test',
    },
    schema2: {
      bool: true,
      url: 'https://example.com',
    },
  })
)
