const axios = require('axios')
const fs = require('fs')
const config = require('./config')

const fields = ['id', 'createdBy.name', 'createdAt', 'allowedKnowledgeMode', 'displayName', 'description', 'chatMessages_2m', 'chatMessages_c', 'totalUsers_2m', 'totalUsers_c']
const rows = []

async function start() {
    console.log('Fetching AI Apps')
    const token = config.gleanAuthToken
    const getAppsResponse = await getApplications(token)
    if (getAppsResponse.status < 400) {
        console.log('Fetched AI Apps :' + getAppsResponse.data.length)
    } else {
        console.log('Unable to fetch AI Apps :' + getAppsResponse.response.data)
    }
    const aiApps = getAppsResponse.data
    let count = aiApps.length

    for (const aiApp of aiApps) {
        console.log(`Processing AI APP - ${aiApp.id} with name - ${aiApp.displayName}`)
        const row = []
        const createdDate = new Date(aiApp.createdAt)
        const result = await getInsightsForAiApp(createdDate, aiApp.id)
        Object.assign(aiApp, result)
        for (const field of fields) {
            const nestedFields = field.split('.')
            let value = undefined
            nestedFields.forEach(nestedField => {
                value = value?.[nestedField] ?? aiApp[nestedField]
            })
            if (value !== undefined) {
                if (typeof value === 'string')
                    row.push('"' + value.trim().replaceAll('"', '""') + '"')
                else {
                    row.push(value)

                }

            }

        }
        console.log(`Processed AI APP - ${aiApp.id} - ${row.join(',')}`)
        rows.push(row.join(','))
        console.log('Apps Remaining ' + --count)
    }
    fs.writeFileSync('./results/data.csv', rows.join('\n'))
}



const today = new Date();

async function getInsightsForAiApp(createdDate, appId,token) {
    console.log(`Fetching insights for AI APP - ${appId}`)
    const startDaysFromNow = 60
    const daysFromCreation = parseInt((today - createdDate) / 1000 / 60 / 60 / 24)
    const requestDataForPast2MonthsStats = {
        "categories": [
            "AI_APPS"
        ],
        "dayRange": {
            "start": {
                "daysFromNow": startDaysFromNow
            },
            "end": {
                "daysFromNow": 1
            }
        },
        "aiAppRequestOptions": {
            "aiAppIds": [appId]
        },
    }
    const requestDataForCreatedStats = {
        "categories": [
            "AI_APPS"
        ],
        "dayRange": {
            "start": {
                "daysFromNow": daysFromCreation
            },
            "end": {
                "daysFromNow": 1
            }
        },
        "aiAppRequestOptions": {
            "aiAppIds": [appId]
        },
    }

    const requestForPast2MonthsStats = {
        url: `https://${config.gleanHost}-be.glean.com/api/v1/insights`,
        headers: {
            authorization: 'Bearer ' + token,
        },
        method: 'POST',
        data: requestDataForPast2MonthsStats
    }
    const requestForCreatedStats = {
        url: `https://${config.gleanHost}-be.glean.com/api/v1/insights`,
        headers: {
            authorization: 'Bearer ' + token,
            'x-glean-auth-type': 'oauth'
        },
        method: 'POST',
        data: requestDataForCreatedStats
    }
    const result = {
        chatMessages_c: 0,
        totalUsers_c: 0,
        chatMessages_2m: 0,
        totalUsers_2m: 0
    }
    try {
        const responses = await Promise.all([axios(requestForCreatedStats), axios(requestForPast2MonthsStats)])
        responses.forEach((response, index) => {
            const data = response.data
            if (index === 0) {
                result.chatMessages_c = data.aiApps.actionCounts.totalChatMessages ?? 0
                result.totalUsers_c = data.aiApps.totalActiveUsers ?? 0
            }
            if (index === 1) {
                result.chatMessages_2m = data.aiApps.actionCounts.totalChatMessages ?? 0
                result.totalUsers_2m = data.aiApps.totalActiveUsers ?? 0
            }
        })
        console.log(`Fetched insights for App Id - ${appId}`)
    } catch (exc) {
        exc.forEach(exc => {
            console.error(`Could not fetch insight for request - ${JSON.stringify(exc.request.data)}`)
            console.error(`Could not fetch insight with response - ${JSON.stringify(exc.response.data)}`)
        })
    } finally {
        return result
    }

}

async function getApplications(token) {
    const request = {
        url: `https://${config.gleanHost}-be.glean.com/api/v1/listchatapplications`,
        headers: {
            authorization: 'Bearer ' + token
        },
        method: 'POST',
    }

    try {
        const response = await axios(request)
        return { data: response.data.applications, status: 200 }
    } catch (exc) {
        return { data: exc.response.data, status: exc.response.status }
    }

}


start().then(console.log).catch(console.error)
