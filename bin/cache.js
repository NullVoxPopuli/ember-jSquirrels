const fs = require('fs');

function progressFile() {
  try {
    let rawdata = fs.readFileSync('progress.json');
    let json = JSON.parse(rawdata);

    return json;
  } catch (e) {
    return {};
  }

}

function writeProgressFile(json) {
  fs.writeFileSync('progress.json', JSON.stringify(json, null, 2));
}



module.exports = {
  progressFile,
  writeProgressFile
}
