const statusSuccess = "It's your friends turn. Wait for their word.";
const statusNoExist = "This word doesn't exist. Try again.";
const statusFail = "There was a general problem. Please try again later.";

const statusDebugNoJSON = "Answer not in JSON format.";
const statusDebugNoAnswer = "No answer from the server.";

const textMyTurn = "Your turn. Start by typing a word.";
const textTheirTurn = "It's your friends turn. Wait for their word.";

let myWord = "abcdefg";
let friendsWord;
let lastLetter = "";
let myTurn;
let initialized = false;

let peer;
let currentConnection;


/**
 * Function for visual highlighting of the last letter of previous word, 
 * so user knows, with which letter to start the next word.
 */
function markLast() {
    const reversed = friendsWord.split('').reverse().join('');
    document.getElementById('beforeWord').innerText = reversed;
    lastLetter = friendsWord[friendsWord.length - 1];
    document.getElementsByName('answerIn')[0].placeholder = 'Word with ' + lastLetter;
}

function initialize() {
    myWord = "0009";
    lastLetter = "";

    setupEventListeners();

    myTurn = initialTurn();

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
 * enable all buttons and checks and input fields.
 * show message to think of random word.
 */
function initializeMyTurn() {
    document.getElementById('statusText').innerText = textMyTurn;
    document.getElementsByName('answerIn')[0].placeholder = 'Type your word';
    document.querySelector('.firstOpen').close();
    initialized = true;
}

/**
 * disable input field and enter button.
 * display message to wait for friends word.
 * enter waiting state.
 */
function initializeTheirTurn() {
    document.getElementById('statusText').innerText = textTheirTurn;
    document.getElementsByName('answerIn')[0].disabled = true;
    document.querySelector('.firstOpen').close();
    initialized = true;
}

/**
 * ig on.data receive specific message type, like { "switchTurn", <word> }
 * - enable enter button
 * - make input field appear
 * - display text that its my turn plus on which letter the next word needs to be
 */
// function waitforMyTurn() {
//     conn.on('data', (data) => {
//         if (data && data.type && data.type === "switchTurn") {
//             document.getElementById('answerInput').hidden = false;
//             friendsWord = data.word;
//             markLast();
//         }
//     })
// }

/**
 * This function sends the word provided in the input field to an online dictionary API,
 * which checks, if the word exists.
 */
async function checkWord() {
    myWord = document.getElementById('answerInput').value;

    // const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${givenWord}`;
    const url = `https://freedictionaryapi.com/api/v1/entries/en/${myWord}`;

    const response = await fetch(url, { method: "GET" });
    let currentStatus = "Big Prob. If Statement wasn't entered..."

    if (response.ok) {
        const wordInfo = await response.json();
        if (wordInfo) {
            if (wordInfo.entries.length > 0) {
                currentConnection.send({ type: "switchTurn", word: myWord });
                currentStatus = statusSuccess;
                document.getElementById('answerInput').hidden = true;
                document.getElementById('beforeWord').innerText = '';
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
            console.log(myTurn);
            conn.send({ type: "connectionOpen", turn: !myTurn });
            console.log(myTurn);
            if (myTurn === true) {
                initializeMyTurn(); 
            } else {
                initializeTheirTurn();
            }
            initialized = true;
        }
    });
}

function setupConnectionListeners(conn) {
    currentConnection = conn;

    conn.on('open', () => {
        console.log("Connection established")
    });

    conn.on('data', (data) => {
        if (data && data.type && data.type === "connectionOpen" && !initialized) {
            if (data.turn === true) {
                initializeMyTurn(); 
            } else {
                initializeTheirTurn();
            }
            initialized = true;
        }
        if (data && data.type && data.type === "switchTurn") {
            document.getElementById('answerInput').hidden = false;
            friendsWord = data.word;
            markLast();
        }
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

function initialTurn() {
    let turn = Math.round(Math.random());
    return Boolean(turn);
}

document.addEventListener('DOMContentLoaded', initialize);