const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata

/* ripple-accept
 * **SUMMARY:** Step to accept/commit a transaction and prepare a hook WASM
 * 
 * **PARAMETERS:**
 * @param reason Reason or references code
 */

module.exports = function (workflowId, stepName, step, log, callback) {
  const fetch = require("node-fetch-commonjs");
  var src = stepsHelper.prepare_template(stepName, step, false);

  // fetch WASM
  // log.info(`[${workflowId}] s=[${stepName}]: src=${src}`)
  fetch(  process.env.COMPILE_API_ENDPOINT,
          stepsHelper.prepare_hook_compiler_request(stepName, src) )
    .then((response) => response.text())
    .then((result) => {
      data = JSON.parse(result)
      if ( data.success == true ) {
        // Decode base64 encoded wasm that is coming back from the endpoint
        // const {readWasm} = require('wabt');
        // const wast_output = readWasm(new Uint8Array(decodeBinary(data.output)));
        step['wasm'] = data.output
      } else {
        step.status = 'error';
        step.message = `[${workflowId}] [${stepName}]: ${metadata.name}@${metadata.version}, ${data.message}.`;
      }
      // log.debug(`[${workflowId}] [${stepName}]: data=[${JSON.stringify(step)}].`);
      // log.debug(`[${workflowId}] [${stepName}]: wasm=[${data.output}]`)
      callback(stepsHelper.setSource(step, src, true));
    })
    .catch((error) => { 
      step.status = 'error';
      step.message = `${workflowId}@${stepName}: ${metadata.name}@${metadata.version}, ${error}.`;
      callback(step);
    });
};
