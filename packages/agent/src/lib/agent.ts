import { AgentSigner } from '@lit-protocol/agent-signer/dist/src/lib/agent-signer';
import {
  listAvailableTools,
  type ToolInfo,
} from '@lit-protocol/agent-tool-registry';
import { AUTH_METHOD_SCOPE } from '@lit-protocol/constants';
import { OpenAI } from 'openai';

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

export class LitAgent {
  private signer!: AgentSigner;
  private openai: OpenAI;
  private readonly openAiModel: string;
  private readonly litAuthPrivateKey: string;

  constructor(
    litAuthPrivateKey: string,
    openAiApiKey: string,
    openAiModel = 'gpt-4o-mini'
  ) {
    this.litAuthPrivateKey = litAuthPrivateKey;
    this.openai = new OpenAI({ apiKey: openAiApiKey });
    this.openAiModel = openAiModel;
  }

  public async init(): Promise<void> {
    try {
      // Initialize the signer
      this.signer = await AgentSigner.create(this.litAuthPrivateKey);

      // Check for existing wallet and create if needed
      if (!(await this.hasExistingAgentWallet())) {
        await this.createAgentWallet();
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Insufficient balance')) {
          throw new LitAgentError(
            LitAgentErrorType.INSUFFICIENT_BALANCE,
            'Insufficient balance to create agent wallet',
            { originalError: error }
          );
        }
        if (error.message.includes('Failed to create wallet')) {
          throw new LitAgentError(
            LitAgentErrorType.WALLET_CREATION_FAILED,
            'Failed to create agent wallet',
            { originalError: error }
          );
        }
      }
      throw new LitAgentError(
        LitAgentErrorType.INITIALIZATION_FAILED,
        'Failed to initialize LitAgent',
        { originalError: error }
      );
    }
  }

  private async createAgentWallet(): Promise<void> {
    try {
      await this.signer.createWallet();
    } catch (error) {
      throw new LitAgentError(
        LitAgentErrorType.WALLET_CREATION_FAILED,
        'Failed to create agent wallet',
        { originalError: error }
      );
    }
  }

  private async hasExistingAgentWallet(): Promise<boolean> {
    return !!AgentSigner.getPkpInfoFromStorage();
  }

  public async permitTool(ipfsCid: string): Promise<void> {
    try {
      await this.signer.pkpPermitLitAction({
        ipfsCid,
        signingScopes: [AUTH_METHOD_SCOPE.SignAnything],
      });
    } catch (error) {
      throw new LitAgentError(
        LitAgentErrorType.TOOL_PERMISSION_FAILED,
        'Failed to permit tool',
        { ipfsCid, originalError: error }
      );
    }
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
      // Find the tool info first
      const tool = listAvailableTools().find((t) => t.ipfsCid === ipfsCid);
      if (!tool) {
        throw new LitAgentError(
          LitAgentErrorType.TOOL_EXECUTION_FAILED,
          'Tool not found',
          { ipfsCid }
        );
      }

      // Check if tool is permitted
      const isPermitted = await this.checkAgentWalletForPermittedTool(tool);
      if (!isPermitted) {
        if (options.permissionCallback) {
          const shouldPermit = await options.permissionCallback(tool);
          if (!shouldPermit) {
            return {
              success: false,
              reason: 'Permission denied by user',
            };
          }
          await this.permitTool(ipfsCid);
        } else {
          throw new LitAgentError(
            LitAgentErrorType.TOOL_PERMISSION_FAILED,
            'Tool is not permitted',
            { ipfsCid }
          );
        }
      }

      // Validate and collect parameters
      const requiredParams = new Set(tool.parameters.map((p) => p.name));
      const missingParams = Array.from(requiredParams).filter(
        (param) => !(param in initialParams)
      );

      let finalParams = { ...initialParams };

      if (missingParams.length > 0) {
        if (!options.parameterCallback) {
          throw new LitAgentError(
            LitAgentErrorType.INVALID_PARAMETERS,
            'Missing required parameters and no parameter callback provided',
            { missingParams }
          );
        }

        const additionalParams = await options.parameterCallback(
          tool,
          missingParams
        );
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

      // Execute the tool
      const result = await this.signer.executeJs({
        ipfsId: ipfsCid,
        jsParams: finalParams,
      });

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

  private generateToolMatchingPrompt(tools: ToolInfo[]): string {
    const toolDescriptions = tools
      .map(
        (tool) =>
          `- Name: ${tool.name}\n  Description: ${tool.description}\n  CID: ${tool.ipfsCid}`
      )
      .join('\n');

    return `You are a web3 transaction analyzer. Given a user's intent and available tools, determine if there's an appropriate tool that matches exactly what the user wants to do.
          Available tools:
          ${toolDescriptions}
          Important:
          1. Only return a recommendedCID if you are completely certain the tool matches the user's intent exactly
          2. If you're unsure or the user's intent is unclear, return an empty recommendedCID
          3. All values in your response must be strings
          
          Return a JSON object with:
          {
            "recommendedCID": "the IPFS CID of the recommended tool, or empty string if no confident match",
            "reasoning": "explanation of why this tool was chosen or why no tool was chosen"
          }`;
  }

  private async checkAgentWalletForPermittedTool(
    matchedTool: ToolInfo
  ): Promise<boolean> {
    const permittedActions = await this.signer.pkpListPermittedActions();
    return permittedActions.includes(matchedTool.ipfsCid);
  }

  private async parseToolParameters(
    userIntent: string,
    tool: ToolInfo
  ): Promise<{
    foundParams: Record<string, string>;
    missingParams: string[];
  }> {
    const completion = await this.openai.chat.completions.create({
      model: this.openAiModel,
      messages: [
        {
          role: 'system',
          content: `You are a parameter parser for web3 transactions. Given a user's intent and a tool's required parameters, extract the parameter values from the intent.
          
          Tool: ${tool.name}
          Parameters:
          ${tool.parameters
            .map((param) => `- ${param.name}: ${param.description}`)
            .join('\n')}

          Return a JSON object with:
          {
            "foundParams": {
              "paramName": "extractedValue",
              ...
            },
            "missingParams": ["paramName1", "paramName2", ...]
          }

          Important:
          1. Only include parameters in foundParams if you are completely certain about their values
          2. For any parameters you're unsure about or can't find in the intent, include them in missingParams
          3. All parameter values must be strings
          4. For token amounts, return them as decimal strings (e.g., "1.5", "10.0")
          5. For addresses, ensure they start with "0x" and are the correct length`,
        },
        {
          role: 'user',
          content: userIntent,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return {
      foundParams: result.foundParams || {},
      missingParams: result.missingParams || [],
    };
  }

  public async analyzeUserIntentAndMatchAction(userIntent: string) {
    // Get all available tools first
    const availableTools = listAvailableTools();

    const completion = await this.openai.chat.completions.create({
      model: this.openAiModel,
      messages: [
        {
          role: 'system',
          content: this.generateToolMatchingPrompt(availableTools),
        },
        {
          role: 'user',
          content: userIntent,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || '{}');
    const matchedTool = analysis.recommendedCID
      ? availableTools.find(
          (tool) => tool.ipfsCid === analysis.recommendedCID
        ) || null
      : null;

    const isPermitted = matchedTool
      ? await this.checkAgentWalletForPermittedTool(matchedTool)
      : false;

    // If we have a matched tool, try to parse parameters
    const params = matchedTool
      ? await this.parseToolParameters(userIntent, matchedTool)
      : { foundParams: {}, missingParams: [] };

    return {
      analysis,
      matchedTool,
      isPermitted,
      params,
    };
  }
}
