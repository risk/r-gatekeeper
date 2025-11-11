/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import { z } from 'zod'

import { withGateAsync } from '../gatekeeper/core'

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

async function asyncWrap() {
  const asyncGate = withGateAsync(schemas, async input => {
    console.log('Safe area', input)
    return JSON.stringify(input)
  })
  console.log(
    'Async result',
    await asyncGate({
      schema1: {
        num: 1,
        str: 'sample',
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
  // Async result {
  //   ok: true,
  //   data: '{"schema1":{"num":1,"str":"sample"},"schema2":{"bool":true,"url":"https://example.com"}}'
  // }
}
asyncWrap()
