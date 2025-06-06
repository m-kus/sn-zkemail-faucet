export enum ProofState {
  Initial = 'Initial',
  ParsingEmail = 'Parsing email',
  GeneratingWitness = 'Generating witness',
  GeneratingProof = 'Generating proof',
  PreparingCalldata = 'Preparing calldata',
  ConnectingWallet = 'Connecting wallet',
  SendingTransaction = 'Sending transaction',
  ProofVerified = 'Proof is verified'
}

export interface ProofStateData {
  state: ProofState;
  error?: string;
}
