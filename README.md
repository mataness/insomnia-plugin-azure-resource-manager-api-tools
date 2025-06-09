
# Insomnia plugin for Azure Resource Manager

A set of utilities that can be used to query Azure Resource Manager API using [Insomnia REST Client](https://insomnia.rest/):

  

 1. Acquires JWT bearer tokens to query Azure Resource Manager
 2. Lists all available subscriptions and stores the selected subscription as variable
 3. Lists all available resource groups under the selected subscription and stores the selected resource group as variable

  
  

# Pre-requisites

This plugin is using "@azure/identity" to acquire tokens. You must have any of Azure CLI / Azure Powershell SDK / Visual Studio Credential installed on your machine and logged on.

The logged on user will be used to acquire tokens in this plugin.

  

# Usage

## To acquire JWT bearer token:
1. Open a new request, in the 'Auth' tab, select `Bearer`,
2. In the value field type <kbd>control</kbd> + <kbd>space</kbd> and from the tag menu, select "Azure Identity Token".

## To select a subscription and use it as a URL parameter
1. In the url, type <kbd>control</kbd> + <kbd>space</kbd> and from the tag menu, select "AzSubscriptionID"
2. Too see all available subscriptions, click on the  "AzSubscriptionID" tag. Paste the selected subscription ID in the relevant text box
3. 
## To select a resource group and use it as a URL parameter
1. You first must select a subscription ID using the "AzSubscriptionID" tag
2. In the url, type <kbd>control</kbd> + <kbd>space</kbd> and from the tag menu, select "AzResourceGroup"
3. Too see all available resource groups, click on the  "AzResourceGroup" tag. Paste the selected resource group in the relevant text box

# Known issues
1. Error: unknown block tag: AzureIdentityToken - As the plugin uses Azure.Identity library behind the scenes. This library often relies on the Azure CLI or other developer tools under the hood (e.g., AzureCliCredential, VisualStudioCredential) to authenticate. These methods require shell access and permission to execute external process, therefore, the plugin needs to run with elevated access, which is true by default on older versions of Insomnia. In newer versions of Insomnia, you need to enable the relevant checkbox in Insomnia's plugin preferences.