/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import type { z } from 'zod'

export type GateErrorKind = 'input' | 'output' | 'handler'

export type GateError =
  | { kind: 'input'; error: z.ZodError }
  | { kind: 'output'; error: z.ZodError }
  | { kind: 'handler'; error: Error }

export type GateResult<RET> = { ok: true; data: RET } | { ok: false; error: GateError }

export type GateSchemaType = z.ZodType

export interface GateSchemas<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType> {
  in: IN_SCHEMA
  out: OUT_SCHEMA
}
