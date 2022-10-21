const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata

/* ripple-rollback
 * **SUMMARY:** Step to rollback/reject a transaction and prepare a WASM
 * 
 * **PARAMETERS:**
 * @param reason Reason or references code
 */

module.exports = function (workflowId, stepName, step, log, callback) {
  const fetch = require("node-fetch-commonjs");

  // Validate parameters based on metadata
  var missing_params = stepsHelper.validate_params(step.parameters);
  if (missing_params.length > 0) {
    stepsHelper.setError(step, `${workflowId}@${stepName}: missing parameters ${missing_params}.`);
    callback(step);
  } else {
    var src = stepsHelper.prepare_template(stepName, step, false);

    // fetch WASM
    fetch(  process.env.COMPILE_API_ENDPOINT,
            stepsHelper.prepare_hook_compiler_request(workflowId, src) )
      .then((response) => response.text())
      .then((result) => {
        data = JSON.parse(result)
        if ( data.success == true ) {
          stepsHelper.setWasm(step, data.output);
        } else {
          stepsHelper.setError(step, `[${workflowId}] [${stepName}]: ${metadata.name}@${metadata.version}, ${data.message}.`);
        }
        // log.debug(`[${workflowId}] [${stepName}]: wasm=[${data.output}]`)
        callback(stepsHelper.setSource(step, src, true));
      })
      .catch((e) => { 
        stepsHelper.setError(step, `[${workflowId}] [${stepName}]: ${metadata.name}@${metadata.version}, ${e}.`);
        callback(step);
      });
  }
};