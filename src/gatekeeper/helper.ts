/*
 * Copyright (c) 2025 risk
 * Licensed under the MIT License.
 * https://github.com/risk/r-gatekeeper
 */

import type { z } from 'zod'

import { GateResult, GateError } from './types'

/**
 * Type guard for a successful {@link GateResult}.
 *
 * @typeParam RET - The payload type carried by the gate on success.
 * @param result - The result returned from a gate.
 * @returns `true` if the result is successful (`ok: true`) and contains `data`.
 */
export function isGateResultOk<RET>(result: GateResult<RET>): result is { ok: true; data: RET } {
  return result.ok
}

/**
 * Type guard for a failed {@link GateResult}.
 *
 * @typeParam RET - The payload type carried by the gate on success.
 * @param result - The result returned from a gate.
 * @returns `true` if the result is an error (`ok: false`) and contains `error`.
 */
export function isGateResultError<RET>(result: GateResult<RET>): result is { ok: false; error: GateError } {
  return !result.ok
}

/**
 * Narrows a {@link GateError} to an input validation error.
 *
 * Use this when `schemas.in` failed to validate the incoming data.
 *
 * @param error - The error object from a failed gate.
 * @returns `true` if the error was caused by invalid input data.
 */
export function isGateInputError(error: GateError): error is { kind: 'input'; error: z.ZodError } {
  return error.kind === 'input'
}

/**
 * Narrows a {@link GateError} to an output validation error.
 *
 * Use this when the handler returned a value that does not match `schemas.out`.
 *
 * @param error - The error object from a failed gate.
 * @returns `true` if the error was caused by invalid output data.
 */
export function isGateOutputError(error: GateError): error is { kind: 'output'; error: z.ZodError } {
  return error.kind === 'output'
}

/**
 * Narrows a {@link GateError} to a handler error.
 *
 * Use this when the handler itself returned an {@link Error}.
 *
 * @param error - The error object from a failed gate.
 * @returns `true` if the error represents a handler-level failure.
 */
export function isGateHandlerError(error: GateError): error is { kind: 'handler'; error: Error } {
  return error.kind === 'handler'
}
