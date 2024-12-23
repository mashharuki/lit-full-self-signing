import { AgentSigner } from '@lit-protocol/agent-signer';
import {
  listAvailableTools,
  type ToolInfo,
} from '@lit-protocol/agent-tool-registry';
import { OpenAI } from 'openai';
import type { ethers } from 'ethers';

export class LitAgent {
  private signer: AgentSigner;
  private openai: OpenAI;
  private readonly openAiModel = 'gpt-4o-mini';

  constructor(signer: AgentSigner, openAiApiKey: string) {
    this.signer = signer;
    this.openai = new OpenAI({ apiKey: openAiApiKey });
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
