# gemini-reporter-bamboo

Plugin for Gemini which enables reporting test results to Bamboo.

This will output test results in the mocha JSON format, to a file called gemini-bamboo.json

## Configuration

To use this plugin set the following configuration in .gemini.yml

````
system:
  plugins:
    reporter-bamboo:true
````

