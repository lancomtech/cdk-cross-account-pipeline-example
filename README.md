# AWS CDK Cross Account Pipeline Example
This repository demonstrates how to use the AWS CDK to deploy multi-account infrastructure using CDK Pipelines.
## Bootstrapping
Before deploying into AWS, we first must bootstrap the accounts we are planning to use. In this application, there are four accounts we are deploying into:
- dev (111111111111)
- test (222222222222)
- prod (333333333333)
- build (999999999999)

We can bootstrap our build account by running the following command:
```
npx cdk bootstrap aws://999999999999/ap-southeast-2 --qualifier myapp --toolkit-stack-name CDKToolkit-myapp --profile build
```
This will create the resources necessary for the CDK CLI to execute API calls to CloudFormation from our pipeline. We also pass a custom qualifier and toolkit stack name, which is optional, but allows for multiple bootstrap stacks to be deployed to the same account. This is useful when there are multiple teams using CDK in the same account, but may be on different versions of the CDK package. We also assume that the user running the command has an AWS CLI profile called `build` which has the appropriate permissions to create the bootstrap resources in the build account.

To bootstrap our other accounts, we must add additional parameters to provide access from the pipeline in our build account. The command for the dev environment is shown below. To bootstrap other accounts, replace the `dev` profile in the command with the relevant AWS profile for `test` and `prod`.
```
npx cdk bootstrap aws://111111111111/ap-southeast-2 --qualifier myapp --toolkit-stack-name CDKToolkit-myapp --trust 999999999999 --cloudformation-execution-policies "arn:aws:iam::aws:policy/AdministratorAccess" --profile dev
```
The `--trust` flag tells the CDK CLI to create an IAM role with a trust relationship configured that allows the build account to assume the role and execute API calls to CloudFormation within the dev account. We must also explicitly specify the IAM policy that we want our IAM role to use. By default, the `AdministratorAccess` policy is used, which is necessary to create, update, and delete all types of AWS resources.

Finally, we must create a GitHub personal access token and store it in Secrets Manager in the build account. By default, our CDK pipeline will look for a secret named `github-token` that will be used to authenticate to GitHub. We can use the following AWS CLI command to create the secret:
```
aws secretsmanager create-secret --name github-token --secret-string ghp_73952xxxxxxxxxxxxx9f187b1 --region ap-southeast-2 --profile build
```
## Deployment
The application is self-deploying - it polls GitHub for source changes and then uses the CDK CLI to deploy any changes to the infrastructure. However, it must be manually deployed once, which creates the CodePipeline. Once this is done, all changes must be pushed to GitHub and be deployed by the pipeline.

Run the following command to manually deploy the application:
```
npx cdk deploy --profile build
```
We assume that the user running the command has an AWS CLI profile called `build` which has the appropriate permissions.
## Resources
### App (bin/app.ts)
Constructs our `CdkPipelineStack` in our build account (999999999999) in the Sydney region (ap-southeast-2).
### AppStage (lib/app.stage.ts)
An extension of the CDK `Stage` class which bundles together stacks to be deployed together. Our stage contains a single stack: `LambdaStack`.
### CdkPipelineStack (lib/cdk-pipeline.stack.ts)
Constructs a CodePipeline resource using the CDK Pipelines library. The pipeline uses this repo in GitHub as a code source, and defines steps to install npm packages and synthesise our CDK application.

Then, several stages are added to our pipeline to deploy our `AppStage` to other accounts: dev, test, and prod. Each stage contains a manual pre-approval step which must be approved in the AWS Console before the deployment occurs.

Note that `crossAccountKeys` in the `CodePipeline` props is set to `true`. This is necessary to allow cross-account access to the artifact bucket that supports the pipeline, but incurs minor KMS costs.
### LambdaStack (lib/lambda.stack.ts)
Constructs a simple Node.js Lambda function.