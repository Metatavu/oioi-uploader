# OiOi Uploader

Tool to upload large files to OiOi content mangement system.

## Installation

Make sure you have installed NodeJS. [See instructions](https://nodejs.org/en/)

Run command `npm install -g oioi-uploader`

## Configuration

Create file .oioi-uploader to your home folder with following contents
```
  key_id = YOUR_KEY_ID
  key_secret = YOUR_KEY_SECRET
  bucket = BUCKET
  url_prefix = URL_PREFI
```

## Usage

```
Synopsis

  $ oioi-uploader --input file ... 
  $ oioi-uploader --help           

Options

  -i, --input string   Path to file to upload.   
  -h, --help           Display this usage guide. 
```
