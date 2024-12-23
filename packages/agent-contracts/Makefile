-include .env

.PHONY: help deploy-registry build test deploy-dev-erc20 mint-dev-erc20

help: ## Display this help screen
	@grep -h -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

deploy-registry: ## Deploy the Lit Agent Registry contract
	@if [ -z "$(CHAIN_TO_DEPLOY_TO_RPC_URL)" ]; then \
		echo "Error: CHAIN_TO_DEPLOY_TO_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@echo "Deploying Lit Agent Registry to $(CHAIN_TO_DEPLOY_TO_RPC_URL)..."
	@forge script -vvv script/DeployLitAgentRegistry.s.sol:DeployLitAgentRegistry \
		--rpc-url $(CHAIN_TO_DEPLOY_TO_RPC_URL) \
		--broadcast \
		--private-key $(FORGE_DEPLOYER_PRIVATE_KEY) 

# deploy-registry: ## Deploy the Lit Agent Registry contract
# 	@if [ -z "$(CHAIN_TO_DEPLOY_TO_RPC_URL)" ]; then \
# 		echo "Error: CHAIN_TO_DEPLOY_TO_RPC_URL is not set in .env"; \
# 		exit 1; \
# 	fi
# 	@if [ -z "$(LIT_AGENT_REGISTRY_DEPLOYER_PRIVATE_KEY)" ]; then \
# 		echo "Error: LIT_AGENT_REGISTRY_DEPLOYER_PRIVATE_KEY is not set in .env"; \
# 		exit 1; \
# 	fi
# 	@echo "Deploying Lit Agent Registry to $(CHAIN_TO_DEPLOY_TO_RPC_URL)..."
# 	@forge script -vvv script/DeployLitAgentRegistry.s.sol:DeployLitAgentRegistry \
# 		--rpc-url $(CHAIN_TO_DEPLOY_TO_RPC_URL) \
# 		--broadcast \
# 		--private-key $(LIT_AGENT_REGISTRY_DEPLOYER_PRIVATE_KEY)

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

build:
	forge build

test:
	forge test

deploy-dev-erc20: ## Deploy the DevERC20 contract
	@if [ -z "$(CHAIN_TO_DEPLOY_TO_RPC_URL)" ]; then \
		echo "Error: CHAIN_TO_DEPLOY_TO_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@echo "Deploying DevERC20 to $(CHAIN_TO_DEPLOY_TO_RPC_URL)..."
	@forge script -vvv script/DeployDevERC20.s.sol:DeployDevERC20Script \
		--rpc-url $(CHAIN_TO_DEPLOY_TO_RPC_URL) \
		--broadcast \
		--private-key $(FORGE_DEPLOYER_PRIVATE_KEY)

mint-dev-erc20: ## Mint DevERC20 tokens for a recipient
	@if [ -z "$(CHAIN_TO_DEPLOY_TO_RPC_URL)" ]; then \
		echo "Error: CHAIN_TO_DEPLOY_TO_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DEVERC20_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DEVERC20_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DEVERC20_MINT_RECIPIENT)" ]; then \
		echo "Error: DEVERC20_MINT_RECIPIENT is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DEVERC20_MINT_AMOUNT)" ]; then \
		echo "Error: DEVERC20_MINT_AMOUNT is not set in .env"; \
		exit 1; \
	fi
	@echo "Minting $(DEVERC20_MINT_AMOUNT) tokens for $(DEVERC20_MINT_RECIPIENT)..."
	@forge script -vvv script/MintDevERC20.s.sol:MintDevERC20Script \
		--rpc-url $(CHAIN_TO_DEPLOY_TO_RPC_URL) \
		--broadcast \
		--private-key $(FORGE_DEPLOYER_PRIVATE_KEY)

dev-erc20-balance: ## Check DevERC20 balance for an address. Usage: make dev-erc20-balance ADDR=0x...
	@if [ -z "$(CHAIN_TO_DEPLOY_TO_RPC_URL)" ]; then \
		echo "Error: CHAIN_TO_DEPLOY_TO_RPC_URL is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(DEVERC20_CONTRACT_ADDRESS)" ]; then \
		echo "Error: DEVERC20_CONTRACT_ADDRESS is not set in .env"; \
		exit 1; \
	fi
	@if [ -z "$(ADDR)" ]; then \
		echo "Error: ADDR parameter is required. Usage: make dev-erc20-balance ADDR=0x..."; \
		exit 1; \
	fi
	@echo "Checking DevERC20 balance for $(ADDR) ..."
	@cast call --json $(DEVERC20_CONTRACT_ADDRESS) \
		"balanceOf(address)(uint256)" $(ADDR) \
		--rpc-url $(CHAIN_TO_DEPLOY_TO_RPC_URL) \
	| jq -r '.[0]' \
	| xargs cast from-wei
