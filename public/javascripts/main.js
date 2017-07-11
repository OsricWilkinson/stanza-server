
function buildElement(name, classes) {
    var i, content
    var result = document.createElement(name);


    if (arguments.length > 2) {
        for (i = 2; i < arguments.length; i += 1) {
            content = arguments[i];
            switch (typeof content) {
                case "string":
                case "number":
                    result.appendChild(document.createTextNode(content));
                    break;
                default:
                    result.appendChild(content);
                    break;
            }
        }
    }

    return result;
}

function handleResponse(event) {
    var response;

    try {
        response = JSON.parse(event.data);
    } catch (ex) {
        console.log("Bad JSON", event);
        return;
    }

    var output = document.getElementById("output");

    output.appendChild( buildElement("div", undefined,
        JSON.stringify(response),
        buildElement("br")
    ));
}

function init() {
    var ws = new WebSocket("ws://localhost:9000/stream");

    ws.onmessage = handleResponse;

    document.getElementById("send").addEventListener("click", function () {
        var text = document.getElementById("input");

        var message = JSON.stringify({phrases:"0,1,2"});

        ws.send(message);

        text.value = "";
    }, false);
}

window.addEventListener("load", init, false)