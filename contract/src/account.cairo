use starknet::account::Call;

#[starknet::interface]
trait IAccount<TContractState> {
    fn __validate__(ref self: TContractState, calls: Array<Call>) -> felt252;
    fn __execute__(ref self: TContractState, calls: Array<Call>) -> Array<Span<felt252>>;
    fn __validate_declare__(self: @TContractState, class_hash: felt252) -> felt252;
    fn __validate_deploy__(
        self: @TContractState, class_hash: felt252, contract_address_salt: felt252,
    );
}

#[starknet::contract(account)]
mod FaucetAccount {
    use core::num::traits::Zero;
    use starknet::account::Call;
    use starknet::contract_address::ContractAddress;
    use starknet::{TxInfo, get_execution_info};
    use crate::honk_verifier::UltraStarknetHonkVerifier;

    const TX_V1: felt252 = 1; // INVOKE
    const TX_V1_ESTIMATE: felt252 = 0x100000000000000000000000000000000 + 1; // 2**128 + TX_V1
    const TX_V3: felt252 = 3;
    const TX_V3_ESTIMATE: felt252 = 0x100000000000000000000000000000000 + 3; // 2**128 + TX_V3

    component!(path: UltraStarknetHonkVerifier, storage: verifier, event: VerifierEvent);

    impl VerifierImpl = UltraStarknetHonkVerifier::IUltraStarknetHonkVerifierImpl<ContractState>;

    #[storage]
    struct Storage {
        #[substorage(v0)]
        verifier: UltraStarknetHonkVerifier::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        VerifierEvent: UltraStarknetHonkVerifier::Event,
    }

    #[abi(embed_v0)]
    impl FaucetAccountImpl of super::IAccount<ContractState> {
        fn __validate__(ref self: ContractState, calls: Array<Call>) -> felt252 {
            let exec_info = get_execution_info().unbox();
            let tx_info = exec_info.tx_info.unbox();
            //assert_only_protocol(exec_info.caller_address);
            assert_invoke_version(tx_info.version);

            assert(calls.len() == 1, 'expected single call');
            let pub_inputs = self
                .verifier
                .verify_ultra_starknet_honk_proof(*calls[0].calldata)
                .expect('invalid proof');
            // TODO: assert single call, verify the proof, check the nullifier

            starknet::VALIDATED
        }

        fn __execute__(ref self: ContractState, calls: Array<Call>) -> Array<Span<felt252>> {
            let exec_info = get_execution_info().unbox();
            let tx_info = exec_info.tx_info.unbox();
            assert_only_protocol(exec_info.caller_address);
            assert_invoke_version(tx_info.version);

            // TODO: send the funds, store the nullifier

            let retdata = ArrayTrait::new();
            retdata
        }

        fn __validate_declare__(self: @ContractState, class_hash: felt252) -> felt252 {
            0
        }

        fn __validate_deploy__(
            self: @ContractState, class_hash: felt252, contract_address_salt: felt252,
        ) {}
    }

    fn assert_only_protocol(caller_address: ContractAddress) {
        assert(caller_address.is_zero(), 'unexpected non-zero address');
    }

    fn assert_invoke_version(tx_version: felt252) {
        assert(
            tx_version == TX_V1
                || tx_version == TX_V3
                || tx_version == TX_V1_ESTIMATE
                || tx_version == TX_V3_ESTIMATE,
            'unexpected tx version',
        );
    }
}

#[cfg(test)]
mod tests {
    use core::result::ResultTrait;
    use snforge_std::fs::{FileTrait, read_txt};
    use snforge_std::{ContractClass, ContractClassTrait, DeclareResult, declare};
    use starknet::account::Call;
    use super::{IAccountDispatcher, IAccountDispatcherTrait};

    #[test]
    fn test_validate() {
        let contract: ContractClass = match declare("FaucetAccount").unwrap() {
            DeclareResult::Success(contract) => contract,
            DeclareResult::AlreadyDeclared(contract) => contract,
        };
        let (contract_address, _) = contract.deploy(@array![]).unwrap();

        let dispatcher = IAccountDispatcher { contract_address };

        let file = FileTrait::new("tests/data/calldata.txt");
        let calldata = read_txt(@file);

        let call = Call { to: (1).try_into().unwrap(), selector: 0, calldata: calldata.span() };
        assert_eq!(dispatcher.__validate__(array![call]), starknet::VALIDATED);
    }
}
