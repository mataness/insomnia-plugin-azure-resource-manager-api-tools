const { DefaultAzureCredential } = require("@azure/identity");
const jwtDecode = require('jwt-decode');

const tokenProvider = new DefaultAzureCredential({});
const azureManagementEndpoint = "https://management.azure.com";
const subscriptionIdTemplateTag = "AzSubscriptionID";
const resourceGroupTemplateTag = "AzResourceGroup";
let storedSelectedSubscriptionId = "";

const validateContextOnSend = (context, templateTagName, resourceName) => {
    if (context.renderPurpose != 'send') {
        return;
    }

    alert(`You must select a ${resourceName} in ${templateTagName} tag`)

    context.setUrl("");

    throw "Invalid request";
}

const fetchArmResources = async (context, url, useCache) => {
    const insertionTimeKey = "insertionTime_" + url;
    const dataKey = "fetchdata_" + url;

    const now = new Date().getTime();

    let insertionTimeStr = await context.store.getItem(insertionTimeKey);

    if(useCache && insertionTimeStr) {
        let insertionTime = parseInt(insertionTimeStr);

        if(now - insertionTime > 1000 * 60 * 10) {
            await context.store.removeItem(insertionTimeKey);
            await context.store.removeItem(dataKey);
        } else {
            const cachedData = await context.store.getItem(dataKey);

            return JSON.parse(cachedData);
        }
    }

    const token = await await getTokenAsync(context, azureManagementEndpoint, false);

    const request = new Request(url, {
        method: "GET",
        headers: {
            "Authorization": "Bearer " + token
        },
    });

    const response = await fetch(request);
    const json = await response.text();

    if(useCache) {
        await context.store.setItem(insertionTimeKey, now.toString());
        await context.store.setItem(dataKey, json);
    }

    return JSON.parse(json);
}

const filterCollectionIgnoreCase = (collection, selector, queryFilter) => collection.value.filter(sub => !queryFilter || selector(sub).toLowerCase().includes(queryFilter.toLowerCase()));

const listCollection = (collection, selector, itemType) => {
    let idx = 0;
    const result = collection.map(sub => `${idx++}. ${selector(sub)}`);

    if (result.length == 0) {
        return `No matching ${itemType} was found`;
    }

    return result.join("\n");
}

const getTokenAsync = async (context, audience, forceRefresh) => {
    const insertionTimeKey = "insertionTime_" + audience;
    const jwtKey = "jwt_" + audience;

    let now = new Date().getTime();
    let insertionTimeStr = await context.store.getItem(insertionTimeKey);
    if (insertionTimeStr != null) {
        let insertionTime = parseInt(insertionTimeStr);

        if (now - insertionTime > 1000 * 60 * 30 || forceRefresh) {
            await context.store.removeItem(insertionTimeKey);
            await context.store.removeItem(jwtKey);
        } else {
            return await context.store.getItem(jwtKey);
        }

    }

    const token = await tokenProvider.getToken(audience);
    await context.store.setItem(insertionTimeKey, now.toString());
    await context.store.setItem(jwtKey, token.token);

    return token.token;
}

module.exports.templateTags = [
    {
        name: 'AzureIdentityToken',
        displayName: 'Azure Identity Token',
        description: 'Acquires Azure Active Directory on behalf of the logged in user using Azure Identity',
        args: [
            {
                displayName: 'Audience',
                description: 'The AAD token Audience, defaults to Azure Resource Manager',
                type: 'string',
                defaultValue: azureManagementEndpoint
            },
            {
                displayName: 'Force token refresh',
                description: 'When set to true, if the token is cached, it will invalidate the cached token',
                type: 'boolean',
                defaultValue: false
            }
        ],
        async run(context, audience, forceRefresh) {
            return await getTokenAsync(context, audience, forceRefresh);
        }
    },
    {
        displayName: subscriptionIdTemplateTag,
        name: subscriptionIdTemplateTag,
        description: 'Lists the subscription IDs and sets the variable according to the selected subscription ID',
        args: [
            {
                displayName: 'Selected subscription ID, copy from below. To see the list again clear this value',
                description: 'The selected subscription ID, copy from below. To see the list again clear this value',
                type: 'string'
            },
            {
                displayName: 'Query filter - used to filter the subscriptions list by the subscription display name',
                description: 'A filter that will be used to filter subscriptions by their display name',
                type: 'string'
            }
        ],
        async run(context, selectedSubscriptionId, queryFilter) {
            storedSelectedSubscriptionId = selectedSubscriptionId;
            if (selectedSubscriptionId) {
                return selectedSubscriptionId;
            }

            validateContextOnSend(context, subscriptionIdTemplateTag, "subscription")

            const subscriptions = await fetchArmResources(context, `${azureManagementEndpoint}/subscriptions?api-version=2022-11-01-preview`, true);
            const filteredSubscriptions = filterCollectionIgnoreCase(subscriptions, sub => sub.displayName, queryFilter);
            const collection = listCollection(filteredSubscriptions, sub => `${sub.displayName} - ${sub.subscriptionId}`, "subscription");

            const token = await getTokenAsync(context, azureManagementEndpoint, false);
            const claims = jwtDecode(token);

            return [
                `TenantID: ${claims.tid}`,
                `Logged in as ${claims.unique_name}`,
                "-------------------------------------",
                collection
            ].join("\n");
        }
    },
    {
        displayName: 'AzResourceGroup',
        name: 'AzResourceGroup',
        description: `Lists the resource groups under the subscription selected using ${subscriptionIdTemplateTag}`,
        args: [
            {
                displayName: 'Selected resource group, copy from below. To see the list again clear this value',
                description: 'The selected resource group, copy from below. To see the list again clear this value',
                type: 'string'
            },
            {
                displayName: 'Query filter - used to filter the resource group list by the resource group name',
                description: 'A filter that will be used to filter resource groups by their name',
                type: 'string'
            }
        ],
        async run(context, selectedResourceGroup, queryFilter) {

            if (selectedResourceGroup) {
                return selectedResourceGroup;
            }

            validateContextOnSend(context, resourceGroupTemplateTag, "resource group")


            if (!storedSelectedSubscriptionId) {
                return `You must select a subscription first using the ${subscriptionIdTemplateTag} tag`;
            }

            const resourceGroups = await fetchArmResources(context, `${azureManagementEndpoint}/subscriptions/${storedSelectedSubscriptionId}/resourceGroups?api-version=2022-11-01-preview`, true);
            const filteredResourceGroups = filterCollectionIgnoreCase(resourceGroups, resourceGroup => resourceGroup.name, queryFilter);

            return listCollection(filteredResourceGroups, rg => rg.name, "resource group");
        }
    }];