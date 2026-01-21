export type ErrorRequestContext = {
  route?: string
  operation?: string
  inputSummary?: string
}

export type ErrorContext = {
  where: string
  what: string
  correlationId?: string
  request?: ErrorRequestContext
}

export type ErrorReport = ErrorContext & {
  message: string
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'Unknown error'
}

export const formatErrorReport = (
  error: unknown,
  context: ErrorContext
): ErrorReport => ({
  ...context,
  message: getErrorMessage(error),
})

export const logErrorReport = (
  error: unknown,
  context: ErrorContext
): ErrorReport => {
  const report = formatErrorReport(error, context)
  console.error('❌ [ErrorReport]', report)
  return report
}
