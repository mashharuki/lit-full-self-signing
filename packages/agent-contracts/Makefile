-include .env

.PHONY: help deploy-registry

help: ## Display this help screen
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

deploy-registry: ## Deploy the Lit Agent Registry contract
	@if [ -z "$(CHAIN_TO_DEPLOY_TO_RPC_URL)" ]; then \
		echo "Error: CHAIN_TO_DEPLOY_TO_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(LIT_AGENT_REGISTRY_DEPLOYER_PRIVATE_KEY)" ]; then \
		echo "Error: LIT_AGENT_REGISTRY_DEPLOYER_PRIVATE_KEY is not set in .env"; \
		exit 1; \
	fi
	@echo "Deploying Lit Agent Registry to $(CHAIN_TO_DEPLOY_TO_RPC_URL)..."
	@forge script -vvv script/DeployLitAgentRegistry.s.sol:DeployLitAgentRegistry \
		--rpc-url $(CHAIN_TO_DEPLOY_TO_RPC_URL) \
		--broadcast \
		--private-key $(LIT_AGENT_REGISTRY_DEPLOYER_PRIVATE_KEY)

# verify-registry: ## Verify the Lit Agent Registry contract on Etherscan
# 	@if [ -z "$(CHAIN_TO_DEPLOY_TO_RPC_URL)" ]; then \
# 		echo "Error: CHAIN_TO_DEPLOY_TO_RPC_URL is not set in .env"; \
# 		exit 1; \
# 	fi
# 	@if [ -z "$(ETHERSCAN_API_KEY)" ]; then \
# 		echo "Error: ETHERSCAN_API_KEY is not set in .env"; \
# 		exit 1; \
# 	fi
# 	@if [ -z "$(REGISTRY_ADDRESS)" ]; then \
# 		echo "Error: REGISTRY_ADDRESS is not set in .env"; \
# 		exit 1; \
# 	fi
# 	@echo "Verifying Lit Agent Registry at $(REGISTRY_ADDRESS)..."
# 	@forge verify-contract \
# 		--chain-id $(CHAIN_ID) \
# 		--num-of-optimizations 200 \
# 		--watch \
# 		--etherscan-api-key $(ETHERSCAN_API_KEY) \
# 		--compiler-version v0.8.24+commit.f704f362 \
# 		$(REGISTRY_ADDRESS) \
# 		src/LitAgentRegistry.sol:LitAgentRegistry