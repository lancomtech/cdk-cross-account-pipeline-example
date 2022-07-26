import { Stack, StackProps } from "aws-cdk-lib";
import { Function, InlineCode, Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export class LambdaStack extends Stack {
    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);
    
        new Function(this, "LambdaFunction", {
            runtime: Runtime.NODEJS_16_X,
            handler: "index.handler",
            code: new InlineCode("exports.handler = _ => \"Hello, CDK\";")
        });
    }
}