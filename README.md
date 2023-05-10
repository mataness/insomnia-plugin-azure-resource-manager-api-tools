# Insomnia plugin for Azure Resource Manager
A set of utilities that can be used to query Azure Resource Manager API using [Insomnia REST Client](https://insomnia.rest/). Currently only contains a plugin that acquires JWT bearer tokens to query Azure Resource Manager

# Pre-requisites
This plugin is using "@azure/identity" to acquire tokens. You must have any of Azure CLI / Azure Powershell SDK / Visual Studio Credential installed on your machine and logged on.
The logged on user will be used to acquire tokens in this plugin.

# Usage
1. Open a new request, switch to the "Headers" tab,
2. In the header name field, enter `Authorization`,
3. In the value field type <kbd>control</kbd> + <kbd>space</kbd> and from the tag menu, select "Azure Identity Token"

 
