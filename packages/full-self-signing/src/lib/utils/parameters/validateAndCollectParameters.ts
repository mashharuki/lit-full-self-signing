import type { ToolInfo } from '@lit-protocol/fss-tool-registry';
import { LitAgentError, LitAgentErrorType } from '../../errors';

export async function validateAndCollectParameters(
  tool: ToolInfo,
  initialParams: Record<string, string>,
  parameterCallback?: (
    tool: ToolInfo,
    missingParams: string[]
  ) => Promise<Record<string, string>>
): Promise<Record<string, string>> {
  const requiredParams = new Set(tool.parameters.map((p) => p.name));
  const missingParams = Array.from(requiredParams).filter(
    (param) => !(param in initialParams)
  );

  let finalParams = { ...initialParams };

  if (missingParams.length > 0) {
    if (!parameterCallback) {
      throw new LitAgentError(
        LitAgentErrorType.INVALID_PARAMETERS,
        'Missing required parameters and no parameter callback provided',
        { missingParams }
      );
    }

    const additionalParams = await parameterCallback(tool, missingParams);
    finalParams = { ...finalParams, ...additionalParams };

    // Verify all required parameters are now present
    const stillMissing = Array.from(requiredParams).filter(
      (param) => !(param in finalParams)
    );
    if (stillMissing.length > 0) {
      throw new LitAgentError(
        LitAgentErrorType.INVALID_PARAMETERS,
        'Required parameters still missing after collection',
        { missingParams: stillMissing }
      );
    }
  }

  return finalParams;
}
