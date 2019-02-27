# s3-upload-progress-configuration

## About

This repository contains two things:
- A customizable serverless configuration (located in serverless.yml and serverlessConfig/)
- A basic implementation of S3 signature generation, upload processing, and polling system to track the upload (located in handlers/ and models/)

The goal of this repository is to provide a starting template to easily create backend infrastructure that accomplishes the goal of allowing users to upload to S3 directly from their browser (via a presigned URL that is returned via a lambda function), and then track the progress of what happens to their upload via a polling function.

The serverless configuration is easily customizable by changing the custom variables within the serverless.yml file. The function implementations inside the handlers directory are put in as placeholders, and they don't actually do anything other than generate presigned URLs, and update a state in a dynamoDB table.

## Pre-requisites

Before using this repository, you must have:
- [serverless installed](https://serverless.com/framework/docs/providers/aws/guide/quick-start/)
- An AWS account with proper credentials to be able to deploy cloudformation templates, and resources.
- You must either have your credentials stored in the default .aws/credentials file, or otherwise passed in to your serverless deploy command so that the serverless framework can create resources on behalf of your account. See [this article for examples of how to set up your credentials to work with serverless](https://serverless.com/framework/docs/providers/aws/guide/credentials/)

Note: the serverless framework is not listed as a dependency because it is meant to be used globally on various projects, and installing it locally for each project would be very inefficient.

## Dependencies

- [uuid](https://github.com/kelektiv/node-uuid) for generating unique codes to allow users to track progress of their specific upload
- Technically [aws-sdk](https://www.npmjs.com/package/aws-sdk) is a dependency because it is used within the handler functions. However, it is not part of the package.json dependencies because when deploying to AWS Lambda, the aws-sdk is already installed within that environment. If you would like to test the handler functions locally, then you would need to run `npm install --save aws-sdk`

## Set up

This repository is already set up, and ready to deploy with default variable names, and handler functions.

```sh
git clone https://github.com/nikita-skobov/s3-upload-progress-configuration.git
cd s3-upload-progress-configuration
npm install
sls deploy # this assumes your credentials are stored in a way that serverless knows where to find them
```

## Testing

After a few minutes, your functions, and resources will be deployed to your AWS account. I have provided a test webpage that you can open locally, and test the functionality of your infrastructure.

- after serverless finished uploading your template to AWS, you will get some output like:
```yml
Serverless: Stack update finished...
Service Information
service: s3uploader
stage: staging
region: us-east-1
stack: s3uploader-staging
api keys:
  None
endpoints:
  GET - https://aigi6g1nqg.execute-api.us-east-1.amazonaws.com/staging/issue/signature
  GET - https://aigi6g1nqg.execute-api.us-east-1.amazonaws.com/staging/poll
functions:
  s3SignatureGenerator: s3uploader-staging-s3SignatureGenerator
  s3Uploaded: s3uploader-staging-s3Uploaded
  polling: s3uploader-staging-polling
layers:
  None
```
Copy the API url without the function paths, and without the trailing slash. So in this example copy:
```
https://aigi6g1nqg.execute-api.us-east-1.amazonaws.com/staging
```
- open testUpload.html in your browser of choice
- paste the API url into the input field, and hit submit
- You will start to see output being appended to the output section
- If everything works correctly, you should see output similar to:

```
1. Starting signature request
2. Received signature response
3. Successfuly received signature:
4. signed url: https://s3uploader-upload-bucket.s3.amazonaws.com/29507cbb-b2d2-4a23-be98-9b8070751ae9?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIATUMMKE3IMJFF2LUR%2F20190221%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20190221T021606Z&X-Amz-Expires=120000&X-Amz-Security-Token=FQcGZXIvYXdzEDQaDFAE1UuHij8vcigMfSKAAngPUaCApmnEBB3f%2B2D5OcClspqOsQgGEidnk%2FRHMzFO9FYe3ZZ8gV18AynjjTTgRyB5aa%2BuykxVwdhdENkRdjxXYl19qyHhMI7qUQLL7qV1ai7VlQQ1la7oYAX5PpFa%2FJX2XbOZdMxEI1WbibvWOxhWzFLL%2BX4GNJQ2dM9smNlV2ydUaKfFOM0qXZpmOePmDOVm8trdqykKYYEn0%2BxuGoLMVXnUQJSnHkLd3cAITJssnmuV1wHu88KQj6HopcDpPXmUvXpjw9DoSJqc4ZFIoNx1guwmH8Xz2dNSCIM0pypehuaHKLtJocz3x74NQysNZVmIZp9Xiyd9hNdo5EQJDKsos5O33wU%3D&X-Amz-Signature=292b618d287c1474dec4e15ce95e8effe39ab41f7768b2da328495329e584333&X-Amz-SignedHeaders=host
5. upload code: 29507cbb-b2d2-4a23-be98-9b8070751ae9
6. Starting upload to S3
7. Successfully uploaded to S3
8. POLLING STATUS: Successfully created upload signature
9. POLLING STATUS: Successfully created upload signature
10. POLLING STATUS: Successfully created upload signature
11. POLLING STATUS: Successfully created upload signature
12. POLLING STATUS: Successfully processed data
13. POLLING STATUS: Successfully entered data into database
14. DONE!
```

## Things to keep in mind

### 1.
Note that if you change your handler function names, they must also be changed within your serverless configuration. For example:
In serverless.yml it states:
```yml
custom:
  uploadedHandler: ${opt:uploadHandler,           "handlers/upload.handler"}
  #                ^ customizable handler path    ^ default handler path
```

So if you specify the uploadHandler option as:
```sh
sls deploy --uploadHandler myUploadFile.myFunction
```
Then you must have a file called `myUploadFile.js` in the root of this directory, and it must have a module-exported function called `myFunction`

### 2.
This repository uses the serverless framework which is slightly abstracted out from AWS CloudFormation. As such, it uses its own conventions for some resources such as function names.
An example is if you have a basic serverless configuration like:
```yml
service: myservice
provider:
  name: aws
  runtime: nodejs8.10
  stage: staging
  region: ${opt:region, "us-east-1"}
functions:
  someFunction:
    handler: myfile.someHandler
    events:
      - http:
          path: /somepath/somefunction
          method: GET
```

Then serverless will give your function a logical ID of `SomeFunctionLambdaFunction`. This can then be used within cloudformation to reference that resource, whereas referencing `someFunction` will not work. An example of this, and some more explanation can be found at the top of the serverlessConfig/resources.yml file

## Issues/Suggestions?

Feel free to leave an issue on [the issue tracker](https://github.com/nikita-skobov/s3-frontend-upload-and-process/issues) or otherwise email me at

equilateralllc@gmail.com
