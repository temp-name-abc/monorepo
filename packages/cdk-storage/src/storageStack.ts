import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigw from "aws-cdk-lib/aws-apigateway";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { IProduct } from "types";
import { CollectionDocuments } from "./collectionDocuments";
import { GetDocument } from "./getDocument";
import { CreateCollection } from "./createCollection";
import { UserCollections } from "./userCollections";
import { GetCollection } from "./getCollection";
import { DeleteDocument } from "./deleteDocument";
import { Search } from "./search";
import { Upload } from "./upload";
import { Process } from "./process";

interface IStackProps extends cdk.NestedStackProps {
    api: apigw.RestApi;
    authorizer: apigw.CognitoUserPoolsAuthorizer;
}

export class StorageStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: IStackProps) {
        super(scope, id, props);

        // Store secret
        const pineconeSecret = new secretsmanager.Secret(this, "pineconeSecret");
        const openAISecret = new secretsmanager.Secret(this, "openAISecret");

        // Product for stack
        const product: IProduct = "storage.collection.document.process";

        // Create the REST API
        const storageResource = props.api.root.addResource("storage");

        const iamResource = storageResource.addResource("iam");
        const searchResource = iamResource.addResource("search");

        const collectionResource = storageResource.addResource("collection");
        const collectionIdResource = collectionResource.addResource("{collectionId}");
        const documentResource = collectionIdResource.addResource("document");
        const documentIdResource = documentResource.addResource("{documentId}");

        // Create database
        const collectionTable = new dynamodb.Table(this, "collectionTable", {
            partitionKey: { name: "userId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "collectionId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        const documentTable = new dynamodb.Table(this, "documentTable", {
            partitionKey: { name: "collectionId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "documentId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        const uploadRecordsTable = new dynamodb.Table(this, "uploadRecordsTable", {
            partitionKey: { name: "uploadId", type: dynamodb.AttributeType.STRING },
            timeToLiveAttribute: "ttl",
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        const chunkTable = new dynamodb.Table(this, "chunkTable", {
            partitionKey: { name: "chunkId", type: dynamodb.AttributeType.STRING },
            pointInTimeRecovery: true,
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        });

        const chunkDocumentIndexName = "chunkDocumentIndex";

        chunkTable.addGlobalSecondaryIndex({
            indexName: chunkDocumentIndexName,
            partitionKey: { name: "documentId", type: dynamodb.AttributeType.STRING },
            sortKey: { name: "chunkNum", type: dynamodb.AttributeType.NUMBER },
        });

        // Create buckets
        const tempBucket = new s3.Bucket(this, "tempBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
            lifecycleRules: [
                {
                    expiration: cdk.Duration.days(1),
                },
            ],
        });

        const documentBucket = new s3.Bucket(this, "documentBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
        });

        const processedDocumentBucket = new s3.Bucket(this, "processedDocumentBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
        });

        const chunkBucket = new s3.Bucket(this, "chunkBucket", {
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
        });

        new CreateCollection(this, props.authorizer, collectionResource, collectionTable);
        new UserCollections(this, props.authorizer, collectionResource, collectionTable);
        new GetCollection(this, props.authorizer, collectionIdResource, collectionTable);
        new CollectionDocuments(this, props.authorizer, documentResource, collectionTable, documentTable, documentBucket, processedDocumentBucket);

        new GetDocument(this, props.authorizer, documentIdResource, collectionTable, documentTable, documentBucket, processedDocumentBucket);
        new DeleteDocument(
            this,
            pineconeSecret,
            props.authorizer,
            chunkDocumentIndexName,
            documentIdResource,
            chunkTable,
            documentTable,
            documentBucket,
            processedDocumentBucket,
            chunkBucket
        );

        new Upload(this, props.authorizer, documentResource, collectionTable, uploadRecordsTable, tempBucket, product);
        new Process(
            this,
            pineconeSecret,
            openAISecret,
            documentTable,
            documentBucket,
            processedDocumentBucket,
            chunkTable,
            chunkBucket,
            uploadRecordsTable,
            tempBucket,
            product
        );

        new Search(this, pineconeSecret, openAISecret, searchResource, collectionTable, chunkTable, chunkBucket, chunkDocumentIndexName);
    }
}
