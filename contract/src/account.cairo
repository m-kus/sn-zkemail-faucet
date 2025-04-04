use starknet::account::Call;

#[starknet::interface]
trait IAccount<TContractState> {
    fn __validate__(ref self: TContractState, calls: Array<Call>) -> felt252;
    fn __execute__(ref self: TContractState, calls: Array<Call>) -> Array<Span<felt252>>;
    fn __validate_declare__(self: @TContractState, class_hash: felt252) -> felt252;
    fn __validate_deploy__(
        self: @TContractState, class_hash: felt252, contract_address_salt: felt252
    );
}

#[starknet::contract(account)]
mod FaucetAccount {
    use starknet::{account::Call, get_execution_info, contract_address::ContractAddress, TxInfo};
    use core::num::traits::Zero;
    use crate::honk_verifier::UltraKeccakHonkVerifier;

    const TX_V1: felt252 = 1; // INVOKE
    const TX_V1_ESTIMATE: felt252 = 0x100000000000000000000000000000000 + 1; // 2**128 + TX_V1
    const TX_V3: felt252 = 3;
    const TX_V3_ESTIMATE: felt252 = 0x100000000000000000000000000000000 + 3; // 2**128 + TX_V3

    component!(path: UltraKeccakHonkVerifier, storage: verifier, event: VerifierEvent);

    #[storage]
    struct Storage {
        #[substorage(v0)]
        verifier: UltraKeccakHonkVerifier::Storage,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        VerifierEvent: UltraKeccakHonkVerifier::Event,
    }

    #[abi(embed_v0)]
    impl FaucetAccountImpl of super::IAccount<ContractState> {
        fn __validate__(ref self: ContractState, calls: Array<Call>) -> felt252 {
            let exec_info = get_execution_info().unbox();
            let tx_info = exec_info.tx_info.unbox();
            assert_only_protocol(exec_info.caller_address);
            assert_invoke_version(tx_info.version);

            // TODO: verify the proof

            starknet::VALIDATED
        }

        fn __execute__(ref self: ContractState, calls: Array<Call>) -> Array<Span<felt252>> {
            let exec_info = get_execution_info().unbox();
            let tx_info = exec_info.tx_info.unbox();
            assert_only_protocol(exec_info.caller_address);
            assert_invoke_version(tx_info.version);
            let retdata = ArrayTrait::new();
            retdata
        }

        fn __validate_declare__(self: @ContractState, class_hash: felt252) -> felt252 {
            0
        }

        fn __validate_deploy__(
            self: @ContractState, class_hash: felt252, contract_address_salt: felt252
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
            'unexpected tx version'
        );
    }
}

#[cfg(test)]
mod tests {
    use super::IAccountDispatcherTrait;
    use core::result::ResultTrait;
    use snforge_std::{declare, ContractClassTrait, ContractClass};
    use super::{FaucetAccount, IAccountDispatcher};

    #[test]
    fn test_group_account() {
        let contract: ContractClass = declare("FaucetAccount").unwrap();
        let (contract_address, _) = contract.deploy(@array![]).unwrap();

        let dispatcher = IAccountDispatcher { contract_address };
        assert_eq!(dispatcher.__validate__(array![]), starknet::VALIDATED);
    }
}
