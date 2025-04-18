import { useState, useEffect, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone';
import { generateEmailVerifierInputs } from '@zk-email/zkemail-nr'
import './App.css'
import { ProofState, ProofStateData } from './types'
import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend } from "@aztec/bb.js";
import { flattenFieldsAsArray } from "./helpers/proof";
import { getHonkCallData, init, poseidonHashBN254 } from 'garaga';
import { bytecode, abi as circuitAbi } from "./assets/circuit.json";
import { abi as mainAbi } from "./assets/account.json";
import vkUrl from './assets/vk.bin?url';
import { RpcProvider, Contract, WalletAccount } from 'starknet';
import { connect } from "@starknet-io/get-starknet"
import initNoirC from "@noir-lang/noirc_abi";
import initACVM from "@noir-lang/acvm_js";
import acvm from "@noir-lang/acvm_js/web/acvm_js_bg.wasm?url";
import noirc from "@noir-lang/noirc_abi/web/noirc_abi_wasm_bg.wasm?url";

function App() {
  const [proofState, setProofState] = useState<ProofStateData>({
    state: ProofState.Initial
  });
  const [vk, setVk] = useState<Uint8Array | null>(null);
  // Use a ref to reliably track the current state across asynchronous operations
  const currentStateRef = useRef<ProofState>(ProofState.Initial);

  // Initialize WASM on component mount
  useEffect(() => {
    const initWasm = async () => {
      try {
        // This might have already been initialized in main.tsx,
        // but we're adding it here as a fallback
        if (typeof window !== 'undefined') {
          await Promise.all([initACVM(fetch(acvm)), initNoirC(fetch(noirc))]);
          console.log('WASM initialization in App component complete');
        }
      } catch (error) {
        console.error('Failed to initialize WASM in App component:', error);
      }
    };

    const loadVk = async () => {
      const response = await fetch(vkUrl);
      const arrayBuffer = await response.arrayBuffer();
      const binaryData = new Uint8Array(arrayBuffer);
      setVk(binaryData);
      console.log('Loaded verifying key:', binaryData);
    };
    
    initWasm();
    loadVk();
  }, []);

  const resetState = () => {
    currentStateRef.current = ProofState.Initial;
    setProofState({ 
      state: ProofState.Initial,
      error: undefined 
    });
  };

  const handleError = (error: unknown) => {
    console.error('Error:', error);
    let errorMessage: string;
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error !== null && error !== undefined) {
      // Try to convert any non-Error object to a string
      try {
        errorMessage = String(error);
      } catch {
        errorMessage = 'Unknown error (non-stringifiable object)';
      }
    } else {
      errorMessage = 'Unknown error occurred';
    }
    
    // Use the ref to get the most recent state
    setProofState({
      state: currentStateRef.current,
      error: errorMessage
    });
  };

  const updateState = (newState: ProofState) => {
    currentStateRef.current = newState;
    setProofState({ state: newState, error: undefined });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    try {
      // Initialize Garaga
      await init();

      const file = acceptedFiles[0];
    
      // Check if file has .eml extension
      if (!file.name.toLowerCase().endsWith('.eml')) {
        throw new Error('Please upload a file with .eml extension');
      }

      // Parse the email file
      updateState(ProofState.ParsingEmail);
      const fileContent = await file.text();
      let inputs = await generateEmailVerifierInputs(fileContent, {
        extractFrom: true,
        extractTo: false,
        maxHeadersLength: 768,
        maxBodyLength: 65536,
      });
      console.log(inputs);

      // Start the process
      updateState(ProofState.GeneratingWitness);

      // Generate witness
      let noir = new Noir({ bytecode, abi: circuitAbi as any });
      let execResult = await noir.execute(inputs);
      console.log(execResult);
      
      // Generate proof
      updateState(ProofState.GeneratingProof);

      let honk = new UltraHonkBackend(bytecode, { threads: 2 });
      let proof = await honk.generateProof(execResult.witness, { keccak: true });
      honk.destroy();
      console.log(proof);
      
      // Prepare calldata
      updateState(ProofState.PreparingCalldata);

      const callData = getHonkCallData(
        proof.proof,
        flattenFieldsAsArray(proof.publicInputs),
        vk as Uint8Array,
        0 // HonkFlavor.KECCAK
      );
      console.log(callData);
      
      // Connect wallet
      updateState(ProofState.ConnectingWallet);

      const provider = new RpcProvider({ nodeUrl: 'https://free-rpc.nethermind.io/sepolia-juno/v0_8' })

      const selectedWalletSWO = await connect();
      if (!selectedWalletSWO) {
        throw new Error('No wallet connected');
      }
      const myWalletAccount = await WalletAccount.connect(
        provider,
        selectedWalletSWO
      );
      console.log(myWalletAccount);
      // Send transaction
      updateState(ProofState.SendingTransaction);

      const contractAddress = '0x057b6efdccdebe6288d1bbc90a31ee52dfd1479ec4422f90c3e40c8054062a44';
      const mainContract = new Contract(mainAbi, contractAddress, myWalletAccount);

      // Check verification
      const res = await mainContract.add_solution(callData); // keep the number of elements to pass to the verifier library call
      await provider.waitForTransaction(res.transaction_hash);
      console.log(res);

      updateState(ProofState.ProofVerified);
    } catch (error) {
      handleError(error);
    }
  }, []);

  const renderStateIndicator = (state: ProofState, current: ProofState) => {
    let status = 'pending';
    
    // If this stage is current with an error, show error state
    if (current === state && proofState.error) {
      status = 'error';
    } 
    // If this is the current stage, show active state
    else if (current === state) {
      status = 'active';
    } 
    // If we're past this stage, mark it completed
    else if (getStateIndex(current) > getStateIndex(state)) {
      status = 'completed';
    }
    
    return (
      <div className={`state-indicator ${status}`}>
        <div className="state-dot"></div>
        <div className="state-label">{state}</div>
      </div>
    );
  };

  const getStateIndex = (state: ProofState): number => {
    const states = [
      ProofState.Initial,
      ProofState.ParsingEmail,
      ProofState.GeneratingWitness,
      ProofState.GeneratingProof,
      ProofState.PreparingCalldata,
      ProofState.ConnectingWallet,
      ProofState.SendingTransaction,
      ProofState.ProofVerified
    ];
    
    return states.indexOf(state);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'message/rfc822': ['.eml'],
    },
    maxFiles: 1
  });

  return (
    <div className="container">
      <h1>Prove your event participation and get tokens</h1>
      
      <div className="state-machine">
        <div 
            {...getRootProps()} 
            className={`dropzone ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            <div className="dropzone-content">
              {isDragActive ? (
                <p>Drop the Luma event approval email here...</p>
              ) : (
                <p>Drag and drop your Luma event approval email (.eml file), or click to select</p>
              )}
            </div>
          </div>
        
        {renderStateIndicator(ProofState.ParsingEmail, proofState.state)}
        {renderStateIndicator(ProofState.GeneratingWitness, proofState.state)}
        {renderStateIndicator(ProofState.GeneratingProof, proofState.state)}
        {renderStateIndicator(ProofState.PreparingCalldata, proofState.state)}
        {renderStateIndicator(ProofState.ConnectingWallet, proofState.state)}
        {renderStateIndicator(ProofState.SendingTransaction, proofState.state)}
      </div>
      
      {proofState.error && (
        <div className="error-message">
          Error at stage '{proofState.state}': {proofState.error}
        </div>
      )}
      
      <div className="controls">
        {proofState.error || proofState.state === ProofState.ProofVerified ? (
          <button className="reset-button" onClick={resetState}>Reset</button>
        ) : null}
      </div>
    </div>
  )
}

export default App
