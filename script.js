let givenWord = "abcdefg";
let lastLetter = "";

function markLast() {
    const reversed = givenWord.split('').reverse().join('');
    document.getElementById('beforeWord').innerText = reversed;
    lastLetter = givenWord[givenWord.length - 1];
    document.getElementsByName('answerIn')[0].placeholder = 'Word with ' + lastLetter;
}

markLast();