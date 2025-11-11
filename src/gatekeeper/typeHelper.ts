/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import type { z } from 'zod'

import { GateSchemaType, GateSchemas } from './types'

export type GateHandlerInput<IN_SCHEMA extends GateSchemaType> = z.infer<IN_SCHEMA>
export type GateHandlerResult<OUT_SCHEMA extends GateSchemaType> = z.infer<OUT_SCHEMA> | Error
export type GateHandlerAsyncResult<OUT_SCHEMA extends GateSchemaType> =
  | GateHandlerResult<OUT_SCHEMA>
  | Promise<GateHandlerResult<OUT_SCHEMA>>

export type GateHandler<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType> = (
  input: GateHandlerInput<IN_SCHEMA>
) => GateHandlerResult<OUT_SCHEMA>

export type GateHandlerFromSchemas<SCHEMAS extends GateSchemas<GateSchemaType, GateSchemaType>> = GateHandler<
  SCHEMAS['in'],
  SCHEMAS['out']
>

export type GateHandlerAsync<IN_SCHEMA extends GateSchemaType, OUT_SCHEMA extends GateSchemaType> = (
  input: GateHandlerInput<IN_SCHEMA>
) => GateHandlerAsyncResult<OUT_SCHEMA>

export type GateHandlerAsyncFromSchemas<SCHEMAS extends GateSchemas<GateSchemaType, GateSchemaType>> = GateHandlerAsync<
  SCHEMAS['in'],
  SCHEMAS['out']
>
