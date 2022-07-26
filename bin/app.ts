import { App } from "aws-cdk-lib";
import { CdkPipelineStack } from "../lib/cdk-pipeline.stack";

const app = new App();
new CdkPipelineStack(app, "CdkPipelineStack", {
    env: {
        account: "999999999999", // Build account
        region: "ap-southeast-2"
    }
});

app.synth();