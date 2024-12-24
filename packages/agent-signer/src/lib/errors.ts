export enum LitAgentErrorType {
  TOOL_POLICY_REGISTRATION_FAILED = 'TOOL_POLICY_REGISTRATION_FAILED',
  TOOL_PERMISSION_FAILED = 'TOOL_PERMISSION_FAILED',
  TOOL_VALIDATION_FAILED = 'TOOL_VALIDATION_FAILED',
  TOOL_EXECUTION_FAILED = 'TOOL_EXECUTION_FAILED',
}

export class LitAgentError extends Error {
  constructor(
    public readonly type: LitAgentErrorType,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'LitAgentError';
  }
}
