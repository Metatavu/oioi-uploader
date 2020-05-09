#!/usr/bin/env node

const { v4: uuidv4 } = require('uuid');
const cfg = require('home-config').load('.oioi-uploader');
const AWS = require('aws-sdk');
const FileType = require('file-type');
const fs = require('fs');
const _colors = require('colors');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const cliProgress = require('cli-progress');
var path = require('path');
const header = `
                                                                                
                @@@@@@@@@@                     @@@@@@@@@@                       
             @@@@@@@@@@@@@@@@     @@@@@     @@@@@@@@@@@@@@@@     @@@@           
           @@@@@@@@@@@@@@@@@@@@  @@@@@@@  @@@@@@@@@@@@@@@@@@@@  @@@@@@@         
          @@@@@@@@      @@@@@@@@ @@@@@@@ @@@@@@@@      @@@@@@@@ @@@@@@          
          @@@@@@@        @@@@@@@         @@@@@@@       *@@@@@@@                 
          @@@@@@@@      @@@@@@@@ @@@@@@@ @@@@@@@@     (@@@@@@@@ @@@@@@          
           @@@@@@@@@@@@@@@@@@@@  @@@@@@@  @@@@@@@@@@@@@@@@@@@@  @@@@@@@         
             @@@@@@@@@@@@@@@@     /@@@(     @@@@@@@@@@@@@@@@     @@@@           
                @@@@@@@@@@                     @@@@@@@@@*                       
                                                                                
                    Content management file uploader                           
`;

const optionDefinitions = [{ 
    name: 'input',
    description: 'Path to file to upload.',
    type: String,
    alias: "i",
    defaultOption: true 
  }, {
    name: 'help',
    description: 'Display this usage guide.',
    alias: 'h',
    type: Boolean
  },
];

const sections = [
  {
    content: header,
    raw: true
  },
  {
    header: 'Synopsis',
    content: [
      '$ oioi-uploader {bold --input} {underline file} ...',
      '$ oioi-uploader {bold --help}'
    ]
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  }
]

const options = commandLineArgs(optionDefinitions);
if (options.help || !options.input) {
  console.log(getUsage(sections));
  return;
}

const inputFilePath = options.input;
if (!fs.existsSync(inputFilePath)) {
  console.error("\x1b[31m", "ERROR: Input file does not exist");
  process.exit(1);
}

if (!cfg.key_id || !cfg.key_secret || !cfg.bucket || !cfg.url_prefix) {
  console.error("\x1b[31m", "ERROR: Missing configuration file");
  console.log("Create file ~/.oioi-uploader with following contents");
  const exampleCfg = `
  key_id = YOUR_KEY_ID
  key_secret = YOUR_KEY_SECRET
  bucket = BUCKET
  url_prefix = URL_PREFIX
  `;
  console.log(exampleCfg);
  process.exit(1); 
}

const getExtensionFallback = (filename) => {
  if (filename.indexOf(".") > -1) {
    return path.extname(filename);
  }

  return "";
}

const size = fs.statSync(inputFilePath).size;
const fileContent = fs.createReadStream(inputFilePath);
const originalName = path.basename(inputFilePath);

const bar = new cliProgress.SingleBar({
  format: `Uploading ${originalName} | ${_colors.cyan('{bar}')} | {percentage}% || {value}/{total} || ETA: {eta}s`,
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true
});

const s3 = new AWS.S3({
  accessKeyId: cfg.key_id,
  secretAccessKey: cfg.key_secret
});

(async () => {
  try {
    bar.start(size, 0);
    const fileType = await FileType.fromFile(inputFilePath)
    const ext = fileType ? `.${fileType.ext}` : getExtensionFallback(originalName);
    const key = `uploader/${uuidv4()}${ext}`;
    const params = {
      Bucket: cfg.bucket,
      Key: key,
      Body: fileContent,
      ContentType: fileType ? fileType.mime : "",
      ACL:'public-read',
      Metadata: {
        "x-file-name": originalName
      }
    };

    s3.upload(params, function(err, data) {
      if (err) {
          throw err;
      }
      bar.stop();
      console.log('File uploaded successfully.');
      console.log(`URL: ${cfg.url_prefix}/${key}`);
      process.exit(0);
    }).on('httpUploadProgress', (progress) => {
      bar.update(progress.loaded);
    });
  } catch (e) {
      console.log("\x1b[31m", "ERROR: uploading file", e);
  }
})();