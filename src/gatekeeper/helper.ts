/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import type { z } from 'zod'

import { GateResult, GateError } from './types'

export function isGateResultOk<RET>(result: GateResult<RET>): result is { ok: true; data: RET } {
  return result.ok
}

export function isGateResultError<RET>(result: GateResult<RET>): result is { ok: false; error: GateError } {
  return !result.ok
}

export function isGateInputError(error: GateError): error is { kind: 'input'; error: z.ZodError } {
  return error.kind === 'input'
}

export function isGateOutputError(error: GateError): error is { kind: 'output'; error: z.ZodError } {
  return error.kind === 'output'
}

export function isGateHandlerError(error: GateError): error is { kind: 'handler'; error: Error } {
  return error.kind === 'handler'
}
