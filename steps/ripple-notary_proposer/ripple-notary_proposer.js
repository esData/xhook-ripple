const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata

/* ripple-notary_propose
 * **SUMMARY:** prepare account as proposer
 * 
 * **PARAMETERS:**
 * @param secret Proposer account secret
 * @param notary_account Notary account
 */

module.exports = async function (workflowId, stepName, step, log, callback) {
  const xrpljs = require("xrpl-hooks");
  
  const proposer_account = step.parameters.secret ? xrpljs.Wallet.fromSeed(step.parameters.secret).classicAddress : step.parameters.account;

  // Enable account debug traces
  if ( step.parameters.traces_env ) {
    const accounts = step.parameters.accounts ? step.parameters.accounts : [];
    if ( proposer_account && !accounts.includes(proposer_account) ) {
      accounts.push(proposer_account);
    }
    stepsHelper.traces_on(workflowId, accounts, step.parameters.traces_env);
  }

  const client = new xrpljs.Client(`wss://${step.parameters.environment}`);
  await client.connect();

  var proposed_tx = {
    Account: step.parameters.notary_account,
    TransactionType: 'Payment',
    Amount: ''+step.parameters.proposed_amount,
    Destination: proposer_account,
    Sequence: 0,
    LastLedgerSequence: "4000000000",
    //Sequence: step.parameters.account_seq,
    Fee: '0'
  };

  if ( step.parameters.destination_tag ) {
    txn['DestinationTag'] = step.parameters.destination_tag;
  }

  if ( step.parameters.invoice_id ) {
    txn['InvoiceID'] = step.parameters.invoice_id;
  }

  if ( step.parameters.send_max ) {
    txn['SendMax'] = step.parameters.send_max;
  }

  if ( step.parameters.deliver_min ) {
    txn['DeliverMin'] = step.parameters.deliver_min;
  }

  if ( step.parameters.paths ) {
    txn['Paths'] = step.parameters.paths;
  }

  const inner_tx = xrpljs.encode(proposed_tx);

  const txn = {
    TransactionType: 'Payment',
    Account: proposer_account,
    Amount: '1',
    Destination: step.parameters.notary_account,
    Fee: '0',
    Memos: [ {
      Memo: {
        MemoData: inner_tx,
        MemoFormat: "unsigned/payload+1",
        MemoType: "notary/proposed"
      }}],
    SigningPubKey: '',
    Sequence: step.parameters.account_seq
  };

  stepsHelper.hexlify_memos(txn);

  try {    
    var response = await client.request(stepsHelper.prepare_fee_txn(xrpljs.encode(txn)));
  
    delete txn["SigningPubKey"];
    txn.Fee = response.result?.drops?.base_fee || "10";

    var response = await client.submit(txn, { wallet: xrpljs.Wallet.fromSeed(step.parameters.secret) }); 

    if ( response.result.applied !== true || response.result.engine_result != 'tesSUCCESS' ) {
      step.status = 'error';
      step.message = `[${workflowId}] [${stepName}]: ${metadata.name}@${metadata.version}, ${response.result.engine_result_message}.`;
    }
    stepsHelper.setOutputs(step, { 'result' : response.result} );
  } catch(e) { 
    step.status = 'error';
    step.message = `[${workflowId}] [${stepName}]: ${metadata.name}@${metadata.version}, ${e}.`
  }

  client.disconnect();
  callback(step);
};
