const shelper = require("../../_helpers/steps_helper");
const stepsHelper = new shelper(__dirname);
const metadata = stepsHelper.metadata;

/* core-exec
 * **SUMMARY:** Exec step shell command online or in the background.
 * 
 * **PARAMETERS:**
 * @param cmd Valid shell command to be executed.
 * @param background Set true to spawn and detach the process.
 *          detached processes will write stdout and stderr to [workflowId].log
 * **OUTPUT:**
 * @param stdout The stdout (if any)
 * @param stderr The stderr (if any)
 * @param pid The child process (if background is true)
 */
module.exports = async function (workflowId, stepName, step, log, callback) {

  const { exec, spawn } = require('child_process');

  if (step.parameters.background === true) {
    out = fs.openSync('./' + workflowId + '.log', 'a');
    err = fs.openSync('./' + workflowId + '.log', 'a');
    var child = spawn(step.parameters.cmd, step.parameters.arguments, {
      detached: true,
      stdio: [ 'ignore', out, err ]
    });
    stepsHelper.setOutputs(step, {  'pid': child.pid } );
    child.unref();
    callback(step);
  } else {
    exec(step.parameters.cmd, function(e, stdout, stderr) {
      stepsHelper.setOutputs(step, {  'stdout': stdout.replace(/\n$/, ''), 
                                      'stderr': stderr.replace(/\n$/, '')} );
      log.debug(`[${workflowId}] s=[${stepName}@${metadata.name}] Result: ${JSON.stringify(stepsHelper.getOutputs(step))}`);
      if (e || stderr != '') {
        step.status = 'error';
        step.message = `${workflowId}@${stepName}: ${metadata.name}@${metadata.version}, ${e}.`;
      }
      callback(step);
    });
  }
};
