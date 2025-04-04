import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { generateEmailVerifierInputs } from '@zk-email/zkemail-nr'
import './ProofGenerator.css';

const STAGES = {
  INITIAL: 0,
  FILE_PROVIDED: 1,
  FILE_PARSED: 2,
  WITNESS_GENERATED: 3,
  PROOF_GENERATED: 4
};

const ProofGenerator = () => {
  const [error, setError] = useState(null);
  const [currentStage, setCurrentStage] = useState(STAGES.INITIAL);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Check if file has .eml extension
    if (!file.name.toLowerCase().endsWith('.eml')) {
      setError('Please upload a file with .eml extension');
      return;
    }
    
    // Update to file provided stage
    setCurrentStage(STAGES.FILE_PROVIDED);
    setError(null);
    
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const fileContent = reader.result;

        console.log(fileContent);

        // Parse the email file (we're still at FILE_PROVIDED stage during parsing)
        let emailInputs = await generateEmailVerifierInputs(fileContent, {
          maxBodyLength: 65536,
        });
        
        console.log(emailInputs);
        
        // Now update to file parsed stage after successful parsing
        setCurrentStage(STAGES.FILE_PARSED);
        
        // Simulate witness generation
        setTimeout(() => {
          setCurrentStage(STAGES.WITNESS_GENERATED);
          
          // Simulate proof generation after another delay
          setTimeout(() => {
            setCurrentStage(STAGES.PROOF_GENERATED);
          }, 2000);
        }, 2000);
      } catch (err) {
        console.error('Error processing file:', err);
        setError(`Failed to parse the email file: ${err.message}. Check console for details.`);
        // Don't reset the stage automatically
      }
    };
    reader.onerror = () => {
      setError('Failed to read the file');
      // Don't reset the stage automatically
    };
    reader.readAsText(file);
  }, []);

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
            <div className={`progress-step ${currentStage >= STAGES.FILE_PROVIDED ? 'active' : ''} ${currentStage > STAGES.FILE_PROVIDED ? 'completed' : ''}`}>
              <div className="step-indicator">
                {currentStage > STAGES.FILE_PROVIDED ? (
                  <span className="check-icon">✓</span>
                ) : currentStage === STAGES.FILE_PROVIDED ? (
                  <div className="step-spinner"></div>
                ) : (
                  <span className="step-number">1</span>
                )}
              </div>
              <div className="step-content">
                <p className="step-title">Email File Provided</p>
                <p className="step-description">Your .eml file has been uploaded</p>
              </div>
            </div>
            
            <div className={`progress-step ${currentStage >= STAGES.FILE_PARSED ? 'active' : ''} ${currentStage > STAGES.FILE_PARSED ? 'completed' : ''}`}>
              <div className="step-indicator">
                {currentStage > STAGES.FILE_PARSED ? (
                  <span className="check-icon">✓</span>
                ) : currentStage === STAGES.FILE_PARSED ? (
                  <div className="step-spinner"></div>
                ) : (
                  <span className="step-number">2</span>
                )}
              </div>
              <div className="step-content">
                <p className="step-title">Email Parsed</p>
                <p className="step-description">Email contents extracted and verified</p>
              </div>
            </div>
            
            <div className={`progress-step ${currentStage >= STAGES.WITNESS_GENERATED ? 'active' : ''} ${currentStage > STAGES.WITNESS_GENERATED ? 'completed' : ''}`}>
              <div className="step-indicator">
                {currentStage > STAGES.WITNESS_GENERATED ? (
                  <span className="check-icon">✓</span>
                ) : currentStage === STAGES.WITNESS_GENERATED ? (
                  <div className="step-spinner"></div>
                ) : (
                  <span className="step-number">3</span>
                )}
              </div>
              <div className="step-content">
                <p className="step-title">Witness Generated</p>
                <p className="step-description">Preparing verification data</p>
              </div>
            </div>
            
            <div className={`progress-step ${currentStage >= STAGES.PROOF_GENERATED ? 'active' : ''} ${currentStage > STAGES.PROOF_GENERATED ? 'completed' : ''}`}>
              <div className="step-indicator">
                {currentStage > STAGES.PROOF_GENERATED ? (
                  <span className="check-icon">✓</span>
                ) : currentStage === STAGES.PROOF_GENERATED ? (
                  <div className="step-spinner"></div>
                ) : (
                  <span className="step-number">4</span>
                )}
              </div>
              <div className="step-content">
                <p className="step-title">Proof Generated</p>
                <p className="step-description">Zero-knowledge proof created</p>
              </div>
            </div>
          </div>
          
          {currentStage === STAGES.PROOF_GENERATED && (
            <div className="success-container">
              <button className="cta-button">Create Pre-funded Account</button>
            </div>
          )}
          
          {error && (
            <div className="error">
              <p>{error}</p>
              <button 
                className="reset-button" 
                onClick={() => {
                  setCurrentStage(STAGES.INITIAL);
                  setError(null);
                }}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProofGenerator; 