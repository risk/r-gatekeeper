/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import { z } from 'zod'

import { withGate } from '../gatekeeper/core'

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
  console.log('Safe area', input)
  return JSON.stringify(input)
})
console.log(
  'Sync result',
  gate({
    schema1: {
      num: 1,
      str: 'sample',
      // strictError: 'test',
    },
    schema2: {
      bool: true,
      url: 'https://example.com',
    },
  })
)
// Output
// Safe area {
//   schema1: { num: 1, str: 'sample' },
//   schema2: { bool: true, url: 'https://example.com' }
// }
// Sync result {
//   ok: true,
//   data: '{"schema1":{"num":1,"str":"sample"},"schema2":{"bool":true,"url":"https://example.com"}}'
// }
