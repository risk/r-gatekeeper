/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import { z } from 'zod'

import { withGate } from '../gatekeeper/core'
import { GateHandlerFromSchemas } from '../gatekeeper/typeHelper'
import { GateSchemaType } from '../gatekeeper/types'

function createCommandSchemas<PAYLOAD_SCHEMA extends GateSchemaType>(command: string, payloadSchema: PAYLOAD_SCHEMA) {
  return {
    in: z
      .object({
        command: z.literal(command),
        payload: payloadSchema,
      })
      .strict(),
    out: z.object({
      command: z.string(),
      message: z.string(),
    }),
  }
}

function withCommandGate<PAYLOAD_SCHEMA extends GateSchemaType>(command: string, payloadSchema: PAYLOAD_SCHEMA) {
  const schemas = createCommandSchemas(command, payloadSchema)
  return (handler: GateHandlerFromSchemas<typeof schemas>) => withGate(schemas, handler)
}

const userPayloadSchema = z
  .object({
    name: z.string(),
    age: z.number(),
  })
  .strict()

const userCommandHandler = withCommandGate(
  'user',
  userPayloadSchema
)(input => {
  const message = `${input.payload.name}(${input.payload.age})`
  return {
    command: input.command,
    message,
  }
})
console.log(
  'User command result',
  userCommandHandler({
    command: 'user',
    payload: {
      name: 'test name',
      age: 25,
    },
  })
)
