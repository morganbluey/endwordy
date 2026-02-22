let givenWord = "abcdefg";
let lastLetter = "";

function markLast() {
    const reversed = givenWord.split('').reverse().join('');
    document.getElementById('beforeWord').innerText = reversed;
    lastLetter = givenWord[givenWord.length - 1];
    document.getElementsByName('answerIn')[0].placeholder = 'Word with ' + lastLetter;
}

function initialize() {
    givenWord = "0009";
    lastLetter = "";

    setupEventListeners();

    document.getElementById('statusText').innerText = 'Your turn. Start by typing a word.'
    document.getElementsByName('answerIn')[0].placeholder = 'Type your word';
}

async function checkWord () {
    const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${givenWord}`;
    const response = await fetch(url, { method: "GET" });
    if (response.ok) {
        const wordInfo = await response.json();
        if (wordInfo && wordInfo[0].title === "No definition found") {
            document.getElementById('statusText').innerText = 'This word doesn\'t exist. Try again';
        } else if (wordInfo && wordInfo[0].word) {
            document.getElementById('statusText').innerText = 'It\'s your friends turn. Wait for their word.';
        } else {
            document.getElementById('statusText').innerText = 'Answer not in JSON. Please try again';
        }
    } else {
        document.getElementById('statusText').innerText = 'No answer. Please try again';
    }
}

function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkWord();
        } else {
            givenWord = document.getElementById('answerInput').value;
        }
    })
}

document.addEventListener('DOMContentLoaded', initialize);