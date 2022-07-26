import { Stack, StackProps } from "aws-cdk-lib";
import { CodePipeline, CodePipelineSource, ManualApprovalStep, PipelineBase, ShellStep } from "aws-cdk-lib/pipelines";
import { Construct } from "constructs";
import { AppStage } from "./app.stage";

export class CdkPipelineStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        const pipeline = new CodePipeline(this, "Pipeline", {
            crossAccountKeys: true,
            pipelineName: "MyPipeline",
            synth: new ShellStep("Synth", {
                input: CodePipelineSource.gitHub("lancomtech/cdk-cross-account-pipeline-example", "main"),
                commands: ["npm ci", "npm run build", "npx cdk synth"]
            })
        });

        // Dev account
        this.addStage(pipeline, "DevStage", "111111111111");

        // Test account
        this.addStage(pipeline, "TestStage", "222222222222");

        // Prod account
        this.addStage(pipeline, "ProdStage", "333333333333");
    }

    addStage(pipeline: PipelineBase, stageId: string, accountId: string, region: string = "ap-southeast-2") {
        const stage = pipeline.addStage(new AppStage(this, stageId, {
            env: {
                account: accountId,
                region: region
            }
        }));
        stage.addPre(new ManualApprovalStep("Approval"));
    }
}
