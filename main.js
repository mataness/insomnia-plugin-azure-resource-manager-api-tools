const { DefaultAzureCredential } = require("@azure/identity");
const tokenProvider = new DefaultAzureCredential({});

module.exports.templateTags = [{
    name: 'AzureIdentityToken',
    displayName: 'Azure Identity Token',
    description: 'Acquires Azure Active Directory on behalf of the logged in user using Azure Identity',
    args: [
        {
            displayName: 'Audience',
            description: 'The AAD token Audience, defaults to Azure Resource Manager',
            type: 'string',
            defaultValue: "https://management.azure.com"
        },
        {
            displayName: 'Force token refresh',
            description: 'When set to true, if the token is cached, it will invalidate the cached token',
            type: 'boolean',
            defaultValue: false
        }
    ],
    async run(context, audience, forceRefresh) {
        let insertionTimeKey = "insertionTime_" + audience;
        let jwtKey = "jwt_" + audience;

        let now = new Date().getTime();
        let insertionTimeStr = await context.store.getItem(insertionTimeKey);
        if (insertionTimeStr != null) {
            let number = parseInt(insertionTimeStr);

            if (now - number > 1000 * 60 * 30 || forceRefresh) {
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
}];