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

  public async checkAgentWalletForPermittedTool(
    matchedTool: ToolInfo | null
  ): Promise<boolean> {
    if (!matchedTool) {
      return false;
    }

    const permittedActions = await this.signer.pkpListPermittedActions();
    return permittedActions.includes(matchedTool.ipfsCid);
  }

  public async analyzeUserIntentAndMatchAction(userIntent: string) {
    // Get all available tools first
    const availableTools = listAvailableTools();

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
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

    const isPermitted = await this.checkAgentWalletForPermittedTool(
      matchedTool
    );

    return {
      analysis,
      matchedTool,
      isPermitted,
    };
  }
}
