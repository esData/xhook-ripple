const yaml = require("js-yaml");
const fs = require("fs");
const metadata = yaml.load(fs.readFileSync( __dirname + '/step.yaml', 'utf8'));
const xrpljs = require("xrpl-hooks");

module.exports = async function (workflowId, stepName, step, log, callback) {

  //log.debug(`${stepName}: data=[${JSON.stringify(step)}].`);
  const account = step.parameters.secret ? xrpljs.Wallet.fromSeed(step.parameters.secret).classicAddress : step.parameters.account;

  const client = new xrpljs.Client(`wss://${step.parameters.environment}`)
  await client.connect()
  try {
    const response = await client.request({
      "command": "account_info",
      "account": account,
      "ledger_index": "validated"
    })
    // log.debug(`${stepName}: ${JSON.stringify(response)}`);
    step['result'] = response.result.account_data;
  } catch(e) { 
    step.status = 'error';
    step.message = `${workflowId}@${stepName}: ${metadata.name}@${metadata.version}, ${e.message}.`
  }
  
  client.disconnect()
  callback(step);
};
