const statusSuccess = "It's your friends turn. Wait for their word.";
const statusNoExist = "This word doesn't exist. Try again.";
const statusFail = "There was a general problem. Please try again later.";

const statusDebugNoJSON = "Answer not in JSON format.";
const statusDebugNoAnswer = "No answer from the server.";

let givenWord = "abcdefg";
let lastLetter = "";

let peer;
let currentConnection;


/**
 * Function for visual highlighting of the last letter of previous word, 
 * so user knows, with which letter to start the next word.
 */
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

    const userID = localStorage.getItem('endwordy_userID');
    if (!userID) localStorage.setItem('endwordy_userID', setUserID());

    peer = new Peer(userID);
    peer.on('open', (id) => {
        console.log('My Peer is ready with ID:', id); // later out!
    });

    document.querySelector('.firstOpen').showModal();
    document.getElementById('myCode').innerText = userID;

    peer.on('connection', (conn) => {
        currentConnection = conn;
        setupConnectionListeners(conn);
    });
}

/**
 * This function sends the word provided in the input field to an online dictionary API,
 * which checks, if the word exists.
 */
async function checkWord() {
    givenWord = document.getElementById('answerInput').value;

    // const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${givenWord}`;
    const url = `https://freedictionaryapi.com/api/v1/entries/en/${givenWord}`;

    const response = await fetch(url, { method: "GET" });
    let currentStatus = "Big Prob. If Statement wasn't entered..."

    if (response.ok) {
        const wordInfo = await response.json();
        if (wordInfo) {
            if (wordInfo.entries.length > 0) {
                currentStatus = statusSuccess;
            } else {
                currentStatus = statusNoExist;
            }
        } else {
            currentStatus = statusDebugNoJSON;
        }
    } else {
        currentStatus = statusDebugNoAnswer;
    }
    // else { currentStatus = statusFail; }

    document.getElementById('statusText').innerText = currentStatus;
}

/**
 * This function registers all event listeners, such as key down events
 */
function setupEventListeners() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkWord();
        }
    });
    document.getElementById('enterRoom').addEventListener('click', () => {
        const code = document.getElementById('friendCodeInput').value;
        if (peer) {
            const conn = peer.connect(code);
            setupConnectionListeners(conn);
        }
    });
}

function setupConnectionListeners(conn) {
    currentConnection = conn;

    conn.on('open', () => {
        conn.send('My future name.');
        console.log("Erfolgreich verbunden mit ID:", conn.peer);
    });

    conn.on('data', (data) => {
        console.log('Message:', data);
    });

    conn.on('error', (err) => {
        console.log(err); //later out or change
    });
}

/**
 * Helper function, to create a unique user ID, if non existent yet.
 * @returns the randomly generated user ID
 */
function setUserID() {
    let id = "";
    for(let i = 0; i < 6; i++) {
        id = id + Math.floor(Math.random() * 10);
    }
    return Number(id);
}

document.addEventListener('DOMContentLoaded', initialize);