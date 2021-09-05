import { Factory } from 'rosie';
import Card from '../../src/card';
import Utils from '../../src/utils';
import { cardRankToValue } from '../../src/types';

export default new Factory<Card>()
  .sequence('id')
  .attrs({
    suit: Utils.randomSuit(),
    rank: Utils.randomRank(),
    showingFace: true,
    on: () => () => undefined,
  })
  .attr(
    'attributes',
    ['id', 'suit', 'rank', 'showingFace'],
    (id, suit, rank, showingFace) => () => ({
      id,
      suit,
      rank,
      showingFace,
    })
  )
  .attr('value', ['rank'], cardRankToValue);
