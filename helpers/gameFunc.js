// ==> Game Helper Functions

const generatePossibleCards = function() {
    // ==> Perform a kertzic multiply between all possible options
    const cards = [2,3,4,5,6,7,8,9,10,'J','Q','K','A'];
    const shapes = ['♦','♣','♥','♠'];
    const possibleCards = [];
    for (let i = 0; i < cards.length; i++) {
      for (let j = 0; j < shapes.length; j++) {
        // ==> Fill the deck
        possibleCards.push({number: cards[i], suit: shapes[j]});
      }
    }
    return possibleCards;
};

const getRandomCard = function(possibleCards) {
    // ==> Take a card from the deck randomly, then update the deck by popping this random card from the deck
    const updatedPossibleCards = possibleCards;
    const randomIndex = Math.floor(Math.random() * updatedPossibleCards.length);
    const randomCard = updatedPossibleCards[randomIndex];
    updatedPossibleCards.splice(randomIndex, 1);
    return { randomCard, updatedPossibleCards };
};

const getCount = function(cards) {
    // ==> Getting the sum of the cards values in the player's hands
    const rearranged = [];

    // Reorder the cards in hand, so that the ace card will be the last one to count
    cards.forEach(card => {
      if (card.number === 'A') {
        // ==> Count an ace, and put it to be the last card in the array
        rearranged.push(card);
      } else if (card.number) {
        // ==> Count a regular card, and put it to be the first card in the array
        rearranged.unshift(card);
      }
    });
    
    // ==> Use a reducer to summarize the result, and decide how much to count for each
    return rearranged.reduce((total, card) => {
      if (card.number === 'J' || card.number === 'Q' || card.number === 'K') {
        // ==> For picture cards, count ten
        return total + 10;
      } else if (card.number === 'A') {
        // ==> For ace, decide if should count one or eleven, depending: if counting eleven will pass 21, then count as one, otherwise count as eleven
        return (total + 11 <= 21) ? total + 11 : total + 1;
      } else {
        // ==> For numeral cards, count the number as a usual sum
        return total + card.number;
      }
    }, 0);
};

const dealCards = function(possibleCards) {
    // ==> Use the deck and: take one card to the player's hand, then one card to the dealers hand, then one card again to the player's hand
    // ==> The deck will be automatically updated, so that next round we'll have only cards that have been left in the deck
    const playerCard1 = getRandomCard(possibleCards);
    const dealerCard1 = getRandomCard(playerCard1.updatedPossibleCards);
    const playerCard2 = getRandomCard(dealerCard1.updatedPossibleCards);    
    const playerStartingHand = [playerCard1.randomCard, playerCard2.randomCard];
    // ==> The dealer hand at the beggining will show one card we fetched from the deck and another "null" card, since other dealer cards are not exposed till then end of the game
    const dealerStartingHand = [dealerCard1.randomCard, {}];
    
    const player = {
      cards: playerStartingHand,
      count: getCount(playerStartingHand)
    };
    const dealer = {
      cards: dealerStartingHand,
      count: getCount(dealerStartingHand)
    };
    
    return {
      updatedPossibleCards: playerCard2.updatedPossibleCards, 
      player, 
      dealer,
    };
};

const dealerDraw = function(dealer, possibleCards) {
    // ==> Dealer takes cards before exposing the cards ==> Taking from the deck and saving to the dealer's cards
    const { randomCard, updatedPossibleCards } = getRandomCard(possibleCards);
    dealer.cards.push(randomCard);
    dealer.count = getCount(dealer.cards);
    return { dealer, updatedPossibleCards };
};

const getWinner = function(dealer, player) {
    // ==> Calculating the winner: dealer, player or dun
    if (dealer.count > player.count) {
      // ==> If dealer's sum is bigger (but not 21, since we validated it before calling the function) ==> dealer wins
      return 'dealer';
    } else if (dealer.count < player.count) {
      // ==> If player's sum is bigger (but not 21, since we validated it before calling the function) ==> player wins
      return 'player';
    } else {
      // ==> Dun
      return 'push';
    }
};

// ==> Expose game helper functions
exports.generatePossibleCards = generatePossibleCards;
exports.getRandomCard = getRandomCard;
exports.getCount = getCount;
exports.dealCards = dealCards;
exports.dealerDraw = dealerDraw;
exports.getWinner = getWinner;
