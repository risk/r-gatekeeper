# r-gatekeeper

Type-safe input/output gates around your handlers, powered by [Zod](https://github.com/colinhacks/zod).

`r-gatekeeper` sits at the boundary between “outside world” and “inside world” and makes sure:

- 🚫 **No unexpected data comes in** – inputs are validated before your handler runs.
- 🚫 **No unexpected data leaks out** – outputs are validated before they leave the gate.
- ✅ **Your handler only deals with validated data**.
- ✅ **Errors are normalized** as a small discriminated union (`GateResult`).

It is intentionally small and focused: no DI container、no framework、just gates.

---

## Installation

```bash
npm install r-gatekeeper zod
# or
yarn add r-gatekeeper zod
pnpm add r-gatekeeper zod
```

---

## Core concepts

r-gatekeeper is built around three ideas:

1. **Schemas at the boundary**  
   You describe the input/output of a handler with Zod schemas.

2. **Handlers work on validated data**  
   Handlers never see `unknown`. They receive `z.infer<IN>` and must return `z.infer<OUT>` (or an `Error`).

3. **Uniform result shape**  
   Gates always return a `GateResult<T>`:

```ts
type GateResult<T> = { ok: true; data: T } | { ok: false; error: GateError }

type GateError =
  | { kind: 'input'; error: ZodError } // invalid input
  | { kind: 'output'; error: ZodError } // invalid output
  | { kind: 'handler'; error: Error } // handler-level failure
```

You decide how to log / map / rethrow errors based on `kind`.

---

## Quick start

```ts
import { z } from 'zod'
import { withGate } from 'r-gatekeeper'

// 1. Define schemas for the boundary
const schemas = {
  in: z.object({
    id: z.string().uuid(),
  }),
  out: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
}

// 2. Implement your handler using validated types
const getUser = withGate(schemas, ({ id }) => {
  // input is already validated: id is a UUID string
  const user = findUserById(id) // e.g. from a repository
  if (!user) {
    return new Error('User not found')
  }
  return user
})

// 3. Use the gate at a boundary (e.g. HTTP handler)
async function httpHandler(req: Request): Promise<Response> {
  const body = await req.json()
  const result = getUser(body)

  if (!result.ok) {
    // You can branch on error kind
    switch (result.error.kind) {
      case 'input':
        return new Response('Bad Request', { status: 400 })
      case 'handler':
        return new Response('Not Found', { status: 404 })
      case 'output':
        // output schema mismatch -> our side is wrong
        console.error(result.error.error)
        return new Response('Internal Server Error', { status: 500 })
    }
  }

  return new Response(JSON.stringify(result.data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
```

---

## API

All functions are fully typed and built on top of Zod.

### `withGate`

```ts
import { withGate } from 'r-gatekeeper'
import { z } from 'zod'

const gate = withGate(
  {
    in: z.object({ value: z.number() }),
    out: z.object({ doubled: z.number() }),
  },
  ({ value }) => ({ doubled: value * 2 })
)

const result = gate({ value: 2 }) // value: unknown
// result: GateResult<{ doubled: number }>
```

- Input type: `unknown`  
  → validated by `schemas.in.safeParse`
- Handler input: `z.infer<typeof schemas.in>`
- Handler output: `z.infer<typeof schemas.out> | Error`
- Output type: `GateResult<z.infer<typeof schemas.out>>`

Use this at **outer boundaries** where raw data flows in (HTTP, queues, CLIs, etc.).

### `withGateFixedIn`

```ts
import { withGateFixedIn } from 'r-gatekeeper'

const schemas = {
  in: z.preprocess(value => (typeof value === 'string' ? JSON.parse(value) : value), z.object({ value: z.number() })),
  out: z.object({ doubled: z.number() }),
}

const gate = withGateFixedIn(schemas, ({ value }) => ({ doubled: value * 2 }))

// accepts the Zod "input type", not unknown
const result = gate('{"value": 2}')
```

- Input type: `z.input<IN_SCHEMA>`
- Handler input: `z.infer<IN_SCHEMA>`
- Output type: `GateResult<z.infer<OUT_SCHEMA>>`

Use this when you want the **function signature** to expose the exact Zod input type (including `preprocess` / `transform` chains).

### Async variants

```ts
import { withGateAsync, withGateFixedInAsync } from 'r-gatekeeper'

const gate = withGateAsync(
  {
    in: z.object({ id: z.string() }),
    out: z.object({ id: z.string(), name: z.string() }),
  },
  async ({ id }) => {
    const user = await repo.findById(id)
    if (!user) return new Error('User not found')
    return user
  }
)

const result = await gate({ id: '123' })
// result: Promise<GateResult<{ id: string; name: string }>>
```

- `withGateAsync` – same as `withGate`, but:
  - Handler may return a value or `Error`, or a `Promise` of either.
  - Uses `safeParseAsync` for input/output.
- `withGateFixedInAsync` – async version of `withGateFixedIn`.

---

## Error handling helpers

Helpers for narrowing `GateResult` と `GateError`:

```ts
import {
  isGateResultOk,
  isGateResultError,
  isGateInputError,
  isGateOutputError,
  isGateHandlerError,
} from 'r-gatekeeper'

const result = gate(someInput)

if (isGateResultOk(result)) {
  // result.data is available here
} else if (isGateResultError(result)) {
  if (isGateInputError(result.error)) {
    // schemas.in validation failed
  } else if (isGateOutputError(result.error)) {
    // schemas.out validation failed
  } else if (isGateHandlerError(result.error)) {
    // handler returned an Error
  }
}
```

Of course, you can also use a `switch` statement on the discriminated union if you prefer.

---

## TypeScript and Zod notes

- `GateSchemaType` is a thin alias around `z.ZodType`.
- The library does **not** force `z.strict()`.
  → Whether to use strict schemas or not is a design decision on the consumer side.
- Handlers are **not thrown from inside the library**.
  If you want to signal a handler-level failure, return an `Error` value (it will become `kind: 'handler'`).
  If you want to `throw`, do it at the outer boundary after inspecting the `GateResult`.

---

## When to use r-gatekeeper

Typical scenarios where r-gatekeeper works well:

- Controller / Presenter layers in API servers.
- Server Actions / Route Handlers in frameworks like Next.js or Remix.
- Message queue consumers/producers and batch job boundaries.
- As a boundary in front of/behind other libraries (for example, `r-pipeline`).

Use it when you don't want to change your inner business logic, but you do want to make the boundary between "outside" and "inside" explicit, validated, and safe.

---

## Credits

This project was built collaboratively between human design and AI assistance.

Design and coding by risk  
Design assistance and coding support by ChatGPT  
Code review by ChatGPT and Cursor AI  
Documentation generated by ChatGPT and Cursor AI

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the project
npm run build

# Run linting
npm run lint

# Format code
npm run format
```

---

## License

MIT
