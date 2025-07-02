import {
	IHookFunctions,
	IWebhookFunctions,
	INodeType,
	INodeTypeDescription,
	IWebhookResponseData,
	INodeExecutionData,
	NodeConnectionType,
} from 'n8n-workflow';

export class WazzupTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Wazzup Trigger',
		name: 'wazzupTrigger',
		icon: 'file:wazzup.svg',
		group: ['trigger'],
		version: 3, // Version incremented due to new features
		description: 'Starts a workflow when Wazzup sends a webhook. Automatically registers and unregisters the webhook.',
		defaults: { name: 'Wazzup Trigger' },
		inputs: [],
		outputs: [NodeConnectionType.Main],
		credentials: [
			{
				name: 'wazzupApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'wazzup',
			},
		],
		properties: [
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'multiOptions',
				options: [
					{ name: 'Incoming/Outgoing Messages', value: 'messages' },
					{ name: 'Message Status Changes', value: 'statuses' },
					{ name: 'Phone Connection Status', value: 'phones' },
				],
				default: ['messages'],
				description:
					'Choose which event types should trigger this workflow. This also controls automatic webhook registration.',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				return false;
			},
			async create(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('wazzupApi');
				const webhookUrl = this.getNodeWebhookUrl('default');
				const eventTypes = this.getNodeParameter('eventType', ['messages']) as string[];

				// The Wazzup API uses a single flag for messages and statuses.
				const subscribeToMessagesAndStatuses =
					eventTypes.includes('messages') || eventTypes.includes('statuses');

				const body = {
					webhooksUri: webhookUrl,
					subscriptions: {
						messagesAndStatuses: subscribeToMessagesAndStatuses,
						// Note: 'contactsAndDealsCreation' and other subscriptions can be added here
						// if corresponding options are added to the UI.
					},
				};

				await this.helpers.httpRequest({
					method: 'PATCH',
					url: 'https://api.wazzup24.com/v3/webhooks',
					headers: {
						Authorization: `Bearer ${credentials.apiKey}`,
					},
					body,
					json: true,
				});

				return true;
			},
			async delete(this: IHookFunctions): Promise<boolean> {
				const credentials = await this.getCredentials('wazzupApi');

				// To unregister, we send a PATCH request with an empty webhooksUri.
				const body = {
					webhooksUri: '',
					subscriptions: {
						messagesAndStatuses: false,
					},
				};

				await this.helpers.httpRequest({
					method: 'PATCH',
					url: 'https://api.wazzup24.com/v3/webhooks',
					headers: {
						Authorization: `Bearer ${credentials.apiKey}`,
					},
					body,
					json: true,
				});

				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const eventTypesToListenFor = this.getNodeParameter('eventType', ['messages']) as string[];

		// Determine the type of the incoming event by checking which key exists in the body
		const incomingEventType = Object.keys(req.body)[0]; // e.g., 'messages', 'statuses'

		// If the event is not one we are listening for, stop the execution
		if (!eventTypesToListenFor.includes(incomingEventType)) {
			return { workflowData: [] };
		}

		const eventData = req.body[incomingEventType] as any[];
		if (eventData === undefined || eventData.length === 0) {
			return { workflowData: [] };
		}

		const returnData: INodeExecutionData[] = eventData.map((item) => ({
			json: item,
		}));

		return {
			workflowData: [returnData],
		};
	}
}
