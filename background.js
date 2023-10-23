browser.webRequest.onBeforeRequest.addListener(
    interceptRequest,
    { urls: ["https://www.photopea.com/code/pp/pp.js", 'https://www.photopea.com/sw.js'] },
    ["blocking"]
)

const patches = [
    {
        search: 'console.clear()',
        replaceAll: true,
        value: "console.log('PAAA: prevented console.clear()')"
    },
    {
        search: 'ja.rF=function()',
        replaceAll: false,
        value: 'ja.rF=function(){return true};delete function()'
    }
]

function interceptRequest(requestDetails) {
    switch (requestDetails.url) {
        case 'https://www.photopea.com/code/pp/pp.js':
            return interceptPPRequest(requestDetails)
        
        case 'https://www.photopea.com/sw.js':
        default:
            console.log("Intercepted: ", requestDetails.url)
            return { cancel: true }
    }
}

async function interceptPPRequest(requestDetails) {
    console.log("Intercepted: ", requestDetails.url)

    const xhr = new XMLHttpRequest()
    xhr.open("GET", `${requestDetails.url}?circumvent`, false)
    xhr.send()

    if (xhr.status === 200) {
        console.log('Obtained original content')

        // Patch anti-adblock
        let ppContent = 'console.log("Loading modified pp.js");'
        ppContent += xhr.responseText

        for (const patch of patches) {
            console.log(`Patching '${patch.search}' to '${patch.value}'`)
            if (ppContent.includes(patch.search)) {
                console.log(`Found '${patch.search}' in pp.js`)
                if (patch.replaceAll) { 
                    ppContent = ppContent.replaceAll(patch.search, patch.value)
                } else {
                    ppContent = ppContent.replace(patch.search, patch.value)
                }
            } else {
                console.log(`Could not find '${patch.search}' in pp.js`)
            }
        }

        console.log('Patched anti-adblock')
        return { redirectUrl: "data:text/javascript," + encodeURIComponent(ppContent) }
    } else {
        throw new Error('Request failed with status code ' + xhr.status)
    }
}