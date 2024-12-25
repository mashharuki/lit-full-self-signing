import { SendERC20 } from './agent-tool-registry';
import { listAvailableTools, type ToolInfo } from './agent-tool-registry';

describe('FSS Tool Registry', () => {
  describe('SendERC20', () => {
    it('should expose the correct structure', () => {
      expect(SendERC20).toMatchObject({
        description: expect.any(String),
        Parameters: {
          schema: expect.any(Object),
          descriptions: expect.any(Object),
          validate: expect.any(Function),
        },
        metadata: {
          name: expect.any(String),
          description: expect.any(String),
          parameters: expect.any(Object),
          required: expect.any(Array),
          validation: expect.any(Object),
        },
        Policy: {
          schema: expect.any(Object),
          encode: expect.any(Function),
          decode: expect.any(Function),
        },
      });
    });

    it('should have parameter descriptions for all required parameters', () => {
      const requiredParams = [...SendERC20.metadata.required];
      const descriptions = Object.keys(SendERC20.Parameters.descriptions);

      expect(descriptions.sort()).toEqual(requiredParams.sort());
    });
  });

  describe('listAvailableTools', () => {
    let tools: ToolInfo[];

    beforeEach(() => {
      tools = listAvailableTools();
    });

    it('should return an array of tools', () => {
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should include SendERC20 tool', () => {
      const sendErc20Tool = tools.find((tool) => tool.name === 'SendERC20');
      expect(sendErc20Tool).toBeDefined();
      expect(sendErc20Tool?.description).toBe(SendERC20.description);
    });

    it('should have correct structure for each tool', () => {
      tools.forEach((tool) => {
        expect(tool).toMatchObject({
          name: expect.any(String),
          description: expect.any(String),
          parameters: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              description: expect.any(String),
            }),
          ]),
        });
      });
    });

    it('should have all required parameters listed', () => {
      const sendErc20Tool = tools.find((tool) => tool.name === 'SendERC20');
      const parameterNames = sendErc20Tool?.parameters.map(
        (param) => param.name
      );
      expect(parameterNames?.sort()).toEqual(
        [...SendERC20.metadata.required].sort()
      );
    });
  });
});
