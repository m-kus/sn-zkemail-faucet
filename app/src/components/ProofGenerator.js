import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { generateEmailVerifierInputs } from '@zk-email/zkemail-nr'
import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend, reconstructHonkProof } from "@aztec/bb.js";
import { getHonkCallData, init, parseHonkProofFromBytes, parseHonkVerifyingKeyFromBytes } from 'garaga';
import { flattenFieldsAsArray } from '../utils/bb_helpers';
import circuit from '../circuit/proof_of_invite.json'
import './ProofGenerator.css';

const STAGES = {
  INITIAL: 0,
  PARSING_EMAIL: 1,
  GENERATING_WITNESS: 2,
  GENERATING_PROOF: 3,
  BUILDING_TRANSACTION: 4,
  PROOF_COMPLETE: 5
};

const ProofGenerator = () => {
  const [error, setError] = useState(null);
  const [currentStage, setCurrentStage] = useState(STAGES.INITIAL);
  const [vk, setVk] = useState(null);

  useEffect(() => {
    // Fetch the vk.bin file from the public directory
    fetch('/vk.bin')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load verification key');
        }
        return response.arrayBuffer();
      })
      .then(buffer => {
        const vkData = new Uint8Array(buffer);
        console.log('VK loaded successfully, length:', vkData.length);
        setVk(vkData);
      })
      .catch(err => {
        console.error('Error loading verification key:', err);
        setError('Failed to load verification key. Please try again later.');
      });
  }, []);

  const moveToNextStage = (stage) => {
    setCurrentStage(stage);
  };

  const resetProcess = () => {
    setCurrentStage(STAGES.INITIAL);
    setError(null);
  };

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Check if file has .eml extension
    if (!file.name.toLowerCase().endsWith('.eml')) {
      setError('Please upload a file with .eml extension');
      return;
    }
    
    // Check if verification key is loaded
    if (!vk) {
      setError('Verification key is not loaded yet. Please try again in a moment.');
      return;
    }
    
    // Start parsing immediately
    moveToNextStage(STAGES.PARSING_EMAIL);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileContent = reader.result;

        // Parse the email file
        let emailInputs = await generateEmailVerifierInputs(fileContent, {
          extractFrom: true,
          extractTo: true,
          maxHeadersLength: 768,
          maxBodyLength: 65536,
        });
        
        // Move to witness generation stage
        moveToNextStage(STAGES.GENERATING_WITNESS);

        let noir = new Noir(circuit);
        let execResult = await noir.execute(emailInputs);

        // Move to proof generation stage
        moveToNextStage(STAGES.GENERATING_PROOF);

        let honk = new UltraHonkBackend(circuit.bytecode, { threads: 1 });
        let proof = await honk.generateProof(execResult.witness, { keccak: true });
        
        // Move to transaction building stage
        moveToNextStage(STAGES.BUILDING_TRANSACTION);

        // Initialize wasm module
        await init();

        // Reconstruct the proof and get the call data
        const rawProof = reconstructHonkProof(flattenFieldsAsArray(proof.publicInputs), proof.proof);
        const honkProof = parseHonkProofFromBytes(rawProof);
        const honkVk = parseHonkVerifyingKeyFromBytes(vk);
        const callData = getHonkCallData(
          honkProof,
          honkVk,
          0 // HonkFlavor.KECCAK
        );

        console.log(callData);
        
        // Proof is complete and successful
        moveToNextStage(STAGES.PROOF_COMPLETE);
      } catch (err) {
        console.error('Error processing file:', err);
        setError(`Failed to process the email file: ${err.message}. Check console for details.`);
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file');
    };
    reader.readAsText(file);
  }, [vk]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'message/rfc822': ['.eml'],
    },
    maxFiles: 1
  });

  // Determine if we should show the progress indicator
  const showProgress = currentStage > STAGES.INITIAL;

  return (
    <div className="proof-generator">
      {!showProgress && (
        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'active' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content">
            {isDragActive ? (
              <p>Drop the Lu.ma email here...</p>
            ) : (
              <p>Drag and drop your Lu.ma event approval email (.eml file), or click to select</p>
            )}
          </div>
        </div>
      )}
      
      {showProgress && (
        <div className="progress-container">
          <h3>Generating Proof of Registration</h3>
          
          <div className="progress-steps">
            <div className={`progress-step ${currentStage >= STAGES.PARSING_EMAIL ? 'active' : ''} ${currentStage > STAGES.PARSING_EMAIL ? 'completed' : ''}`}>
              <div className="step-indicator">
                {currentStage > STAGES.PARSING_EMAIL ? (
                  <span className="check-icon">✓</span>
                ) : currentStage === STAGES.PARSING_EMAIL ? (
                  <div className="step-spinner"></div>
                ) : (
                  <span className="step-number">1</span>
                )}
              </div>
              <div className="step-content">
                <p className="step-title">Parsing Email</p>
                <p className="step-description">Extracting email contents and verifying signatures</p>
              </div>
            </div>
            
            <div className={`progress-step ${currentStage >= STAGES.GENERATING_WITNESS ? 'active' : ''} ${currentStage > STAGES.GENERATING_WITNESS ? 'completed' : ''}`}>
              <div className="step-indicator">
                {currentStage > STAGES.GENERATING_WITNESS ? (
                  <span className="check-icon">✓</span>
                ) : currentStage === STAGES.GENERATING_WITNESS ? (
                  <div className="step-spinner"></div>
                ) : (
                  <span className="step-number">2</span>
                )}
              </div>
              <div className="step-content">
                <p className="step-title">Generating Witness</p>
                <p className="step-description">Preparing verification data</p>
              </div>
            </div>
            
            <div className={`progress-step ${currentStage >= STAGES.GENERATING_PROOF ? 'active' : ''} ${currentStage > STAGES.GENERATING_PROOF ? 'completed' : ''}`}>
              <div className="step-indicator">
                {currentStage > STAGES.GENERATING_PROOF ? (
                  <span className="check-icon">✓</span>
                ) : currentStage === STAGES.GENERATING_PROOF ? (
                  <div className="step-spinner"></div>
                ) : (
                  <span className="step-number">3</span>
                )}
              </div>
              <div className="step-content">
                <p className="step-title">Generating Proof</p>
                <p className="step-description">Creating zero-knowledge proof</p>
              </div>
            </div>

            <div className={`progress-step ${currentStage >= STAGES.BUILDING_TRANSACTION ? 'active' : ''} ${currentStage > STAGES.BUILDING_TRANSACTION ? 'completed' : ''}`}>
              <div className="step-indicator">
                {currentStage > STAGES.BUILDING_TRANSACTION ? (
                  <span className="check-icon">✓</span>
                ) : currentStage === STAGES.BUILDING_TRANSACTION ? (
                  <div className="step-spinner"></div>
                ) : (
                  <span className="step-number">4</span>
                )}
              </div>
              <div className="step-content">
                <p className="step-title">Building Transaction</p>
                <p className="step-description">Creating Starknet transaction data</p>
              </div>
            </div>
          </div>
          
          {currentStage === STAGES.PROOF_COMPLETE && (
            <div className="success-container">
              <div className="success-message">
                <p>✅ Proof generated successfully!</p>
              </div>
              <button className="cta-button">Create Pre-funded Account</button>
            </div>
          )}
          
          {error && (
            <div className="error">
              <p>{error}</p>
              <button 
                className="reset-button" 
                onClick={resetProcess}
              >
                Start Over
              </button>
            </div>
          )}
          
          {!error && currentStage !== STAGES.PROOF_COMPLETE && currentStage !== STAGES.INITIAL && (
            <div className="start-over-container">
              <button 
                className="start-over-button" 
                onClick={resetProcess}
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProofGenerator; 