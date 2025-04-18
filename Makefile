install-noir:
	curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
	noirup --version 1.0.0-beta.2

install-barretenberg:
	curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
	bbup --version 0.82.2

install-scarb:
	curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh -s -- -v 2.9.2

install-snfoundry:
	curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh
	snfoundryup

install-garaga:
	pip install garaga==0.16.0

install: install-noir install-barretenberg install-scarb install-snfoundry install-garaga

build-circuit:
	cd circuit && nargo build
	cp ./circuit/target/proof_of_invite.json ./app/src/circuit/proof_of_invite.json

gen-vk:
	bb write_vk --scheme ultra_honk --oracle_hash keccak -b ./circuit/target/proof_of_invite.json -o ./circuit/target
	cp ./circuit/target/vk ./app/public/vk.bin

gen-contract:
	garaga gen --system ultra_keccak_honk --vk circuit/target/vk --project-name contract

build-contract:
	cd contract && scarb build

test-contract:
	cd contract && snforge test --detailed-resources

declare-contract:
	cd contract && sncast declare --contract-name FaucetAccount

deploy-contract:
	cd contract && sncast deploy --class-hash 0x014ab309afb87a9cbbe4838ec28654eade8092a9eab9de54d76aa7705745c873

invoke-contract:
	python scripts/invoke.py contract/tests/data/calldata.txt 

run-app:
	cd app && npm start
