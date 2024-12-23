import { AgentSigner } from '@lit-protocol/agent-signer/dist/src/lib/agent-signer';
import type { ToolInfo } from '@lit-protocol/agent-tool-registry';
import { OpenAI } from 'openai';

import { LitAgentError, LitAgentErrorType } from './errors';
import {
  findTool,
  executeAction,
  analyzeUserIntent,
  parseToolParameters,
} from './utils/tool';
import { handleToolPermission, checkToolPermission } from './utils/permission';
import { initializeSigner } from './utils/wallet';
import { validateAndCollectParameters } from './utils/parameters';

export { LitAgentError, LitAgentErrorType } from './errors';

export class LitAgent {
  private signer!: AgentSigner;
  private openai: OpenAI;
  private openAiModel: string;

  constructor(
    private readonly litAuthPrivateKey: string,
    openAiApiKey: string,
    openAiModel = 'gpt-4o-mini'
  ) {
    this.openai = new OpenAI({ apiKey: openAiApiKey });
    this.openAiModel = openAiModel;
  }

  public async init(): Promise<void> {
    this.signer = await initializeSigner(this.litAuthPrivateKey);
  }

  public async executeTool(
    ipfsCid: string,
    initialParams: Record<string, string>,
    options: {
      permissionCallback?: (tool: ToolInfo) => Promise<boolean>;
      parameterCallback?: (
        tool: ToolInfo,
        missingParams: string[]
      ) => Promise<Record<string, string>>;
    } = {}
  ): Promise<{ success: boolean; result?: any; reason?: string }> {
    try {
      // Find and validate tool
      const tool = await findTool(ipfsCid);

      // Handle permissions
      try {
        await handleToolPermission(
          this.signer,
          tool,
          options.permissionCallback
        );
      } catch (error) {
        if (
          error instanceof LitAgentError &&
          error.type === LitAgentErrorType.TOOL_PERMISSION_FAILED &&
          error.message === 'Permission denied by user'
        ) {
          return {
            success: false,
            reason: error.message,
          };
        }
        throw error;
      }

      // Validate and collect parameters
      const finalParams = await validateAndCollectParameters(
        tool,
        initialParams,
        options.parameterCallback
      );

      // Execute the tool
      const result = await executeAction(this.signer, ipfsCid, finalParams);

      return {
        success: true,
        result,
      };
    } catch (error) {
      if (error instanceof LitAgentError) {
        throw error;
      }
      throw new LitAgentError(
        LitAgentErrorType.TOOL_EXECUTION_FAILED,
        'Failed to execute tool',
        { ipfsCid, params: initialParams, originalError: error }
      );
    }
  }

  public async analyzeUserIntentAndMatchAction(userIntent: string) {
    const { analysis, matchedTool } = await analyzeUserIntent(
      this.openai,
      this.openAiModel,
      userIntent
    );

    const isPermitted = matchedTool
      ? await checkToolPermission(this.signer, matchedTool)
      : false;

    const params = matchedTool
      ? await parseToolParameters(
          this.openai,
          this.openAiModel,
          userIntent,
          matchedTool
        )
      : { foundParams: {}, missingParams: [] };

    return { analysis, matchedTool, isPermitted, params };
  }
}
