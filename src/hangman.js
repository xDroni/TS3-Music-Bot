const { sendPrivateMessage } = require('./utils');
const { TeamSpeakClient } = require('node-ts');

const entries = [
  //only letters and spaces
  'programowanie',
  'hemoglobina',
  'lekkoatletyka',
  'interpunkcja',
  'telekomunikacja',
  'metamorfoza',
  'urwiesz mi od internetu',
  'zwierzchnictwo',
  'antyterrorysta',
  'dźwiękonaśladownictwo',
  'antykoncepcja',
  'kolorowanka',
  'luminescencja',
  'onomatopeja',
  'aksjomat',
  'prawdopodobieństwo',
  'magnetoelektryczny',
  'malkontenctwo',
  'primaaprilisowy',
  'anatomopatologiczny',
  'deoksyrybonukleinowy'
];

/** @type {Map<number, HangmanGame>} */
let current_games = new Map();

class HangmanGame {
  /**
   * @param {TeamSpeakClient} client
   * @param {number} invokerid
   * */
  constructor(client, invokerid) {
    this.client = client;
    this.invokerid = invokerid;

    this.timeout = null;
    this._resetTimeout();

    /** @type {Set<string>} */
    this.guesses_history = new Set();
    this.target_entry = entries[(Math.random() * entries.length) | 0].toUpperCase();

    //NOTE: replace value is not regular ascii dash symbol but the long one
    // (https://www.fileformat.info/info/unicode/char/2014/index.htm)
    this.user_guess = this.target_entry.replace(/[a-ząęśćółżźń]/gi, '—');

    this.remaining_tries = 8;

    this.sendMsg('Gra w wisielca rozpoczęta');
  }

  onEnd() {
    if (this.timeout) clearTimeout(this.timeout);
  }

  sendMsg(msg) {
    sendPrivateMessage(this.client, this.invokerid, msg);
  }

  _resetTimeout() {
    if (this.timeout) clearTimeout(this.timeout);
    this.timeout = setTimeout(
      () => {
        this.sendMsg('Gra w wisielca zakończona z powodu zbyt długiej nieaktywności');
        endGame(this);
      },
      1000 * 60 * 3
    ); //3 minutes
  }

  _solved() {
    this.sendMsg(`Brawo!!! Hasło zostało odgadnięte: ${this.user_guess}`);
    endGame(this);
  }

  _wrongGuess() {
    if (--this.remaining_tries === 0) {
      this.sendMsg(`Zostałeś powieszony :( Hasło to: ${this.target_entry} Może następnym razem się uda.`);
      endGame(this);
    } else this.sendMsg(`Źle! ${this.user_guess} Pozostało prób: ${this.remaining_tries}`);
  }

  _repeatedGuess() {
    this.sendMsg(`Juz tego próbowałeś/aś. Nie powtarzaj odpowiedzi. ${this.user_guess}`);
  }

  /** @param {string} guess */
  onGuess(guess) {
    this._resetTimeout();

    if (guess.replace(/[^a-z ąęśćółżźń]/gi, '') !== guess) return this.sendMsg('W haśle nie ma nic prócz liter i spacji. Próba zignorowana.');

    guess = guess.toUpperCase();

    if (this.guesses_history.has(guess)) return this._repeatedGuess();
    this.guesses_history.add(guess);

    if (guess.length > 1) {
      if (this.target_entry === guess) {
        this.user_guess = this.target_entry;
        return this._solved();
      }
      return this._wrongGuess();
    } else {
      //single letter guess
      if (this.user_guess.indexOf(guess) !== -1) return this._repeatedGuess(); //should never occur

      let guess_index = this.target_entry.indexOf(guess);

      if (guess_index === -1) return this._wrongGuess();
      else {
        let arr = this.user_guess.split('');

        for (let i = 0; i < this.target_entry.length; i++) {
          if (this.target_entry[i] === guess) arr[i] = guess; //replace dash with user's guessed letter
        }

        this.user_guess = arr.join('');

        if (this.user_guess === this.target_entry) return this._solved();
        return this.sendMsg(`Litera ${guess} została odkryta ${this.user_guess}`);
      }
    }
  }
}

/** @param {HangmanGame} game */
function endGame(game) {
  game.onEnd();
  current_games.delete(game.invokerid);
}

module.exports = {
  /**
   * @param {TeamSpeakClient} client
   * @param {number} invokerid
   * */
  startGame(client, invokerid) {
    if (current_games.has(invokerid)) {
      sendPrivateMessage(client, invokerid, 'Nie możesz zacząć nowej gry dopóki nie zakończysz obecnej rozgrywki odgadując hasło lub poleceniem: !koniec');
      return;
    }

    current_games.set(invokerid, new HangmanGame(client, invokerid));
  },

  /**
   * @param {number} invokerid
   * @param {string} msg
   * */
  onPrivateMessage(invokerid, msg) {
    let game = current_games.get(invokerid);
    if (game) {
      if (!msg.startsWith('!'))
        //just a guess
        game.onGuess(msg);
      else {
        let [cmd /*, ...args*/] = msg.substring(1).split(' ');
        switch (cmd.toLowerCase()) {
          case 'help':
          default:
            game.sendMsg('Dostępne komendy:\n\t' + '!koniec - przerywa obecną grę\n\t' + '!help - wyświetla tę planszę\n\t' + '!wisielec - rozpoczyna grę w wisielca');
            break;
          case 'koniec':
          case 'end':
          case 'finish':
            game.sendMsg('Gra w wisielca zakończona');
            endGame(game);
            break;
        }
      }
    }
  }
};
