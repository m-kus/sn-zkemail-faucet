install-noir:
	curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
	noirup --version 1.0.0-beta.1

install-barretenberg:
	curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
	bbup --version 0.67.0

install-scarb:
	curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh -s -- -v 2.9.2

install-snfoundry:
	curl -L https://raw.githubusercontent.com/foundry-rs/starknet-foundry/master/scripts/install.sh | sh
	snfoundryup

install-garaga:
	pip install garaga

install: install-noir install-barretenberg install-scarb install-snfoundry install-garaga

build-circuit:
	cd circuit && nargo build
	cp ./circuit/target/proof_of_invite.json ./app/src/circuit/proof_of_invite.json

gen-vk:
	bb write_vk_ultra_keccak_honk -b ./circuit/target/proof_of_invite.json -o ./circuit/target/vk
	cp ./circuit/target/vk ./app/public/vk.bin

gen-contract:
	garaga gen --system ultra_keccak_honk --vk circuit/target/vk --project-name contract

build-contract:
	cd contract && scarb build

run-app:
	cd app && npm start
