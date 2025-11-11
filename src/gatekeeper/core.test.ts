/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import { z } from 'zod'

import { withGate, withGateAsync, withGateFixedIn, withGateFixedInAsync } from './core'
import { isGateHandlerError, isGateInputError, isGateOutputError, isGateResultError, isGateResultOk } from './helper'
import { GateHandlerFromSchemas } from './typeHelper'

describe('Gatekeeper Core', () => {
  describe('withGate', () => {
    it('Primitive type schema', () => {
      const gate = withGate(
        {
          in: z.number(),
          out: z.string(),
        },
        input => input.toString()
      )
      const result = gate(1)
      expect(isGateResultOk(result)).toBeTruthy()
      if (isGateResultOk(result)) {
        expect(result.data).toBe('1')
      }
    })
    it('Object type schema', () => {
      const gate = withGate(
        {
          in: z.object({ str: z.string(), num: z.number() }),
          out: z.object({ bool: z.boolean(), strNum: z.string() }),
        },
        input => ({ bool: true, strNum: `${input.str}:${input.num.toString()}` })
      )
      const result = gate({ str: '2', num: 3 })
      expect(isGateResultOk(result)).toBeTruthy()
      if (isGateResultOk(result)) {
        expect(result.data).toStrictEqual({ bool: true, strNum: '2:3' })
      }
    })

    it('Primitive type schema (Fixed input type)', () => {
      const gate = withGateFixedIn(
        {
          in: z.number(),
          out: z.string(),
        },
        input => input.toString()
      )
      const result = gate(1)
      expect(isGateResultOk(result)).toBeTruthy()
      if (isGateResultOk(result)) {
        expect(result.data).toBe('1')
      }
    })
    it('Object type schema (Fixed input type)', () => {
      const gate = withGateFixedIn(
        {
          in: z.object({ str: z.string(), num: z.number() }),
          out: z.object({ bool: z.boolean(), strNum: z.string() }),
        },
        input => ({ bool: true, strNum: `${input.str}:${input.num.toString()}` })
      )
      const result = gate({ str: '2', num: 3 })
      expect(isGateResultOk(result)).toBeTruthy()
      if (isGateResultOk(result)) {
        expect(result.data).toStrictEqual({ bool: true, strNum: '2:3' })
      }
    })

    describe('Error cases', () => {
      it('Input data is invalid', () => {
        const gate = withGate(
          {
            in: z.number(),
            out: z.string(),
          },
          input => input.toString()
        )
        const result = gate('1')
        expect(isGateResultError(result)).toBeTruthy()
        if (isGateResultError(result)) {
          expect(isGateInputError(result.error)).toBeTruthy()
          if (isGateInputError(result.error)) {
            expect(result.error.error).toBeInstanceOf(z.ZodError)
          }
        }
      })

      it('Output data is invalid', () => {
        const schemas = {
          in: z.number(),
          out: z.string(),
        }
        // Gate returns a number
        const gate = withGate(schemas, ((input: number) => input) as unknown as GateHandlerFromSchemas<typeof schemas>)
        const result = gate(1)
        expect(isGateResultError(result)).toBeTruthy()
        if (isGateResultError(result)) {
          expect(isGateOutputError(result.error)).toBeTruthy()
          if (isGateOutputError(result.error)) {
            expect(result.error.error).toBeInstanceOf(z.ZodError)
          }
        }
      })

      it('Handler returns an error', () => {
        const gate = withGate(
          {
            in: z.number(),
            out: z.string(),
          },
          _input => new Error('error')
        )
        const result = gate(1)
        expect(isGateResultError(result)).toBeTruthy()
        if (isGateResultError(result)) {
          expect(isGateHandlerError(result.error)).toBeTruthy()
          if (isGateHandlerError(result.error)) {
            expect(result.error.error).toBeInstanceOf(Error)
            expect(result.error.error.message).toBe('error')
          }
        }
      })
    })
  })

  describe('withGateAsync', () => {
    it('Primitive type schema', async () => {
      const asyncGate = withGateAsync(
        {
          in: z.number(),
          out: z.string(),
        },
        async input => input.toString()
      )
      const result = await asyncGate(1)
      expect(isGateResultOk(result)).toBeTruthy()
      if (isGateResultOk(result)) {
        expect(result.data).toBe('1')
      }
    })
    it('Primitive type schema (use sync handler)', async () => {
      const asyncGate = withGateAsync(
        {
          in: z.number(),
          out: z.string(),
        },
        input => input.toString()
      )
      const result = await asyncGate(1)
      expect(isGateResultOk(result)).toBeTruthy()
      if (isGateResultOk(result)) {
        expect(result.data).toBe('1')
      }
    })
    it('Object type schema', async () => {
      const asyncGate = withGateAsync(
        {
          in: z.object({ str: z.string(), num: z.number() }),
          out: z.object({ bool: z.boolean(), strNum: z.string() }),
        },
        async input => ({ bool: true, strNum: `${input.str}:${input.num.toString()}` })
      )
      const result = await asyncGate({ str: '2', num: 3 })
      expect(isGateResultOk(result)).toBeTruthy()
      if (isGateResultOk(result)) {
        expect(result.data).toStrictEqual({ bool: true, strNum: '2:3' })
      }
    })
    it('Primitive type schema (Fixed input type)', async () => {
      const asyncGate = withGateFixedInAsync(
        {
          in: z.number(),
          out: z.string(),
        },
        input => input.toString()
      )
      const result = await asyncGate(1)
      expect(isGateResultOk(result)).toBeTruthy()
      if (isGateResultOk(result)) {
        expect(result.data).toBe('1')
      }
    })
    it('Object type schema (Fixed input type)', async () => {
      const asyncGate = withGateFixedInAsync(
        {
          in: z.object({ str: z.string(), num: z.number() }),
          out: z.object({ bool: z.boolean(), strNum: z.string() }),
        },
        input => ({ bool: true, strNum: `${input.str}:${input.num.toString()}` })
      )
      const result = await asyncGate({ str: '2', num: 3 })
      expect(isGateResultOk(result)).toBeTruthy()
      if (isGateResultOk(result)) {
        expect(result.data).toStrictEqual({ bool: true, strNum: '2:3' })
      }
    })

    describe('Error cases', () => {
      it('Input data is invalid', async () => {
        const asyncGate = withGateAsync(
          {
            in: z.number(),
            out: z.string(),
          },
          async input => input.toString()
        )
        const result = await asyncGate('1')
        expect(isGateResultError(result)).toBeTruthy()
        if (isGateResultError(result)) {
          expect(isGateInputError(result.error)).toBeTruthy()
          if (isGateInputError(result.error)) {
            expect(result.error.error).toBeInstanceOf(z.ZodError)
          }
        }
      })

      it('Output data is invalid', async () => {
        const schemas = {
          in: z.number(),
          out: z.string(),
        }
        // Gate returns a number
        const asyncGate = withGateAsync(
          schemas,
          (async (input: number) => input) as unknown as GateHandlerFromSchemas<typeof schemas>
        )
        const result = await asyncGate(1)
        expect(isGateResultError(result)).toBeTruthy()
        if (isGateResultError(result)) {
          expect(isGateOutputError(result.error)).toBeTruthy()
          if (isGateOutputError(result.error)) {
            expect(result.error.error).toBeInstanceOf(z.ZodError)
          }
        }
      })

      it('Handler returns an error', async () => {
        const asyncGate = withGateAsync(
          {
            in: z.number(),
            out: z.string(),
          },
          async _input => new Error('error')
        )
        const result = await asyncGate(1)
        expect(isGateResultError(result)).toBeTruthy()
        if (isGateResultError(result)) {
          expect(isGateHandlerError(result.error)).toBeTruthy()
          if (isGateHandlerError(result.error)) {
            expect(result.error.error).toBeInstanceOf(Error)
            expect(result.error.error.message).toBe('error')
          }
        }
      })
    })
  })
})
