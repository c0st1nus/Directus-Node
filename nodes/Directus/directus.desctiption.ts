import { INodeProperties } from 'n8n-workflow';

export const directusNodeOperations: INodeProperties[] = [
	// Existing 'Collection' property
	{
		displayName: 'Collection',
		name: 'collection',
		type: 'string',
		required: true,
		noDataExpression: true,
		displayOptions: {
			show: {

			},
		},
		default: '',
		description: 'The collection to perform the operation on',
	},

	// New properties for advanced querying
	{
		displayName: 'Fields',
		name: 'fields',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['findMany'],
			},
		},
		default: '',
		placeholder: 'ID,status,title,*,user_created.*',
		description: 'A comma-separated list of fields to return. Supports wildcard (*).',
	},
	{
		displayName: 'Filter',
		name: 'filter',
		type: 'json',
		typeOptions: {
			alwaysShowTools: true,
		},
		displayOptions: {
			show: {
				operation: ['findMany'],
			},
		},
		default: '{}',
		placeholder:
			'{\n  "status": {\n    "_eq": "published"\n  },\n  "date_created": {\n    "_gte": "$NOW(-1 year)"\n  }\n}',
		description: 'Directus filter rules object. See Directus docs for more details.',
	},
	{
		displayName: 'Search',
		name: 'search',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['findMany'],
			},
		},
		default: '',
		placeholder: 'search term',
		description: 'A search query to apply to the collection',
	},
	{
		displayName: 'Sort',
		name: 'sort',
		type: 'string',
		displayOptions: {
			show: {
				operation: ['findMany'],
			},
		},
		default: '',
		placeholder: '-date_created,title',
		description: 'A comma-separated list of fields to sort by. Prefix with "-" for descending.',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		displayOptions: {
			show: {
				operation: ['findMany'],
			},
		},
		default: 50,
		description: 'Max number of results to return',
	},
	{
		displayName: 'Page',
		name: 'page',
		type: 'number',
		displayOptions: {
			show: {
				operation: ['findMany'],
			},
		},
		default: 1,
		description: 'The page number to return',
	},
	{
		displayName: 'Deep',
		name: 'deep',
		type: 'json',
		displayOptions: {
			show: {
				operation: ['findMany'],
			},
		},
		default: '{}',
		description: 'Deep filter and alias results',
	},
	{
		displayName: 'Record ID',
		name: 'recordId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				operation: ['findOne', 'update', 'delete'],
			},
		},
		default: '',
		description: 'The ID of the record',
	},
	{
		displayName: 'Data (JSON)',
		name: 'data',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				operation: ['create', 'update'],
			},
		},
		default: '{}',
		description: 'The data to create or update a record with',
	},
];
