const NAME = 'Ticket';

const SYMBOL = 'TCKT';

const START_TIME = Math.round(Date.now() / 1000) + 5 * 60;

const END_TIME = START_TIME + 2 * 60 * 60;

module.exports = { NAME, SYMBOL, START_TIME, END_TIME };
