import requests
import sys

BASE_URL = "https://starknet-sepolia.public.blastapi.io/rpc/v0_8"

def invoke(tx):
    payload = {
        "jsonrpc": "2.0",
        "method": "starknet_addInvokeTransaction",
        "params": {
            "invoke_transaction": tx
        },
        "id": 1
    }
    return requests.post(url=BASE_URL, json=payload).json()


def estimate_fee(tx):
    payload = {
        "jsonrpc": "2.0",
        "method": "starknet_estimateFee",
        "params": {
            "request": [tx],
            "simulation_flags": [],
            "block_id": "latest"
        },
        "id": 1
    }
    return requests.post(url=BASE_URL, json=payload).json()

if __name__ == "__main__":
    with open(sys.argv[1], "r") as f:
        proof = f.read().splitlines()

    calldata = [hex(int(felt, 10)) for felt in proof]
    calldata_len = hex(len(calldata))

    address = "0x02ea3a0714d55d378a2da81b29b7e503098cfdc3833e3da96a3f24e4424defae"
    tx = {
        "type": "INVOKE",
        "sender_address": address,
        "calldata": [
            "0x1", # num calls
            "0x0", # to
            "0x0", # selector
            calldata_len,
            *calldata,
        ],
        "version": "0x3",
        "signature": [],
        "nonce": "0x0",
        "resource_bounds": {
            "l1_gas": {
                "max_amount": "0",
                "max_price_per_unit": "0x165627f56f0b",
            },
            "l1_data_gas": {
                "max_amount": "0x989680",
                "max_price_per_unit": "0x11ab717a0",
            },
            "l2_gas": {
                "max_amount": "0x1dcd6500",
                "max_price_per_unit": "0x11ab717a0",
            }
        },
        "tip": "0",
        "paymaster_data": [],
        "account_deployment_data": [],
        "nonce_data_availability_mode": "L1",
        "fee_data_availability_mode": "L1"
    }
    #print(tx)
    
    print(invoke(tx))
