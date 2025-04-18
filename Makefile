BB=../aztec-packages/barretenberg/cpp/build/bin/bb

install-bun:
	curl -fsSL https://bun.sh/install | bash

install-noir:
	curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
	noirup --version 1.0.0-beta.3

install-barretenberg:
	curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
	bbup --version 0.85.0

install-starknet:
	curl --proto '=https' --tlsv1.2 -sSf https://sh.starkup.dev | sh

install-devnet:
	asdf plugin add starknet-devnet
	asdf install starknet-devnet 0.3.0

install-garaga:
	pip install garaga==0.17.0

devnet:
	starknet-devnet --accounts=2 --seed=0 --initial-balance=100000000000000000000000

accounts-file:
	curl -s http://localhost:5050/predeployed_accounts | jq '{"alpha-sepolia": {"devnet0": {address: .[0].address, private_key: .[0].private_key, public_key: .[0].public_key, class_hash: "0xe2eb8f5672af4e6a4e8a8f1b44989685e668489b0a25437733756c5a34a1d6", deployed: true, legacy: false, salt: "0x14", type: "open_zeppelin"}}}' > ./contracts/accounts.json

build-circuit:
	cd circuit && nargo build

exec-circuit:
	cd circuit && nargo execute witness

prove-circuit:
	bb prove --scheme ultra_honk --oracle_hash keccak -b ./circuit/target/circuit.json -w ./circuit/target/witness.gz -o ./circuit/target

gen-vk:
	$(BB) write_vk --scheme ultra_honk --oracle_hash starknet -b ./circuit/target/circuit.json -o ./circuit/target

gen-verifier:
	cd contracts && garaga gen --system ultra_starknet_honk --vk ../circuit/target/vk --project-name verifier

build-contracts:
	cd contracts && scarb build

declare-verifier:
	cd contracts && sncast declare --package verifier --contract-name UltraStarknetHonkVerifier

deploy-verifier:
	# TODO: use class hash from the result of the `make declare-verifier` step
	cd contracts && sncast deploy --class-hash 0x00bb20462f9741231dca2052a0d4b15d1c7c91b3ba0df91cb264e4f9fd5e80cc

test-account:
	cd contracts/account && snforge test --detailed-resources

declare-account:
	cd contracts/account && sncast declare --package account --contract-name FaucetAccount

deploy-account:
	# TODO: use class hash from the result of the `make declare-account` step
	cd contracts && sncast deploy --class-hash 0x007dd3fbf0bb89cb8e9956e2ad69a4078e921eda0b792bc97016ad400233e2b6

invoke-account:
	python scripts/invoke.py contracts/account/tests/data/calldata.txt 

artifacts:
	cp ./circuit/target/circuit.json ./app/src/assets/circuit.json
	cp ./circuit/target/vk ./app/src/assets/vk.bin
	cp ./contracts/target/release/account_FaucetAccount.contract_class.json ./app/src/assets/account.json

run-app:
	cd app && bun run dev
