import type {
  IAuthenticateGeneric,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from "n8n-workflow";

export class AceDataMinimaxApi implements ICredentialType {
  name = "aceDataMinimaxApi";
  displayName = "MiniMax H3 by AceDataCloud API";
  documentationUrl = "https://github.com/AceDataCloud/MinimaxN8N#credentials";
  icon = "file:../nodes/Minimax/icon.png" as const;
  properties: INodeProperties[] = [
    {
      displayName: "API Token",
      name: "apiToken",
      type: "string",
      typeOptions: { password: true },
      default: "",
      required: true,
      description: "Your AceDataCloud application API token",
    },
  ];
  authenticate: IAuthenticateGeneric = {
    type: "generic",
    properties: {
      headers: { Authorization: "=Bearer {{$credentials.apiToken}}" },
    },
  };
  test: ICredentialTestRequest = {
    request: {
      baseURL: "https://api.acedata.cloud",
      url: "/minimax/tasks",
      method: "POST",
      body: { action: "retrieve_batch", ids: [] },
    },
  };
}
