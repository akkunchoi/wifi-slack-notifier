const fs = require('fs')

const plist = fs.readFileSync('arrived.template.plist') + ""
const modified = plist
  .replace('${pwd}', __dirname + '/slack.js')
  .replace('${node}', process.env._)

fs.writeFileSync('arrived.plist', modified)

