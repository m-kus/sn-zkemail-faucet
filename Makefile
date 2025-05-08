install-bun:
	curl -fsSL https://bun.sh/install | bash

install-noir:
	curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
	noirup --version 1.0.0-beta.3

install-barretenberg:
	curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
	bbup --version 0.86.0-starknet.1

install-starknet:
	curl --proto '=https' --tlsv1.2 -sSf https://sh.starkup.dev | sh

install-devnet:
	asdf plugin add starknet-devnet
	asdf install starknet-devnet 0.3.0

install-garaga:
	pip install garaga==0.18.0

install-app-deps:
	cd app && bun install

devnet:
	starknet-devnet --accounts=2 --seed=0 --initial-balance=100000000000000000000000

accounts-file:
	curl -s http://localhost:5050/predeployed_accounts | jq '{"alpha-sepolia": {"devnet0": {address: .[0].address, private_key: .[0].private_key, public_key: .[0].public_key, class_hash: "0xe2eb8f5672af4e6a4e8a8f1b44989685e668489b0a25437733756c5a34a1d6", deployed: true, legacy: false, salt: "0x14", type: "open_zeppelin"}}}' > ./contracts/accounts.json

build-circuit:
	cd circuit && nargo build

exec-circuit:
	cd circuit && nargo execute witness

prove-circuit:
	bb prove --debug_logging --scheme ultra_honk --oracle_hash starknet -b ./circuit/target/circuit.json -w ./circuit/target/witness.gz -o ./circuit/target

verify-proof:
	bb verify -d --scheme ultra_honk --oracle_hash starknet -k ./circuit/target/vk -p ./circuit/target/proof -i ./circuit/target/public_inputs

gen-vk:
	bb write_vk --scheme ultra_honk --oracle_hash starknet -b ./circuit/target/circuit.json -o ./circuit/target

gen-verifier:
	cd contracts && garaga gen --system ultra_starknet_honk --vk ../circuit/target/vk --project-name verifier

build-contracts:
	cd contracts && scarb build

declare-verifier:
	cd contracts && sncast declare --package verifier --contract-name UltraStarknetHonkVerifier

deploy-verifier:
	# TODO: use class hash from the result of the `make declare-verifier` step
	cd contracts && sncast deploy --class-hash 0x020e1a52cbb055d740f6ef67728b8a99cedd40edbbf1f5c3bd1635e209227048

test-account:
	cd contracts/account && snforge test --detailed-resources

declare-account:
	cd contracts/account && sncast declare --package account --contract-name FaucetAccount

deploy-account:
	# TODO: use class hash from the result of the `make declare-account` step
	cd contracts && sncast deploy --class-hash 0x073638a1b245494f8824f1e016e7b3db64072a8f151c64218bc43bb0eaae8819

invoke-account:
	python scripts/invoke.py contracts/account/tests/data/calldata.txt 

artifacts:
	cp ./circuit/target/circuit.json ./app/src/assets/circuit.json
	cp ./circuit/target/vk ./app/src/assets/vk.bin

run-app:
	cd app && bun run dev
