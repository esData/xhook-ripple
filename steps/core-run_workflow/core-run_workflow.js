const yaml = require('js-yaml');
const fs = require('fs');
const metadata = yaml.load(fs.readFileSync( __dirname + '/step.yaml', 'utf8'));

/* runWorkflow
 * **SUMMARY:** This handle will attempt to load supplied file or execute the supplied workflow
 * 
 * **PARAMETERS:**
 * @param step.parameters.file The workflow definition file name (if no workflow supplied)
 * @param step.parameters.workflow A workflow object to execute
 * **OUTPUT:**
 * @param step.parameters.workflow The resulting workflow object
 */
module.exports = async function (workflowId, stepName, step, log, callback) {

  const {runWorkflow} = require(`${__dirname}/../../../workflow/workflow`);
  const workflow =  step.parameters?.workflow != undefined? 
                    step.parameters.workflow :
                    yaml.load(fs.readFileSync(step.parameters.file, "utf8"));

  await runWorkflow(workflow, function(workflowResult) {
    // log.debug(`⌘ Workflow: ${JSON.stringify(workflowResult)}`);
    if (workflowResult.status === "completed" ) {
      log.info(`⌘ Workflow: ${workflowResult.name} [${workflowResult.id}] run completed.`);
      step['result'] = `Workflow: ${workflowResult.name} [${workflowResult.id}] run completed.`;
    } else if ( workflowResult.status == "error" ) {
      log.error(`⌘ Workflow: ${workflowResult.name} [${workflowResult.id}] run incomplete.`);
      log.error("✘ " + workflow.message);
      step.status = 'error';
      step.message = `[${workflowId}] [${stepName}]: ${metadata.name}@${metadata.version}, ${workflowResult.message}.`
    }
  });
  callback(step);
};
