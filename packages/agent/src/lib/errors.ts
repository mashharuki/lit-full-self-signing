export enum LitAgentErrorType {
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  WALLET_CREATION_FAILED = 'WALLET_CREATION_FAILED',
  TOOL_PERMISSION_FAILED = 'TOOL_PERMISSION_FAILED',
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
}

export class LitAgentError extends Error {
  constructor(
    public type: LitAgentErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'LitAgentError';
  }
}
