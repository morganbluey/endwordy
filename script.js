const statusNoExist = "This word doesn't exist. Try again.";
const statusFail = "There was a general problem. Please try again later.";

const statusDebugNoJSON = "Answer not in JSON format.";
const statusDebugNoAnswer = "No answer from the server.";

const textMyTurn = "Your turn. Start by typing a word.";
const textTheirTurn = "Friends turn. Wait for their word.";

const textNextTurn = "Find a next word. Friends word:";

const errorWrongStart = "Word doesn't start with correct letter."

let myWord = "abcdefg";
let friendsWord;
let lastLetter = "";
let myTurn;

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
    const checkIfUserIdExists = localStorage.getItem('endwordy_userID');
    const userID = (checkIfUserIdExists ? checkIfUserIdExists : setUserID());
    localStorage.setItem('endwordy_userID', userID);

    peer = new Peer(userID, { host: 'localhost', port: 9000, path: '/endwordy' });

    peer.on('open', (id) => {
        id = userID;
        document.getElementById('myCode').innerText = id;
    });

    peer.on('error', (err) => {
        console.error("Peer-Error:", err.type); //later out

        if (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-closed') {
            if (!peer.destroyed) {
                console.log("Reconnecting in 2 seconds..."); //later out
                setTimeout(() => {
                    if (peer.disconnected) peer.reconnect();
                }, 2000);
            }
        }

        if (err.type === 'unavailable-id') {
            console.warn("ID still taken. Waiting for Server-Timeout..."); // later out
        }
    });

    setupEventListeners();

    document.querySelector('.firstOpen').showModal();
    // document.getElementById('myCode').innerText = userID;

    peer.on('connection', (conn) => {
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
}

/**
 * disable input field and enter button.
 * display message to wait for friends word.
 * enter waiting state.
 */
function initializeTheirTurn() {
    document.getElementById('statusText').innerText = textTheirTurn;
    document.getElementsByName('answerIn')[0].hidden = true;
    document.querySelector('.firstOpen').close();
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

    if(friendsWord && myWord.length > 0 && myWord[0] != friendsWord[friendsWord.length - 1]) {
        document.getElementById('answerInput').className = 'error-border';
        document.getElementById('invalidAnswer').innerText = errorWrongStart;
        return;
    }

    // const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${givenWord}`;
    const url = `https://freedictionaryapi.com/api/v1/entries/en/${myWord}`;

    const response = await fetch(url, { method: "GET" });
    let currentStatus = "Big Prob. If Statement wasn't entered..."

    if (response.ok) {
        const wordInfo = await response.json();
        if (wordInfo) {
            if (wordInfo.entries.length > 0) {
                currentConnection.send({ type: "switchTurn", word: myWord });
                currentStatus = textTheirTurn;
                document.getElementById('answerInput').hidden = true;
                document.getElementById('beforeWord').innerText = '';
                document.getElementById('answerInput').value = '';
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
        document.getElementById('answerInput').classList.remove('error-border');
        document.getElementById('invalidAnswer').innerText = '';
        if (e.key === 'Enter') {
            checkWord();
        }
    });
    document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (peer) peer.disconnect(); 
    } else {
        if (peer && peer.disconnected) {
            peer.reconnect();
        }
    }
});
    document.getElementById('enterRoom').addEventListener('click', () => {
        const code = document.getElementById('friendCodeInput').value;
        if (peer && !peer.disconnected) {
            const conn = peer.connect(code);

            if (conn) {
                setupConnectionListeners(conn);
                
                myTurn = initialTurn();
                conn.on('open', () => {
                    conn.send({ type: "connectionOpen", turn: !myTurn });
                    myTurn ? initializeMyTurn() : initializeTheirTurn();
                });
            } else {
                console.error("Verbindung konnte nicht erstellt werden."); //later out or change
            }
        } else {
            alert("Peer ist noch nicht bereit oder die Verbindung zum Server ist unterbrochen."); //later out or change
        }
    });
}

function setupConnectionListeners(conn) {
    if (!conn) {
        console.error("Error: setupConnectionListeners was called without having a connection established!");
        return;
    }

    currentConnection = conn;

    conn.on('data', (data) => {
        if (data && data.type === "connectionOpen") {
            if (data.turn === true) {
                initializeMyTurn(); 
            } else {
                initializeTheirTurn();
            }
        }
        if (data && data.type && data.type === "switchTurn") {
            document.getElementById('statusText').innerText = textNextTurn;
            document.getElementById('answerInput').hidden = false;
            friendsWord = data.word;
            markLast();
        }
        console.log('Message:', data); //later out
    });

    conn.on('error', (err) => {
        console.log(err); //later out or change
    });

    // conn.on('close', () => {
    //     if (peer) peer.destroy();
    // });
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
    return id;
}

function initialTurn() {
    let turn = Math.round(Math.random());
    return Boolean(turn);
}

document.addEventListener('DOMContentLoaded', initialize);

window.addEventListener('beforeunload', () => {
    if (peer) {
        peer.destroy();
    }
});