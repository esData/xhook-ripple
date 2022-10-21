const yaml = require('js-yaml');
const fs = require('fs');
const metadata = yaml.load(fs.readFileSync( __dirname + '/step.yaml', 'utf8'));

/* runWorkflow
 * **SUMMARY:** File step to retreive or save file content
 * 
 * **PARAMETERS:**
 * @param step.parameters.file Absolute file path
 * @param step.parameters.contents Contents of the file, contents empty consider loading a file
 * **OUTPUT:**
 * @param step.parameters.contents file content
 */
module.exports = async function (workflowId, stepName, step, log, callback) {
  try {
    step.parameters?.contents == undefined ? 
      fs.readFileSync(step.parameters.file, "utf8") :
      fs.writeFileSync((JSON.stringify(step.parameters?.contents, null, 2)));
    callback(step);
  } catch (e) {
    step.status = 'error';
    step.message = `[${workflowId}] [${stepName}]: ${metadata.name}@${metadata.version}, ${e}.`;
    callback(step);
  }
};
