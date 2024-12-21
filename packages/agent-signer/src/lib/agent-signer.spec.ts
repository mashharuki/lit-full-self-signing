import { agentSigner } from './agent-signer';

describe('agentSigner', () => {
  it('should work', () => {
    expect(agentSigner()).toEqual('agent-signer');
  });
});
