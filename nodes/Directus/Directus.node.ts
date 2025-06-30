import {
    IExecuteFunctions,
    INodeType,
    INodeTypeDescription,
    INodeExecutionData,
    NodeConnectionType,
		NodeOperationError,
} from 'n8n-workflow';
import { directusNodeOperations } from './directus.desctiption';
import { URLSearchParams } from 'url';

export class Directus implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Directus API Node',
        name: 'directus',
        icon: 'file:directus.svg',
        group: ['transform'],
        version: 1,
        subtitle: '={{$parameter["operation"]}}',
        description: 'A node for interacting with the Directus API',
        defaults: { name: 'Directus API Node' },
        inputs: [NodeConnectionType.Main],
        outputs: [NodeConnectionType.Main],
				usableAsTool: true,
        credentials: [
            {
                name: 'directusAuthApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                noDataExpression: true,
                options: [
                    {
                        name: 'Create',
                        value: 'create',
                        description: 'Create a new record',
                        action: 'Create a record',
                    },
                    {
                        name: 'Delete',
                        value: 'delete',
                        description: 'Delete a record by its ID',
                        action: 'Delete a record',
                    },
                    {
                        name: 'Find Many',
                        value: 'findMany',
                        description: 'Retrieve multiple records from a collection',
                        action: 'Find many records',
                    },
                    {
                        name: 'Find One',
                        value: 'findOne',
                        description: 'Retrieve a single record by its ID',
                        action: 'Find one record',
                    },
                    {
                        name: 'Update',
                        value: 'update',
                        description: 'Update an existing record',
                        action: 'Update a record',
                    },
                ],
                default: 'findMany',
            },
            ...directusNodeOperations,
        ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnData: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            try {
                const operation = this.getNodeParameter('operation', i) as string;
                const collection = this.getNodeParameter('collection', i) as string;
                const credentials = await this.getCredentials('directusAuthApi');
                const baseUrl = (credentials.url as string).replace(/\/$/, '');
                const endpoint = `${baseUrl}/items/${collection}`;

                let requestMethod: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET';
                let requestUrl = endpoint;
                let body: any = {};

                const params = new URLSearchParams();

                if (operation === 'findMany') {
                    const fields = this.getNodeParameter('fields', i, '') as string;
                    const filter = this.getNodeParameter('filter', i, '{}') as string;
                    const search = this.getNodeParameter('search', i, '') as string;
                    const sort = this.getNodeParameter('sort', i, '') as string;
                    const limit = this.getNodeParameter('limit', i, 50) as number;
                    const page = this.getNodeParameter('page', i, 1) as number;
                    const deep = this.getNodeParameter('deep', i, '{}') as string;

                    if (fields) params.append('fields', fields);
                    if (filter && filter !== '{}') params.append('filter', filter);
                    if (search) params.append('search', search);
                    if (sort) params.append('sort', sort);
                    if (limit) params.append('limit', String(limit));
                    if (page) params.append('page', String(page));
                    if (deep && deep !== '{}') params.append('deep', deep);
                }

                if (operation === 'findOne' || operation === 'update' || operation === 'delete') {
                    const recordId = this.getNodeParameter('recordId', i) as string;
                    requestUrl += `/${recordId}`;
                }

                if (operation === 'create' || operation === 'update') {
                    const data = this.getNodeParameter('data', i, '{}') as string;
                    body = JSON.parse(data);
                }

                switch (operation) {
                    case 'findMany':
                    case 'findOne':
                        requestMethod = 'GET';
                        break;
                    case 'create':
                        requestMethod = 'POST';
                        break;
                    case 'update':
                        requestMethod = 'PATCH';
                        break;
                    case 'delete':
                        requestMethod = 'DELETE';
                        break;
                    default:
                        throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported.`);
                }

                const queryString = params.toString();
                if (queryString) {
                    requestUrl += `?${queryString}`;
                }

                const options = {
                    method: requestMethod,
                    url: requestUrl,
                    body,
                    json: true,
                };

                const response = await this.helpers.httpRequestWithAuthentication.call(
                    this,
                    'directusAuthApi',
                    options,
                );

                returnData.push({ json: response, pairedItem: { item: i } });
            } catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({ json: { error: error.message }, pairedItem: { item: i } });
                    continue;
                }
                throw error;
            }
        }

        return [this.helpers.returnJsonArray(returnData)];
    }
}
