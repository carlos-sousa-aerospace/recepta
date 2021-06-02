"use strict";

async function* makeTextFileLineIterator(fileURL) {
    const utf8Decoder = new TextDecoder('utf-8');

    try {
        const response = await fetch(fileURL);

        if (!response.ok) {
            throw new Error('Error in network response');
        }

        const reader = response.body.getReader();
        let { value: chunk, done: readerDone } = await reader.read();
        chunk = chunk ? utf8Decoder.decode(chunk) : '';

        const re = /\n+(?!\r)|\r+(?!\n)|(?:\r\n)+/gm; // 1: See the note at the end of the page
        let startIndex = 0;
        let result;

        for (;;) {
            let result = re.exec(chunk);
            if (!result) {
                if (readerDone) {
                    break;
                }
                let remainder = chunk.substr(startIndex);
                ({ value: chunk, done: readerDone } = await reader.read());
                chunk = remainder + (chunk ? utf8Decoder.decode(chunk) : '');
                startIndex = re.lastIndex = 0;
                continue;
            }
            yield chunk.substring(startIndex, result.index);
            startIndex = re.lastIndex;
        }

        if (startIndex < chunk.length) {
            // last line didn't end in a newline char
            yield chunk.substr(startIndex);
        }
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
        alert("It is possible that you have just clicked on index.html from your file explorer.\n" +
            "Please try to have this site hosted on a live server for the Fetch API to work properly.\n" +
            "Try running index.html from Live server for Visual Code, Xampp or other server that is" +
            "compatible with your system.");
    }
}

async function readText() {
    // =================================================================== //
    // ==  Mapping from the Spanish Description to the English title    == //
    // =================================================================== //
    //
    // This mapping is necesary because the english titles are not
    // available in the source text file (textos.md)
    const sectionTitle = {
        "Nombre de la receta": "name",
        "Descripción receta": "introduction",
        "Ingredientes": "ingredients",
        "Preparación": "directions"
    };

    // =================================================================== //
    // ==         Fetching text from file asyncronously                 == //
    // =================================================================== //
    let currentKey;
    const data = {};
    const reSearch = /\s*#{2}\s+/;
    const reMatch = /[^\s#](?:.*)/;
    for await (let line of makeTextFileLineIterator("../resources/textos.md")) {
        if (line.search(reSearch) !== -1) {
            line = line.match(reMatch)[0];
            currentKey = sectionTitle[line];
            data[currentKey] = [];
        } else {
            data[currentKey].push(line);
        }
    }

    // =================================================================== //
    // ==          Construct nodes to go inside each section            == //
    // =================================================================== //

    // Page Title
    const header = document.getElementById("top-header-title");
    header.textContent = data["name"];

    // Introduction
    const paragraph = document.createElement("p");
    paragraph.textContent = data["introduction"]; // 2: See note at end of page
    document.querySelector(".introduction").appendChild(paragraph);

    // Ingredients
    createArticle("ingredients", data);

    // Directions
    createArticle("directions", data);
}

function createArticle(key, textLines) {
    const paragraph = document.createElement("p");
    paragraph.textContent = key;
    document.querySelector("." + key + " .section-title").appendChild(paragraph);

    let list = document.querySelector("." + key + " .list");
    let item;
    for (let line of textLines[key]) {
        item = document.createElement("li");
        item.textContent = line;
        list.appendChild(item);
    }
}

window.onload = function() {
    // =================================================================== //
    // ==              Read the text from resource file                 == //
    // =================================================================== //

    readText();

    // =================================================================== //
    // ==                Set container background image                 == //
    // =================================================================== //
    // 
    const container = document.getElementById("container");
    container.style.backgroundImage = "none";
    container.style.opacity = "1";

    // =================================================================== //
    // ==                Set foreground elements                        == //
    // =================================================================== //
    // 
    const image = document.getElementById("header-img");
    image.style.opacity = "1";

    const mainForeground = document.querySelector("main");
    mainForeground.style.opacity = "1";

    // =================================================================== //
    // ==                     Background Button                         == //
    // =================================================================== //
    const button = document.getElementById("switchBg");
    button.value = "background off";

    // =================================================================== //
    // ==             Foreground Opacity Slider                         == //
    // =================================================================== //

    const label = document.querySelector("#switchBg-container > label");
    label.style.visibility = "hidden";

    const slider = document.getElementById("opacity-slider");
    slider.style.visibility = "hidden";

    // =================================================================== //
    // ==             Background Button Event Listener                  == //
    // =================================================================== //
    button.addEventListener("click", function() {
        const container = document.getElementById("container");

        if (container.style.backgroundImage == "none") {
            container.style.backgroundImage = "url('../img/original-image.jpg')";
            button.value = "background on";
            button.style.color = "white";
            button.style.borderColor = "white";
            label.style.visibility = "visible";
            slider.style.visibility = "visible";
            slider.value = "0.7";
            image.style.opacity = "0.7";
            mainForeground.style.opacity = "0.7";
        } else {
            container.style.backgroundImage = "none";
            button.value = "background off";
            button.style.color = "darkgrey";
            button.style.borderColor = "darkgrey";
            label.style.visibility = "hidden";
            slider.style.visibility = "hidden";
            image.style.opacity = "1";
            mainForeground.style.opacity = "1";
        }
    }, false);

    // =================================================================== //
    // ==             Foreground Slider Event Listener                  == //
    // =================================================================== //

    slider.addEventListener("input", function(e) {
        const opacity = e.currentTarget.value;
        image.style.opacity = opacity;
        mainForeground.style.opacity = opacity;
    })
}


// ========================================================================================= //
// === Note 1:                                                                           === //
// ========================================================================================= //
// Carlos Sousa colapsed end-of-line regex
//
// Regex expression meaning for /\n+(?!\r)|\r+(?!\n)|(?:\r\n)+/gm
// Regular expression search that matches three alternative patterns
//
//  / is the Regex separator
//
//
//---------------------------------------------------------------------------------------------
// First alternative: \n+(?!\r)
//
// \n+ matches a line-feed (newline) character (ASCII 10)
//
// + Quantifier — Matches between one and unlimited times, as many times as possible,
// giving back as needed (greedy)
//
// Negative Lookahead (?!\r):
//    Assert that the Regex below does not match
//
// \r matches a carriage return (ASCII 13)
//
//
//---------------------------------------------------------------------------------------------
// Second alternative: \r+(?!\n)
//
// \r+ matches a carriage return (ASCII 13)
//
// + Quantifier — Matches between one and unlimited times, as many times as possible,
// giving back as needed (greedy)
//
// Negative Lookahead (?!\n):
//    Assert that the Regex below does not match
//
// \n matches a line-feed (newline) character (ASCII 10)
//
//
//---------------------------------------------------------------------------------------------
// Third alternative: (?:\r\n)+
//
// Non-capturing group (?:\r\n)+
//
// + Quantifier — Matches between one and unlimited times, as many times as possible,
// giving back as needed (greedy)
//
// \r matches a carriage return (ASCII 13)
//
// \n matches a line-feed (newline) character (ASCII 10)
//
//
//---------------------------------------------------------------------------------------------
// Global pattern flags
// g modifier: global. All matches (don't return after first match)
// m modifier: multi line. Causes ^ and $ to match the begin/end of each line
// (not only begin/end of string)
//
//
// ========================================================================================= //
// === Note 2:                                                                           === //
// ========================================================================================= //
// While this will work and is a common method of adding content to an element,
// there is a possible cross-site scripting (XSS) risk associated with using the
// innerHTML method, as inline JavaScript can be added to an element.
// Therefore, it is recommended to use textContent instead, which will strip out
// HTML tags if they are present.